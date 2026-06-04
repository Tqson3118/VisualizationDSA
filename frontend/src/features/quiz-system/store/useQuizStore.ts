import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useLectureStore } from '../../e-lecture/store/useLectureStore';
import { useAnimationStore } from '../../animation-engine/store/useAnimationStore';
import { QuizVerificationEngine } from '../engine/QuizVerificationEngine';
import { QuizStatsManager } from '../engine/QuizStatsManager';
import type { QuizQuestion, QuizCheckpoint, CanvasNodeDTO } from '../types/quiz.types';
import { submitQuizAttempt } from '../service/quizApi';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { resetActiveQuestionState, verifyAndRecordOption } from './quizStoreHelpers';

export const useQuizStore = defineStore('quizSystem', () => {
  const lectureStore = useLectureStore();
  const animStore = useAnimationStore();

  const activeQuestion = ref<QuizQuestion | null>(null);
  const selectedAnswerIndex = ref<number | null>(null);
  const isSubmitted = ref(false), isCorrect = ref(false);
  const feedbackExplanation = ref(''), matchedNodeId = ref<string | null>(null);
  const isCanvasTargetMode = ref(false);
  const checkpoints = ref<QuizCheckpoint[]>([]);
  const completedCheckpointIndexes = ref<number[]>([]);
  const sessionCorrect = ref(0), sessionTotal = ref(0);

  const isLectureLockedByQuiz = computed(() => activeQuestion.value !== null);
  const isQuizActive = computed(() => activeQuestion.value !== null);
  const sessionAccuracy = computed(() => sessionTotal.value === 0 ? 0 : Math.round((sessionCorrect.value / sessionTotal.value) * 100));
  const allCheckpointsCompleted = computed(() => checkpoints.value.length > 0 && checkpoints.value.every(cp => completedCheckpointIndexes.value.includes(cp.frameIndex)));

  function loadCheckpoints(quizCheckpoints: QuizCheckpoint[]): void {
    checkpoints.value = quizCheckpoints;
    completedCheckpointIndexes.value = [];
    sessionCorrect.value = 0; sessionTotal.value = 0;
  }

  function checkFrameForQuiz(frameIndex: number): void {
    if (activeQuestion.value !== null || completedCheckpointIndexes.value.includes(frameIndex)) return;
    const checkpoint = checkpoints.value.find(cp => cp.frameIndex === frameIndex);
    if (checkpoint) triggerCheckpointQuestion(checkpoint.question, frameIndex);
  }

  function triggerCheckpointQuestion(question: QuizQuestion, frameIndex: number): void {
    activeQuestion.value = question; selectedAnswerIndex.value = null;
    isSubmitted.value = false; isCorrect.value = false;
    feedbackExplanation.value = ''; matchedNodeId.value = null;
    isCanvasTargetMode.value = question.type === 'CANVAS_TARGET';
    lectureStore.lockLectureInteraction();
    if (!completedCheckpointIndexes.value.includes(frameIndex)) completedCheckpointIndexes.value.push(frameIndex);
  }

  function submitOptionAnswer(index: number): void {
    if (!activeQuestion.value || isSubmitted.value) return;
    selectedAnswerIndex.value = index; isSubmitted.value = true;
    const result = verifyAndRecordOption(index, activeQuestion.value, sessionCorrect, sessionTotal);
    isCorrect.value = result.isCorrect; feedbackExplanation.value = result.explanation;
  }

  function handleCanvasClickAnswer(clickX: number, clickY: number, nodes: CanvasNodeDTO[]): void {
    if (!activeQuestion.value || isSubmitted.value || activeQuestion.value.type !== 'CANVAS_TARGET') return;
    const result = QuizVerificationEngine.verifyCanvasClickAnswer(clickX, clickY, nodes, activeQuestion.value);
    if (!result.matchedNodeId) return;
    isSubmitted.value = true; isCorrect.value = result.isCorrect;
    feedbackExplanation.value = result.explanation; matchedNodeId.value = result.matchedNodeId ?? null;
    isCanvasTargetMode.value = false; sessionTotal.value++;
    if (result.isCorrect) sessionCorrect.value++;
    QuizStatsManager.saveAttempt(result.isCorrect, activeQuestion.value.id);
  }

  const dismissQuestionAndContinue = (): void => {
    resetActiveQuestionState(activeQuestion, selectedAnswerIndex, isSubmitted, isCorrect, feedbackExplanation, matchedNodeId, isCanvasTargetMode);
    lectureStore.unlockLectureInteraction();
  };

  const resetQuizStore = (): void => {
    resetActiveQuestionState(activeQuestion, selectedAnswerIndex, isSubmitted, isCorrect, feedbackExplanation, matchedNodeId, isCanvasTargetMode);
    checkpoints.value = []; completedCheckpointIndexes.value = [];
    sessionCorrect.value = 0; sessionTotal.value = 0;
  };

  async function syncSessionToServer(quizId: string): Promise<void> {
    if (sessionTotal.value === 0) return;
    const authStore = useAuthStore();
    const passed = sessionCorrect.value / sessionTotal.value >= 0.6;
    await submitQuizAttempt({ quizId, score: sessionCorrect.value, maxScore: sessionTotal.value, passed }, authStore.getAccessToken());
  }

  return {
    activeQuestion, selectedAnswerIndex, isSubmitted, isCorrect, feedbackExplanation,
    matchedNodeId, isCanvasTargetMode, checkpoints, completedCheckpointIndexes,
    sessionCorrect, sessionTotal,
    isLectureLockedByQuiz, isQuizActive, sessionAccuracy, allCheckpointsCompleted,
    loadCheckpoints, checkFrameForQuiz, triggerCheckpointQuestion,
    submitOptionAnswer, handleCanvasClickAnswer, dismissQuestionAndContinue,
    resetQuizStore, syncSessionToServer,
  };
});
