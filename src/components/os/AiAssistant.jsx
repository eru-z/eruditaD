import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Copy, Pencil, RefreshCw, Send, Square, Sparkles, Trash2, Minimize2, X } from "lucide-react";
import { askPortfolioAssistant, getAssistantActions, STARTER_QUESTIONS, trackAssistantMetric } from "../../services/aiService.js";

const SUGGESTIONS = STARTER_QUESTIONS;

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Hi - I'm Erudita's assistant. Ask me about her projects, services, skills, technologies or contact information.",
};
const LEGACY_CHAT_STORAGE_KEY = "erudita_ai_chat_history";
const MAX_SESSION_MESSAGES = 40;

function createMessage(role, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
  };
}

function limitMessages(messages) {
  return messages.slice(-MAX_SESSION_MESSAGES);
}

function renderInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function MessageText({ text }) {
  const blocks = String(text || "").split(/(```[\s\S]*?```)/g);

  return blocks.map((block, index) => {
    if (block.startsWith("```") && block.endsWith("```")) {
      const code = block.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/```$/, "");
      return (
        <pre key={index} className="my-2 overflow-x-auto rounded-xl bg-[#07111F] p-3 text-[11px] leading-5 text-white">
          <code>{code}</code>
        </pre>
      );
    }

    return block.split("\n").map((line, lineIndex) => {
      const trimmed = line.trim();
      if (/^[-*]\s+/.test(trimmed)) {
        return <p key={`${index}-${lineIndex}`}>{"\u2022"} {renderInline(trimmed.replace(/^[-*]\s+/, ""))}</p>;
      }
      return <p key={`${index}-${lineIndex}`}>{renderInline(line)}</p>;
    });
  });
}

export default function AiAssistant({ open, onOpenChange, showLauncher = true }) {
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState(() => [createMessage(INITIAL_MESSAGE.role, INITIAL_MESSAGE.text)]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const requestActiveRef = useRef(false);

  useEffect(() => {
    localStorage.removeItem(LEGACY_CHAT_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (open) {
      trackAssistantMetric("totalOpens");
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  const runAssistant = async (history, q) => {
    const text = q.trim();
    if (!text || pending || requestActiveRef.current) return;

    const userMessage = createMessage("user", text);
    const assistantMessage = createMessage("assistant", "");
    setMessages(limitMessages([...history, userMessage, assistantMessage]));
    setInput("");
    setEditingId("");
    setPending(true);
    requestActiveRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await askPortfolioAssistant({
        history: history.map((message) => ({ role: message.role, content: message.text })),
        question: text,
        onChunk: (chunk, fullText = chunk) => {
          setMessages((current) => {
            const next = [...current];
            const index = next.findIndex((message) => message.id === assistantMessage.id);
            if (index >= 0) next[index] = { ...next[index], text: fullText };
            return limitMessages(next);
          });
        },
        signal: controller.signal,
      });
      const reply = result.text;

      setMessages((current) => {
        const next = [...current];
        const index = next.findIndex((message) => message.id === assistantMessage.id);
        if (index >= 0) {
          next[index] = {
            ...next[index],
            text: reply || "Confirmed information is not available yet.",
            actions: getAssistantActions(text, reply),
          };
        }
        return limitMessages(next);
      });
    } catch (error) {
      if (error.name === "AbortError") {
        setMessages((current) => {
          const stopped = current.find((message) => message.id === assistantMessage.id);
          return stopped?.text ? current : current.filter((message) => message.id !== assistantMessage.id);
        });
        return;
      }
      setMessages((current) =>
        limitMessages([
          ...current.filter((message) => message.id !== assistantMessage.id),
          createMessage("assistant", error.message || "I could not reach the portfolio assistant right now. Please try again in a moment."),
        ])
      );
    } finally {
      abortRef.current = null;
      requestActiveRef.current = false;
      setPending(false);
    }
  };

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || pending) return;
    trackAssistantMetric("totalQuestions");

    if (editingId) {
      const editIndex = messages.findIndex((message) => message.id === editingId);
      if (editIndex >= 0) {
        await runAssistant(messages.slice(0, editIndex), q);
        return;
      }
    }

    await runAssistant(limitMessages(messages), q);
  };

  const regenerateLast = () => {
    if (pending) return;
    const lastAssistantIndex = [...messages].map((message) => message.role).lastIndexOf("assistant");
    if (lastAssistantIndex <= 0) return;
    const previous = messages.slice(0, lastAssistantIndex);
    const lastUserIndex = [...previous].map((message) => message.role).lastIndexOf("user");
    if (lastUserIndex < 0) return;
    runAssistant(previous.slice(0, lastUserIndex), previous[lastUserIndex].text);
  };

  const copyText = async (text) => {
    await navigator.clipboard?.writeText(text).catch(() => {});
  };

  const editMessage = (message) => {
    if (pending) return;
    setEditingId(message.id);
    setInput(message.text);
    inputRef.current?.focus();
  };

  return (
    <>
      {showLauncher && (
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-label={open ? "Close AI portfolio assistant" : "Open AI portfolio assistant"}
          aria-expanded={open}
          title={open ? "Close AI assistant" : "Ask the AI assistant"}
          className="ai-assistant-launcher group inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[#2563EB] shadow-[0_20px_50px_-18px_rgba(37,99,235,0.55)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/85"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2563EB]/15 via-transparent to-[#38BDF8]/20" />
          <Sparkles size={22} className="relative" />
          <span className="pointer-events-none absolute -inset-1 rounded-full ring-1 ring-white/40" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            role="dialog"
            aria-modal="false"
            aria-label="Portfolio Assistant"
            initial={reduced ? false : { opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="ai-assistant-panel w-[min(400px,calc(100vw-2.5rem))] overflow-hidden rounded-[28px] border border-white/70 bg-white/75 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl"
          >
            <div className="ai-assistant-header flex items-center gap-3 border-b border-white/60 bg-white/40 px-4 py-3">
              <span className="ai-assistant-avatar grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,.6)]">
                <Bot size={17} />
              </span>
              <div className="flex-1">
                <p className="ai-assistant-title text-[12px] font-black tracking-[-0.01em] text-[#07111F]">Portfolio Assistant</p>
                <p className="ai-assistant-subtitle text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">Erudita Intelligence {"\u00b7"} Beta</p>
              </div>
              <button type="button" onClick={() => setMessages([createMessage(INITIAL_MESSAGE.role, INITIAL_MESSAGE.text)])} aria-label="Clear chat" className="ai-assistant-control grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/70 text-[#334155] transition hover:bg-white">
                <Trash2 size={13} />
              </button>
              <button type="button" onClick={() => onOpenChange(false)} aria-label="Minimize assistant" className="ai-assistant-control grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/70 text-[#334155] transition hover:bg-white">
                <Minimize2 size={13} />
              </button>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Close assistant"
                className="ai-assistant-control grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/70 text-[#334155] transition hover:bg-white"
              >
                <X size={14} />
              </button>
            </div>

            <div ref={scrollRef} className="ai-assistant-messages max-h-[340px] space-y-2.5 overflow-y-auto px-4 py-4">
              {messages.map((m, index) => (
                <div key={m.id} className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[85%] flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`ai-assistant-message ${m.role === "user" ? "is-user" : "is-bot"} rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-[19px] ${
                        m.role === "user"
                          ? "bg-[#2563EB] text-white shadow-[0_10px_24px_-14px_rgba(37,99,235,.7)]"
                          : "border border-white/70 bg-white/85 text-[#07111F]"
                      }`}
                    >
                      {m.text ? <MessageText text={m.text} /> : <span className="font-bold text-[#64748B]">Thinking...</span>}
                      {index === 0 && m.role === "assistant" && (
                        <span className="ai-assistant-welcome-robot" aria-hidden="true"><Bot size={34} strokeWidth={1.8} /></span>
                      )}
                    </div>
                    {m.actions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.actions.map((action) => <a className="ai-assistant-action" href={action.href} key={action.href} onClick={() => onOpenChange(false)}>{action.label}</a>)}
                      </div>
                    )}
                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      {m.role === "assistant" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => copyText(m.text)}
                            aria-label="Copy assistant response"
                            className="grid h-6 w-6 place-items-center rounded-full border border-white/70 bg-white/80 text-[#475569] transition hover:bg-white hover:text-[#2563EB]"
                          >
                            <Copy size={11} />
                          </button>
                          {m.text && (
                            <button
                              type="button"
                              onClick={regenerateLast}
                              disabled={pending}
                              aria-label="Regenerate response"
                              className="grid h-6 w-6 place-items-center rounded-full border border-white/70 bg-white/80 text-[#475569] transition hover:bg-white hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <RefreshCw size={11} />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => editMessage(m)}
                          disabled={pending}
                          aria-label="Edit message"
                          className="grid h-6 w-6 place-items-center rounded-full border border-white/70 bg-white/80 text-[#475569] transition hover:bg-white hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ai-assistant-suggestions flex flex-wrap gap-1.5 border-t border-white/60 bg-white/40 px-4 py-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { trackAssistantMetric("suggestedQuestions", s); send(s); }}
                  disabled={pending}
                  className="ai-assistant-suggestion rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-bold text-[#334155] transition hover:bg-white hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="ai-assistant-form flex items-center gap-2 border-t border-white/60 bg-white/60 px-3 py-3"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={editingId ? "Edit your message..." : "Ask about anything..."}
                rows={1}
                className="ai-assistant-input max-h-24 flex-1 resize-none rounded-2xl border border-white/70 bg-white/85 px-3.5 py-2 text-[12.5px] leading-5 text-[#07111F] outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-70"
              />
              <button
                type={pending ? "button" : "submit"}
                onClick={pending ? () => abortRef.current?.abort() : undefined}
                aria-label={pending ? "Stop generating" : "Send"}
                disabled={!pending && !input.trim()}
                className="ai-assistant-avatar grid h-9 w-9 place-items-center rounded-full bg-[#2563EB] text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,.75)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {pending ? <Square size={13} /> : <Send size={14} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
