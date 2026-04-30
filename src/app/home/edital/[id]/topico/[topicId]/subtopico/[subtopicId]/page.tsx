"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface SubtopicInfo {
    id: number;
    title: string;
    topic: {
        id: number;
        title: string;
    };
}

interface EdictInfo {
    id: number;
    title: string | null;
    pdf_filename: string | null;
    status: string;
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

function getAuthHeader(): Record<string, string> {
    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("auth_token") ?? ""
            : "";
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconArrowLeft({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
        </svg>
    );
}

function IconSend({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
        </svg>
    );
}

function IconSparkles({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
            />
        </svg>
    );
}

function IconStop({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
    );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
    return (
        <div className="flex items-center gap-1.5 px-1 py-0.5">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/60"
                    style={{
                        animation: `typingBounce 1.4s ease-in-out infinite`,
                        animationDelay: `${i * 0.16}s`,
                    }}
                />
            ))}
        </div>
    );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <div
            className={`flex gap-3 w-full ${isUser ? "flex-row-reverse" : "flex-row"}`}
            style={{ animation: "fadeSlideUp 0.25s ease-out both" }}
        >
            {/* Avatar */}
            {!isUser && (
                <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-primary/30 bg-primary/10 text-primary mt-0.5"
                    aria-label="AI"
                >
                    <IconSparkles size={15} />
                </div>
            )}

            {/* Bubble */}
            <div
                className={`
                    max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                    ${isUser
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-[#1e293b] border border-[#334155] text-foreground rounded-tl-sm"
                    }
                `}
            >
                {message.content}
            </div>
        </div>
    );
}

// ─── Suggestion chips ──────────────────────────────────────────────────────────

function SuggestionChips({ subtopicTitle, onSelect }: { subtopicTitle: string; onSelect: (text: string) => void }) {
    const suggestions = [
        `Me explique ${subtopicTitle} de forma simples`,
        `Quais são os pontos mais importantes de ${subtopicTitle}?`,
        `Me dê exemplos práticos sobre ${subtopicTitle}`,
        `Como este tema costuma cair em provas?`,
    ];

    return (
        <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((s) => (
                <button
                    key={s}
                    onClick={() => onSelect(s)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-[#334155] bg-[#1e293b] text-muted hover:border-primary/50 hover:text-foreground hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                >
                    {s}
                </button>
            ))}
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function SubtopicChatPage() {
    const params = useParams();
    const router = useRouter();

    const edictId    = params.id as string;
    const topicId    = params.topicId as string;
    const subtopicId = params.subtopicId as string;

    const [edictInfo, setEdictInfo]       = useState<EdictInfo | null>(null);
    const [subtopicInfo, setSubtopicInfo] = useState<SubtopicInfo | null>(null);
    const [loadingInfo, setLoadingInfo]   = useState(true);
    const [messages, setMessages]         = useState<Message[]>([]);
    const [inputValue, setInputValue]     = useState("");
    const [isLoading, setIsLoading]       = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef    = useRef<HTMLTextAreaElement>(null);
    const abortRef       = useRef<AbortController | null>(null);

    // ── Fetch edict info ──────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchEdict() {
            try {
                const res = await fetch(`${API_BASE}/api/v1/edicts/${edictId}`, {
                    headers: getAuthHeader(),
                });
                if (!res.ok) return;
                const data = await res.json();
                setEdictInfo(data.edict);
            } catch {
                // silent
            }
        }
        fetchEdict();
    }, [edictId]);

    // ── Fetch subtopic info ───────────────────────────────────────────────────
    useEffect(() => {
        async function fetchSubtopic() {
            setLoadingInfo(true);
            try {
                const res = await fetch(
                    `${API_BASE}/api/v1/edicts/${edictId}/topics/${topicId}/subtopics/${subtopicId}`,
                    { headers: getAuthHeader() }
                );
                if (!res.ok) {
                    router.push(`/home/edital/${edictId}/topico/${topicId}`);
                    return;
                }
                const data = await res.json();
                setSubtopicInfo(data.subtopic);
            } catch {
                // silent
            } finally {
                setLoadingInfo(false);
            }
        }
        fetchSubtopic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edictId, topicId, subtopicId]);

    // ── Page title ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (subtopicInfo) {
            document.title = `${subtopicInfo.title} — Editaly`;
        }
    }, [subtopicInfo]);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // ── Auto-resize textarea ──────────────────────────────────────────────────
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [inputValue]);

    const edictName     = edictInfo?.title ?? edictInfo?.pdf_filename ?? `Edital #${edictId}`;
    const subtopicTitle = subtopicInfo?.title ?? "";
    const topicTitle    = subtopicInfo?.topic?.title ?? "";

    // ── Send message ──────────────────────────────────────────────────────────
    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isLoading) return;

            const userMsg: Message = {
                id: crypto.randomUUID(),
                role: "user",
                content: trimmed,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMsg]);
            setInputValue("");
            setIsLoading(true);

            abortRef.current = new AbortController();

            try {
                // Build history for context (last 6 messages)
                const historyForApi = [...messages, userMsg]
                    .slice(-7, -1) // last 6 before current
                    .map((m) => ({ role: m.role, content: m.content }));

                const res = await fetch(
                    `${API_BASE}/api/v1/edicts/${edictId}/topics/${topicId}/subtopics/${subtopicId}/chat`,
                    {
                        method: "POST",
                        headers: getAuthHeader(),
                        body: JSON.stringify({
                            question: trimmed,
                            history: historyForApi,
                        }),
                        signal: abortRef.current.signal,
                    }
                );

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error ?? "Erro ao contactar a IA.");
                }

                const data = await res.json();
                const aiMsg: Message = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: data.answer,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, aiMsg]);
            } catch (e: unknown) {
                if (e instanceof DOMException && e.name === "AbortError") {
                    // User stopped generation
                } else {
                    const errorMsg: Message = {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: e instanceof Error
                            ? `Erro: ${e.message}`
                            : "Não foi possível gerar uma resposta. Tente novamente.",
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, errorMsg]);
                }
            } finally {
                setIsLoading(false);
                abortRef.current = null;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isLoading, messages, edictId, topicId, subtopicId]
    );

    const handleStop = () => {
        abortRef.current?.abort();
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <>
            <style>{`
                @keyframes typingBounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
                    30% { transform: translateY(-6px); opacity: 1; }
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .chat-scrollbar::-webkit-scrollbar { width: 4px; }
                .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .chat-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
            `}</style>

            <div className="flex flex-col h-screen w-full bg-background">

                {/* ── Top bar ─────────────────────────────────────────── */}
                <header className="flex-shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 border-b border-card-border bg-card/50 backdrop-blur-sm">
                    <button
                        id="btn-voltar-topico"
                        onClick={() => router.push(`/home/edital/${edictId}/topico/${topicId}`)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 text-muted hover:text-foreground transition-all duration-200 cursor-pointer"
                        title="Voltar"
                    >
                        <IconArrowLeft size={18} />
                    </button>

                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-muted min-w-0">
                        <button
                            onClick={() => router.push("/home")}
                            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
                        >
                            Início
                        </button>
                        <span className="shrink-0">/</span>
                        <button
                            onClick={() => router.push(`/home/edital/${edictId}`)}
                            className="hover:text-foreground transition-colors cursor-pointer hidden sm:block truncate max-w-[100px]"
                        >
                            {edictName}
                        </button>
                        <span className="hidden sm:block shrink-0">/</span>
                        <button
                            onClick={() => router.push(`/home/edital/${edictId}/topico/${topicId}`)}
                            className="hover:text-foreground transition-colors cursor-pointer hidden md:block truncate max-w-[120px]"
                        >
                            {topicTitle}
                        </button>
                        <span className="hidden md:block shrink-0">/</span>
                        <span className="text-foreground font-medium truncate max-w-[160px]">
                            {loadingInfo ? "Carregando…" : (subtopicTitle || "Subtópico")}
                        </span>
                    </nav>

                    {/* AI badge */}
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold shrink-0">
                        <IconSparkles size={12} />
                        IA
                    </div>
                </header>

                {/* ── Chat body ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto chat-scrollbar">
                    {isEmpty ? (
                        /* Welcome / empty state */
                        <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-6">
                            {/* Icon */}
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <IconSparkles size={28} />
                                </div>
                                <div
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background"
                                    aria-hidden="true"
                                />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-foreground">
                                    {loadingInfo ? (
                                        <span className="inline-block h-8 w-48 bg-card-border rounded animate-pulse" />
                                    ) : (
                                        subtopicTitle || "Subtópico"
                                    )}
                                </h1>
                                <p className="text-sm text-muted max-w-sm">
                                    Faça perguntas sobre este conteúdo. A IA irá explicar, dar exemplos e te ajudar a dominar o tema.
                                </p>
                            </div>

                            {!loadingInfo && subtopicTitle && (
                                <SuggestionChips
                                    subtopicTitle={subtopicTitle}
                                    onSelect={(text) => {
                                        setInputValue(text);
                                        setTimeout(() => textareaRef.current?.focus(), 50);
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        /* Messages */
                        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-5">
                            {messages.map((msg) => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}

                            {/* Typing indicator */}
                            {isLoading && (
                                <div className="flex gap-3" style={{ animation: "fadeSlideUp 0.25s ease-out both" }}>
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-primary/30 bg-primary/10 text-primary mt-0.5">
                                        <IconSparkles size={15} />
                                    </div>
                                    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl rounded-tl-sm px-4 py-3">
                                        <TypingDots />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* ── Input bar ────────────────────────────────────────── */}
                <div className="flex-shrink-0 border-t border-card-border bg-card/30 backdrop-blur-sm px-4 md:px-6 py-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative flex items-end gap-3 bg-[#1e293b] border border-[#334155] rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors duration-200">
                            <textarea
                                ref={textareaRef}
                                id="chat-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Pergunte sobre ${subtopicTitle || "este subtópico"}…`}
                                rows={1}
                                disabled={isLoading || loadingInfo}
                                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted/60 focus:outline-none leading-relaxed max-h-40 disabled:opacity-60"
                                style={{ minHeight: "24px" }}
                            />

                            {isLoading ? (
                                <button
                                    id="btn-stop"
                                    onClick={handleStop}
                                    title="Parar geração"
                                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#334155] hover:bg-red-500/20 text-muted hover:text-red-400 flex items-center justify-center transition-all duration-200 cursor-pointer"
                                >
                                    <IconStop size={14} />
                                </button>
                            ) : (
                                <button
                                    id="btn-send"
                                    onClick={() => sendMessage(inputValue)}
                                    disabled={!inputValue.trim() || loadingInfo}
                                    title="Enviar (Enter)"
                                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover hover:scale-105"
                                >
                                    <IconSend size={15} />
                                </button>
                            )}
                        </div>

                        <p className="text-center text-[11px] text-muted/40 mt-2">
                            Pressione <kbd className="px-1 py-0.5 rounded border border-muted/20 text-[10px] font-mono">Enter</kbd> para enviar · <kbd className="px-1 py-0.5 rounded border border-muted/20 text-[10px] font-mono">Shift+Enter</kbd> para nova linha
                        </p>
                    </div>
                </div>

            </div>
        </>
    );
}
