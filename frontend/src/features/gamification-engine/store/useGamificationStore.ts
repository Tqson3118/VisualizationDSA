import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { StreakCalculator } from '../engine/StreakCalculator';
import { GamificationEngine } from '../engine/GamificationEngine';
import { CONFETTI_DURATION_MS, MAX_STREAK_FREEZES, LEADERBOARD_TOP_N } from '../types/gamification.types';
import type { LeaderboardEntry, UserProgressState } from '../types/gamification.types';
import { gamificationApi } from '../../../services/gamificationApi';
import { leaderboardApi } from '../../../services/leaderboardApi';
import { getStoredToken } from '../../../services/apiClient';

export const useGamificationStore = defineStore('gamification-engine', () => {
  const currentXP = ref(0), activeStreak = ref(0), lastActiveDate = ref('');
  const unlockedBadges = ref<string[]>([]), showConfetti = ref(false), leaderboardRank = ref(0);
  const streakFreezesCount = ref(MAX_STREAK_FREEZES), leaderboardData = ref<LeaderboardEntry[]>([]);
  const isSyncing = ref(false), syncError = ref<string | null>(null);

  const allBadges = computed(() => GamificationEngine.getBadgeTemplates());
  const lockedBadges = computed(() => allBadges.value.filter(b => !unlockedBadges.value.includes(b.id)));
  const nextBadgeXPThreshold = computed(() => {
    const locked = lockedBadges.value;
    return locked.length === 0 ? 0 : [...locked].sort((a, b) => a.xpThresholdRequired - b.xpThresholdRequired)[0].xpThresholdRequired;
  });
  const xpProgressPercent = computed(() => nextBadgeXPThreshold.value === 0 ? 100 : Math.min(100, Math.round((currentXP.value / nextBadgeXPThreshold.value) * 100)));
  const streakStatus = computed<'active' | 'inactive'>(() => activeStreak.value > 0 ? 'active' : 'inactive');
  const isOnlineMode = computed(() => !!getStoredToken());

  function earnXPLocal(amount: number): void {
    if (!GamificationEngine.validateXPAmount(amount)) return;
    const todayStr = StreakCalculator.getAdjustedDate(new Date());
    currentXP.value += amount;
    const { nextStreak, shouldUpdate } = StreakCalculator.calculateUpdatedStreak(lastActiveDate.value, activeStreak.value, todayStr);
    if (shouldUpdate) { activeStreak.value = nextStreak; lastActiveDate.value = todayStr; }
    checkAndUnlockBadges();
  }

  function checkAndUnlockBadges(): void {
    const userState: UserProgressState = { userId: 'current-user', totalXP: currentXP.value, activeStreak: activeStreak.value, lastActiveDate: lastActiveDate.value, unlockedBadges: unlockedBadges.value, streakFreezesCount: streakFreezesCount.value };
    const newUnlocked = GamificationEngine.checkNewUnlockedBadges(userState);
    if (newUnlocked.length > 0) { unlockedBadges.value.push(...newUnlocked); triggerConfettiRain(); }
  }

  const triggerConfettiRain = () => { showConfetti.value = true; setTimeout(() => { showConfetti.value = false; }, CONFETTI_DURATION_MS); };
  const useStreakFreeze = () => streakFreezesCount.value > 0 ? (streakFreezesCount.value--, true) : false;
  const setLeaderboardData = (data: LeaderboardEntry[]) => leaderboardData.value = [...data].sort((a, b) => a.rank - b.rank).slice(0, LEADERBOARD_TOP_N);
  const setStreakForTesting = (streak: number) => { activeStreak.value = streak; };

  async function earnXPWithSync(amount: number, reason: string): Promise<void> {
    earnXPLocal(amount);
    if (!isOnlineMode.value) return;
    try {
      isSyncing.value = true; syncError.value = null;
      currentXP.value = (await gamificationApi.awardXP(amount, reason)).totalXP;
    } catch { syncError.value = 'Không thể đồng bộ XP với server'; }
    finally { isSyncing.value = false; }
  }

  async function syncProgressFromServer(): Promise<void> {
    if (!isOnlineMode.value) return;
    try {
      isSyncing.value = true; syncError.value = null;
      const progress = await gamificationApi.getUserProgress();
      currentXP.value = progress.totalXP; activeStreak.value = progress.streakDays;
      if (progress.badges) unlockedBadges.value = progress.badges.map(b => b.badgeId);
    } catch { syncError.value = 'Không thể tải dữ liệu tiến trình'; }
    finally { isSyncing.value = false; }
  }

  async function checkBadgesFromServer(): Promise<void> {
    if (!isOnlineMode.value) return;
    try {
      const newBadges = await gamificationApi.checkNewBadges();
      if (newBadges.length > 0) {
        newBadges.forEach(b => { if (!unlockedBadges.value.includes(b.id)) unlockedBadges.value.push(b.id); });
        triggerConfettiRain();
      }
    } catch { syncError.value = 'Không thể kiểm tra huy hiệu mới'; }
  }

  async function fetchLeaderboardFromServer(top: number = LEADERBOARD_TOP_N): Promise<void> {
    try {
      isSyncing.value = true; syncError.value = null;
      const entries = await leaderboardApi.getTopPlayers(top);
      leaderboardData.value = entries.map(e => ({ userId: e.username, fullName: e.username, weeklyXP: e.totalXP, rank: e.rank }));
    } catch { syncError.value = 'Không thể tải bảng xếp hạng'; }
    finally { isSyncing.value = false; }
  }

  return {
    currentXP, activeStreak, lastActiveDate, unlockedBadges, showConfetti, leaderboardRank, streakFreezesCount, leaderboardData, isSyncing, syncError,
    allBadges, lockedBadges, nextBadgeXPThreshold, xpProgressPercent, streakStatus, isOnlineMode,
    earnXPLocal, checkAndUnlockBadges, triggerConfettiRain, useStreakFreeze, setLeaderboardData, setStreakForTesting,
    earnXPWithSync, syncProgressFromServer, checkBadgesFromServer, fetchLeaderboardFromServer
  };
});
