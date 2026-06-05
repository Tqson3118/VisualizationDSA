/**
 * usePaymentStore.ts — Pinia store quản lý luồng thanh toán Premium.
 * Tích hợp với StatelessPaymentApi (không cần PostgreSQL / SePay).
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { statelessPaymentApi } from '../services/statelessPaymentApi';
import type {
  StatelessOrderDto,
  StatelessPaymentConfig,
  StatelessPremiumStatus,
} from '../services/statelessPaymentApi';

export const usePaymentStore = defineStore('payment', () => {
  const authStore = useAuthStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const currentOrder   = ref<StatelessOrderDto | null>(null);
  const paymentConfig  = ref<StatelessPaymentConfig | null>(null);
  const premiumStatus  = ref<StatelessPremiumStatus | null>(null);
  const isLoading      = ref(false);
  const paymentError   = ref<string | null>(null);
  const checkoutState  = ref<'idle' | 'paying' | 'verifying' | 'success' | 'error'>('idle');

  // ── Getters ────────────────────────────────────────────────────────────────
  const isPremium = computed(() => {
    if (premiumStatus.value?.isPremium) return true;
    return authStore.currentUser?.isPremium ?? false;
  });

  const premiumPrice = computed(() => paymentConfig.value?.premiumPrice ?? 199_000);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function loadConfig(): Promise<void> {
    try {
      paymentConfig.value = await statelessPaymentApi.getConfig();
    } catch { /* silent — config is optional */ }
  }

  async function loadPremiumStatus(): Promise<void> {
    const userId = authStore.statelessUser?.id ?? authStore.currentUser?.id;
    if (!userId) return;
    try {
      premiumStatus.value = await statelessPaymentApi.getPremiumStatus(String(userId));
    } catch { /* silent */ }
  }

  async function startCheckout(paymentMethod = 'vietqr'): Promise<void> {
    isLoading.value = true;
    paymentError.value = null;

    const userId = authStore.statelessUser?.id ?? String(authStore.currentUser?.id ?? 'demo-user-001');
    try {
      const order = await statelessPaymentApi.checkout(userId, paymentMethod);
      currentOrder.value = order;
      checkoutState.value = 'paying';
    } catch (err: unknown) {
      paymentError.value = err instanceof Error ? err.message : 'Không thể tạo hóa đơn.';
      checkoutState.value = 'error';
    } finally {
      isLoading.value = false;
    }
  }

  async function verifyPayment(): Promise<void> {
    if (!currentOrder.value) return;
    isLoading.value = true;
    checkoutState.value = 'verifying';

    const userId = authStore.statelessUser?.id ?? String(authStore.currentUser?.id ?? 'demo-user-001');
    try {
      const result = await statelessPaymentApi.verify(currentOrder.value.id, userId);
      currentOrder.value = result;

      if (result.status === 'Completed') {
        checkoutState.value = 'success';
        // Sync premium status to auth store
        if (authStore.currentUser) {
          authStore.currentUser.isPremium = true;
        }
        await loadPremiumStatus();
      }
    } catch (err: unknown) {
      paymentError.value = err instanceof Error ? err.message : 'Xác nhận thanh toán thất bại.';
      checkoutState.value = 'error';
    } finally {
      isLoading.value = false;
    }
  }

  async function simulatePaymentSuccess(): Promise<void> {
    if (!currentOrder.value) return;
    isLoading.value = true;

    try {
      const result = await statelessPaymentApi.simulateWebhook(currentOrder.value.id);
      currentOrder.value = result;
      checkoutState.value = 'success';
      if (authStore.currentUser) {
        authStore.currentUser.isPremium = true;
      }
      await loadPremiumStatus();
    } catch (err: unknown) {
      paymentError.value = err instanceof Error ? err.message : 'Mô phỏng thanh toán thất bại.';
    } finally {
      isLoading.value = false;
    }
  }

  function resetCheckout(): void {
    currentOrder.value = null;
    checkoutState.value = 'idle';
    paymentError.value = null;
  }

  async function checkFeatureAccess(featureId: string): Promise<boolean> {
    if (isPremium.value) return true;
    const userId = authStore.statelessUser?.id ?? String(authStore.currentUser?.id ?? 'demo-user-001');
    try {
      const result = await statelessPaymentApi.checkFeatureAccess(featureId, userId);
      return result.hasAccess;
    } catch {
      return false;
    }
  }

  return {
    currentOrder, paymentConfig, premiumStatus, isLoading, paymentError, checkoutState,
    isPremium, premiumPrice,
    loadConfig, loadPremiumStatus, startCheckout, verifyPayment,
    simulatePaymentSuccess, resetCheckout, checkFeatureAccess,
  };
});
