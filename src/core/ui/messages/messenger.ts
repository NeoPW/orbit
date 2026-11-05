export const MESSAGE_DURATION_MS = 3000;

export interface MessageAction {
  label: string;
  run: () => void;
}

export interface MessageInput {
  text: string;
  /** Icon kind; `success` by default. */
  kind?: 'success' | 'info' | 'error';
  action?: MessageAction;
}

export interface Message extends Required<Pick<MessageInput, 'text' | 'kind'>> {
  /** Changes with every shown message, so the view can tell a replacement from the same message. */
  id: number;
  action?: MessageAction;
}

export interface Messenger {
  current(): Message | null;
  subscribe(listener: () => void): () => void;
  /** Shows a message, replacing the one shown, for the full duration. */
  show(input: MessageInput): void;
  dismiss(): void;
  /** Pointer over or focus inside the card: stop the countdown. */
  pause(): void;
  /** Pointer left and focus gone: count the full duration again. */
  resume(): void;
  /** Runs the message's action and closes it. */
  runAction(): void;
}

export function createMessenger(options: { durationMs?: number } = {}): Messenger {
  const durationMs = options.durationMs ?? MESSAGE_DURATION_MS;
  const listeners = new Set<() => void>();
  let message: Message | null = null;
  let nextId = 1;
  let paused = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function emit() {
    listeners.forEach((l) => l());
  }

  function startTimer() {
    clearTimeout(timer);
    timer = setTimeout(dismiss, durationMs);
  }

  function dismiss() {
    clearTimeout(timer);
    paused = false;
    if (message === null) return;
    message = null;
    emit();
  }

  return {
    current: () => message,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    show(input) {
      message = { id: nextId++, text: input.text, kind: input.kind ?? 'success', action: input.action };
      if (!paused) startTimer();
      emit();
    },
    dismiss,
    pause() {
      if (message === null) return;
      paused = true;
      clearTimeout(timer);
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (message !== null) startTimer();
    },
    runAction() {
      const action = message?.action;
      dismiss();
      action?.run();
    },
  };
}
