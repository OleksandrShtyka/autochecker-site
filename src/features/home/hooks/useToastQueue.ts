"use client";

import { useEffect, useRef, useState } from "react";
import type { ActionFeedback, ToastItem } from "../types";

const TOAST_LIFETIME_MS = 4200;

const SOUNDS: Partial<Record<string, string>> = {
  success: "/sounds/success.mp3",
  error:   "/sounds/error.mp3",
  info:    "/sounds/notify.mp3",
};

function playSound(tone: string) {
  const src = SOUNDS[tone];
  if (!src) return;
  try {
    const audio = new Audio(src);
    audio.volume = 0.45;
    void audio.play();
  } catch {
    // ignore — autoplay may be blocked
  }
}

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const dismissToast = (id: string) => {
    const timeoutId = timeoutsRef.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutsRef.current[id];
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const pushToast = (feedback: ActionFeedback) => {
    const id = crypto.randomUUID();
    const toast: ToastItem = {
      id,
      title: feedback.title,
      description: feedback.description,
      tone: feedback.tone,
    };

    playSound(feedback.tone);
    setToasts((current) => [...current, toast].slice(-4));
    timeoutsRef.current[id] = window.setTimeout(() => {
      dismissToast(id);
    }, TOAST_LIFETIME_MS);
  };

  return {
    dismissToast,
    pushToast,
    toastLifetimeMs: TOAST_LIFETIME_MS,
    toasts,
  };
}
