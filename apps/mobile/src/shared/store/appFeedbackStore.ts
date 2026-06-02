import { create } from "zustand";

export type AppToastTone = "neutral" | "success" | "warning" | "error";

export type AppToastInput = {
  tone?: AppToastTone;
  text: string;
  durationMs?: number;
};

type QueuedToast = {
  durationMs: number;
  id: number;
  text: string;
  tone: AppToastTone;
};

export type AppDialogAction = {
  label: string;
  onPress?: () => void;
  variant?: "default" | "destructive";
};

export type AppDialogConfig = {
  dismissOnBackdropPress?: boolean;
  message: string;
  primaryAction: AppDialogAction;
  secondaryAction?: AppDialogAction;
  title: string;
};

type AppFeedbackState = {
  activeToast: QueuedToast | null;
  dialog: AppDialogConfig | null;
  dismissToast: () => void;
  hideDialog: () => void;
  showDialog: (config: AppDialogConfig) => void;
  showToast: (toast: AppToastInput) => void;
  toastQueue: QueuedToast[];
};

const DEFAULT_TOAST_DURATION_MS = 3200;

let nextToastId = 1;

export const useAppFeedbackStore = create<AppFeedbackState>((set) => ({
  activeToast: null,
  dialog: null,
  toastQueue: [],
  showToast: (toast) =>
    set((state) => {
      const queuedToast: QueuedToast = {
        durationMs: toast.durationMs ?? DEFAULT_TOAST_DURATION_MS,
        id: nextToastId++,
        text: toast.text,
        tone: toast.tone ?? "neutral",
      };

      if (!state.activeToast) {
        return {
          activeToast: queuedToast,
        };
      }

      return {
        toastQueue: [...state.toastQueue, queuedToast],
      };
    }),
  dismissToast: () =>
    set((state) => {
      if (state.toastQueue.length === 0) {
        return {
          activeToast: null,
        };
      }

      const [nextToast, ...remainingToastQueue] = state.toastQueue;

      return {
        activeToast: nextToast,
        toastQueue: remainingToastQueue,
      };
    }),
  showDialog: (config) =>
    set({
      dialog: config,
    }),
  hideDialog: () =>
    set({
      dialog: null,
    }),
}));

export function showAppToast(toast: AppToastInput) {
  useAppFeedbackStore.getState().showToast(toast);
}

export function dismissAppToast() {
  useAppFeedbackStore.getState().dismissToast();
}

export function showAppDialog(config: AppDialogConfig) {
  useAppFeedbackStore.getState().showDialog(config);
}

export function hideAppDialog() {
  useAppFeedbackStore.getState().hideDialog();
}
