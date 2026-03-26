"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../styles";
import { cx } from "../utils";
import { useAISettings, type AITone, type AILanguage } from "../hooks/useAISettings";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME_ID = "welcome";

const TONE_OPTIONS: { value: AITone; label: string; desc: string }[] = [
  { value: "friendly",     label: "Friendly",      desc: "Warm & casual"     },
  { value: "professional", label: "Professional",   desc: "Formal language"   },
  { value: "technical",    label: "Technical",      desc: "Dev-focused"       },
  { value: "brief",        label: "Brief",          desc: "Short answers"     },
];

const LANG_OPTIONS: { value: AILanguage; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "uk",   label: "Ukrainian"   },
  { value: "en",   label: "English"     },
  { value: "ru",   label: "Russian"     },
  { value: "pl",   label: "Polish"      },
  { value: "de",   label: "German"      },
  { value: "fr",   label: "French"      },
  { value: "es",   label: "Spanish"     },
];

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className={styles.aiCode}>{part.slice(1, -1)}</code>;
    if (part === "\n") return <br key={i} />;
    return part;
  });
}

export function HelperAI() {
  const { settings, update, mounted } = useAISettings();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: WELCOME_ID, role: "assistant", content: "" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && !showSettings) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open, showSettings]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!mounted) return null;
  if (!settings.enabled) return null;

  const welcomeText = `Hi! I'm **${settings.name}** — ask me anything about AutoChecker or programming in general.`;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages.filter((m) => m.id !== WELCOME_ID), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          settings: { tone: settings.tone, language: settings.language, name: settings.name },
        }),
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
            {showSettings && (
              <button
                type="button"
                className={styles.aiHeaderBack}
                onClick={() => setShowSettings(false)}
                aria-label="Back to chat"
              >
                <BackIcon />
              </button>
            )}
            <div className={styles.aiHeaderIcon}><SparkIcon /></div>
            <div>
              <p className={styles.aiHeaderName}>{settings.name}</p>
              <p className={styles.aiHeaderSub}>
                {showSettings ? "Settings" : "Powered by HelperAI"}
              </p>
            </div>
          </div>
          <div className={styles.aiHeaderActions}>
            {!showSettings && (
              <button
                type="button"
                className={styles.aiHeaderGear}
                onClick={() => setShowSettings(true)}
                aria-label="AI settings"
              >
                <GearIcon />
              </button>
            )}
            <button
              type="button"
              className={styles.aiHeaderClose}
              onClick={() => { setOpen(false); setShowSettings(false); }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </div>

        {showSettings ? (
          /* ── Settings panel ── */
          <div className={styles.aiSettingsPanel}>

            {/* Name */}
            <div className={styles.aiSettingsGroup}>
              <p className={styles.aiSettingsGroupLabel}>Assistant Name</p>
              <input
                className={styles.aiSettingsInput}
                value={settings.name}
                onChange={(e) => update({ name: e.target.value || "Helper AI" })}
                placeholder="Helper AI"
                maxLength={24}
              />
            </div>

            {/* Language */}
            <div className={styles.aiSettingsGroup}>
              <p className={styles.aiSettingsGroupLabel}>Response Language</p>
              <select
                className={styles.aiSettingsSelect}
                value={settings.language}
                onChange={(e) => update({ language: e.target.value as AILanguage })}
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div className={styles.aiSettingsGroup}>
              <p className={styles.aiSettingsGroupLabel}>Tone</p>
              <div className={styles.aiTonePills}>
                {TONE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={cx(styles.aiTonePill, settings.tone === o.value && styles.aiTonePillActive)}
                    onClick={() => update({ tone: o.value })}
                  >
                    <span className={styles.aiTonePillLabel}>{o.label}</span>
                    <span className={styles.aiTonePillDesc}>{o.desc}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <>
            {/* Messages */}
            <div className={styles.aiMessages}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cx(styles.aiMsg, msg.role === "user" ? styles.aiMsgUser : styles.aiMsgBot)}
                >
                  {msg.role === "assistant" && (
                    <div className={styles.aiMsgAvatar}><SparkIcon /></div>
                  )}
                  <div className={styles.aiMsgBubble}>
                    {renderText(msg.id === WELCOME_ID ? welcomeText : msg.content)}
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
          </>
        )}
      </div>

      {/* Floating trigger button */}
      <button
        type="button"
        className={cx(styles.aiTrigger, open && styles.aiTriggerOpen)}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Open ${settings.name}`}
      >
        <span className={styles.aiTriggerIcon}>
          {open ? <CloseIcon /> : <SparkIcon />}
        </span>
        {!open && <span className={styles.aiTriggerLabel}>{settings.name}</span>}
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

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
