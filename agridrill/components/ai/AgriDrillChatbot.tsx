"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const SUGGESTED_QUESTIONS = [
  {
    label: "Machine Status",
    text: "What is the current machine status?",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6l4 2"
        />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    label: "Hole Count",
    text: "How many holes have been drilled?",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 20h8" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 8h12M6 16h12"
        />
        <path d="M9 4v16M15 4v16" />
      </svg>
    ),
  },
  {
    label: "Latest Operation",
    text: "What is the latest operation?",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 18h16M6 18V9l6-5 6 5v9"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 18v-5h6v5"
        />
      </svg>
    ),
  },
  {
    label: "Recent Alerts",
    text: "Were there any recent alerts?",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 21h4"
        />
      </svg>
    ),
  },
];

export default function AgriDrillChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Tracks the currently active AI request.
  const abortControllerRef = useRef<AbortController | null>(null);

  // Changes whenever a new chat starts.
  // This prevents stale responses from an older chat
  // from being inserted into the new conversation.
  const chatGenerationRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(
        () => textareaRef.current?.focus(),
        250
      );

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Cleanup active AI request when the component is unmounted.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const startNewChat = () => {
    // Invalidate the previous conversation immediately.
    chatGenerationRef.current += 1;

    // Cancel any active AI request.
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setMessages([]);
    setInput("");
    setIsTyping(false);
    setError(null);
  };

  const renderInlineMarkdown = (text: string): ReactNode => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (
        part.startsWith("**") &&
        part.endsWith("**") &&
        part.length >= 4
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatAIResponse = (content: string): ReactNode[] => {
    const lines = content.split(/\r?\n/);
    const elements: ReactNode[] = [];

    let listType: "ul" | "ol" | null = null;
    let listItems: string[] = [];

    const flushList = () => {
      if (!listType || listItems.length === 0) {
        listType = null;
        listItems = [];
        return;
      }

      if (listType === "ul") {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="list-disc space-y-1.5 pl-5"
          >
            {listItems.map((item, index) => (
              <li key={index}>
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className="list-decimal space-y-1.5 pl-5"
          >
            {listItems.map((item, index) => (
              <li key={index}>
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
      }

      listType = null;
      listItems = [];
    };

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();

      if (!line) {
        flushList();
        return;
      }

      const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
      const orderedMatch = line.match(/^\d+\.\s+(.*)$/);

      if (unorderedMatch) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }

        listItems.push(unorderedMatch[1]);
        return;
      }

      if (orderedMatch) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }

        listItems.push(orderedMatch[1]);
        return;
      }

      flushList();

      elements.push(
        <p
          key={`p-${index}`}
          className="leading-6"
        >
          {renderInlineMarkdown(line)}
        </p>
      );
    });

    flushList();

    return elements;
  };

  const sendMessage = async (messageText?: string) => {
    const text = (messageText ?? input).trim();

    if (!text || isTyping) {
      return;
    }

    setError(null);

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    // Save the current chat generation for this request.
    const requestGeneration = chatGenerationRef.current;

    // Create an AbortController for the current request.
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json();

      // Ignore any response that belongs to an old chat.
      if (
        controller.signal.aborted ||
        chatGenerationRef.current !== requestGeneration
      ) {
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to get a response from AgriDrill AI."
        );
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data.reply ||
          "AgriDrill AI did not return a response.",
        createdAt: new Date().toISOString(),
      };

      // Double-check that this request still belongs
      // to the current chat before adding the response.
      if (
        controller.signal.aborted ||
        chatGenerationRef.current !== requestGeneration
      ) {
        return;
      }

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

        } catch (error) {
      // Deliberate cancellation should not show an error.
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      // Ignore errors from stale requests.
      if (
        chatGenerationRef.current !== requestGeneration
      ) {
        return;
      }

      // Restore the user's text so they don't have to retype it
      // after a genuine failure (not a cancellation, not stale).
      setInput(text);

      console.error("AgriDrill AI error:", error);

      setInput(text);

      setError(
        "AgriDrill AI is temporarily unavailable. Please try again."
      );
    } finally {

      // Only clear the active controller if it is still
      // the controller belonging to this request.
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      // Do not let an old request change the typing state
      // of a newer conversation.
      if (
        chatGenerationRef.current === requestGeneration
      ) {
        setIsTyping(false);
      }
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[9000]">
        <div
          className={`pointer-events-auto absolute bottom-[92px] right-4 w-[calc(100vw-2rem)] max-w-[430px] origin-bottom-right transition-all duration-300 sm:right-6 ${
            isOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-5 scale-95 opacity-0"
          }`}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90">
            <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 top-24 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative overflow-hidden px-5 pb-5 pt-5">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />

              <div className="pointer-events-none absolute inset-0 opacity-30">
                <div className="absolute -left-32 top-0 h-full w-32 -skew-x-12 bg-white/40 blur-xl animate-[shine_5s_ease-in-out_infinite]" />
              </div>

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-white/40 blur-md animate-pulse" />

                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-lg backdrop-blur-md">
                        <svg
                          className="h-6 w-6 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect
                            x="4"
                            y="6"
                            width="16"
                            height="13"
                            rx="4"
                          />
                          <path
                            strokeLinecap="round"
                            d="M8 6V4h8v2"
                          />
                          <circle
                            cx="9"
                            cy="12"
                            r="1"
                            fill="currentColor"
                          />
                          <circle
                            cx="15"
                            cy="12"
                            r="1"
                            fill="currentColor"
                          />
                          <path
                            strokeLinecap="round"
                            d="M8.5 16h7"
                          />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold tracking-tight text-white">
                          AgriDrill AI
                        </h2>

                        <span className="rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
                          AI
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs text-white/75">
                        Farming & machine information assistant
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* New Chat */}
                    <button
                      type="button"
                      onClick={startNewChat}
                      aria-label="Start a new chat"
                      title="New chat"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 5v14M5 12h14"
                        />
                      </svg>
                    </button>

                    {/* Close */}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Close AgriDrill AI"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 6l12 12M18 6L6 18"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-200 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>

                  <span className="text-[11px] font-medium text-white/90">
                    Assistant ready
                  </span>
                </div>
              </div>
            </div>

            <div className="relative flex h-[430px] min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 [scrollbar-width:thin]">
                {error && (
                  <div className="mb-4 animate-[messageIn_0.3s_ease-out] rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path
                            strokeLinecap="round"
                            d="M12 8v4M12 16h.01"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                          Unable to get a response
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-600/90 dark:text-red-400">
                          {error}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-300"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            d="M6 6l12 12M18 6L6 18"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="flex flex-col pb-2">
                    <div className="relative w-full shrink-0 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-cyan-950/30">
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />

                      <div className="relative">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 3v2M12 19v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M3 12h2M19 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
                            />
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                        </div>

                        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                          How can I help?
                        </h3>

                        <p className="mt-2 max-w-[320px] text-sm leading-6 text-slate-600 dark:text-slate-300">
                          Ask about farming, soil preparation, planting,
                          machine telemetry, operations, or recent
                          AgriDrill alerts.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          Quick questions
                        </span>

                        <span className="text-[10px] text-slate-400">
                          Tap to ask
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {SUGGESTED_QUESTIONS.map((question) => (
                          <button
                            key={question.text}
                            type="button"
                            onClick={() =>
                              sendMessage(question.text)
                            }
                            className="group rounded-2xl border border-slate-200 bg-white p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
                          >
                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-emerald-900/50 dark:group-hover:text-emerald-400">
                              {question.icon}
                            </div>

                            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {question.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 shrink-0 pt-2 text-center">
                      <p className="text-[10px] leading-4 text-slate-400">
                        AgriDrill AI provides information only. It does
                        not control the machine.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex animate-[messageIn_0.3s_ease-out] ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20 transition-transform duration-200 hover:scale-105">
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <rect
                                x="5"
                                y="7"
                                width="14"
                                height="11"
                                rx="3"
                              />
                              <path
                                strokeLinecap="round"
                                d="M9 7V5h6v2"
                              />
                              <circle
                                cx="9"
                                cy="12"
                                r=".8"
                                fill="currentColor"
                              />
                              <circle
                                cx="15"
                                cy="12"
                                r=".8"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        )}

                        <div className="flex max-w-[82%] flex-col">
                          {message.role === "assistant" && (
                            <div className="mb-1 ml-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              AgriDrill AI
                            </div>
                          )}

                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-6 transition-all ${
                              message.role === "user"
                                ? "rounded-br-md bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/15"
                                : "rounded-tl-md border border-slate-200/80 bg-white text-slate-700 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            }`}
                          >
                            <div className="space-y-2">
                              <div
                                className={
                                  message.role === "assistant"
                                    ? "space-y-2"
                                    : "whitespace-pre-wrap"
                                }
                              >
                                {message.role === "assistant"
                                  ? formatAIResponse(
                                      message.content
                                    )
                                  : message.content}
                              </div>

                              <div
                                className={`text-[10px] leading-none ${
                                  message.role === "user"
                                    ? "text-white/60"
                                    : "text-slate-400"
                                }`}
                              >
                                {formatMessageTime(
                                  message.createdAt
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex animate-[messageIn_0.3s_ease-out] items-center gap-2">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20">
                          <div className="absolute inset-0 rounded-xl bg-white/10 animate-pulse" />

                          <svg
                            className="relative h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <rect
                              x="5"
                              y="7"
                              width="14"
                              height="11"
                              rx="3"
                            />
                            <path
                              strokeLinecap="round"
                              d="M9 7V5h6v2"
                            />
                            <circle
                              cx="9"
                              cy="12"
                              r=".8"
                              fill="currentColor"
                            />
                            <circle
                              cx="15"
                              cy="12"
                              r=".8"
                              fill="currentColor"
                            />
                            <path
                              strokeLinecap="round"
                              d="M9 16h6"
                            />
                          </svg>
                        </div>

                        <div className="rounded-2xl rounded-tl-md border border-emerald-100 bg-white px-4 py-3 shadow-sm shadow-emerald-500/5 dark:border-emerald-900/40 dark:bg-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-[typingDot_1.2s_ease-in-out_infinite]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-[typingDot_1.2s_ease-in-out_0.15s_infinite]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-[typingDot_1.2s_ease-in-out_0.3s_infinite]" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-slate-200/80 bg-white/80 p-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
                <div className="group relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-emerald-700 dark:focus-within:bg-slate-900">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(event) =>
                      setInput(event.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={
                      isTyping
                        ? "AgriDrill AI is thinking..."
                        : "Ask AgriDrill AI..."
                    }
                    aria-label="Ask AgriDrill AI"
                    className="max-h-24 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isTyping}
                    aria-label="Send message"
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 transition duration-200 hover:scale-105 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  >
                    <svg
                      className="relative h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M22 2 11 13"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m22 2-7 20-4-9-9-4Z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-[10px] text-slate-400">
                    Enter to send · Shift + Enter for new line
                  </span>

                  <span className="text-[10px] text-slate-400">
                    AgriDrill AI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto absolute bottom-5 right-4 sm:right-6">
          <div
            className={`absolute inset-[-10px] rounded-full bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-violet-400/30 blur-xl transition-opacity duration-300 ${
              isOpen
                ? "opacity-20"
                : "animate-pulse opacity-100"
            }`}
          />

          {!isOpen && (
            <div className="absolute inset-[-5px] rounded-full border border-emerald-400/30 animate-[spin_8s_linear_infinite]" />
          )}

          <button
            type="button"
            onClick={() =>
              setIsOpen((current) => !current)
            }
            aria-label={
              isOpen
                ? "Close AgriDrill AI"
                : "Open AgriDrill AI"
            }
            className={`relative flex h-[62px] w-[62px] items-center justify-center rounded-full border border-white/20 shadow-[0_12px_35px_rgba(15,23,42,0.25)] backdrop-blur-xl transition-all duration-300 ${
              isOpen
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white hover:-translate-y-1 hover:scale-105"
            }`}
          >
            <span className="absolute inset-1 rounded-full bg-white/10" />

            {isOpen ? (
              <svg
                className="relative h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            ) : (
              <svg
                className="relative h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <rect
                  x="4"
                  y="6"
                  width="16"
                  height="13"
                  rx="4"
                />
                <path
                  strokeLinecap="round"
                  d="M8 6V4h8v2"
                />
                <circle
                  cx="9"
                  cy="12"
                  r="1"
                  fill="currentColor"
                />
                <circle
                  cx="15"
                  cy="12"
                  r="1"
                  fill="currentColor"
                />
                <path
                  strokeLinecap="round"
                  d="M8.5 16h7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes typingDot {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.45;
          }

          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }

          45%,
          100% {
            transform: translateX(420%) skewX(-12deg);
          }
        }
      `}</style>
    </>
  );
}