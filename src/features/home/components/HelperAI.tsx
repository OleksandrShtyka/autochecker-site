"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../styles";
import { cx } from "../utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm **Helper AI** — ask me anything about AutoChecker or programming in general.",
};

function renderText(text: string) {
  // Minimal markdown: **bold**, `code`, newlines
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className={styles.aiCode}>{part.slice(1, -1)}</code>;
    }
    if (part === "\n") {
      return <br key={i} />;
    }
    return part;
  });
}

export function HelperAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json() as { reply?: string; message?: string };

      if (!res.ok || !data.reply) {
        const errText = res.status === 429
          ? "⏳ Rate limit reached — please wait a few seconds and try again."
          : `⚠ ${data.message ?? "Something went wrong."}`;
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: errText },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply! },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "⚠ Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      {/* Chat panel */}
      <div className={cx(styles.aiPanel, open && styles.aiPanelOpen)} aria-hidden={!open}>
        {/* Header */}
        <div className={styles.aiHeader}>
          <div className={styles.aiHeaderLeft}>
            <div className={styles.aiHeaderIcon}>
              <SparkIcon />
            </div>
            <div>
              <p className={styles.aiHeaderName}>Helper AI</p>
              <p className={styles.aiHeaderSub}>Powered by HelperAI</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.aiHeaderClose}
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className={styles.aiMessages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cx(styles.aiMsg, msg.role === "user" ? styles.aiMsgUser : styles.aiMsgBot)}
            >
              {msg.role === "assistant" && (
                <div className={styles.aiMsgAvatar}>
                  <SparkIcon />
                </div>
              )}
              <div className={styles.aiMsgBubble}>
                {renderText(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className={cx(styles.aiMsg, styles.aiMsgBot)}>
              <div className={styles.aiMsgAvatar}><SparkIcon /></div>
              <div className={cx(styles.aiMsgBubble, styles.aiTyping)}>
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.aiInputRow}>
          <textarea
            ref={inputRef}
            className={styles.aiInput}
            placeholder="Ask anything…"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            type="button"
            className={cx(styles.aiSendBtn, (!input.trim() || loading) && styles.aiSendBtnDisabled)}
            onClick={() => void sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Floating trigger button */}
      <button
        type="button"
        className={cx(styles.aiTrigger, open && styles.aiTriggerOpen)}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Helper AI"
      >
        <span className={styles.aiTriggerIcon}>
          {open ? <CloseIcon /> : <SparkIcon />}
        </span>
        {!open && <span className={styles.aiTriggerLabel}>Helper AI</span>}
      </button>
    </>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z"
        fill="currentColor" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6L18 18"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
