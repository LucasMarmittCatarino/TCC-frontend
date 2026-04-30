"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subtopic {
    id: number;
    title: string;
}

interface Topic {
    id: number;
    title: string;
    subtopics: Subtopic[];
    completed: boolean;
}

interface EdictInfo {
    id: number;
    title: string | null;
    pdf_filename: string | null;
    status: string; // "not_started" | "in_progress" | "completed" | "failed"
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheckCircle({ filled = false, size = 22 }: { filled?: boolean; size?: number }) {
    if (filled) {
        return (
            <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="var(--primary)" />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    stroke="white"
                    d="M7 12.5l3.5 3.5 6.5-7"
                />
            </svg>
        );
    }
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={1.75} />
        </svg>
    );
}

function IconArrowLeft({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
        </svg>
    );
}

function IconBookOpen({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    );
}

function IconLayers({ size = 14 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
    );
}

function IconChevronRight({ size = 14 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = (edictId: string) => `edict_topics_${edictId}`;

function getAuthHeader(): Record<string, string> {
    const token = typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ?? ""
        : "";
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({
    topic,
    index,
    edictId,
    onToggle,
}: {
    topic: Topic;
    index: number;
    edictId: string;
    onToggle: (id: number) => void;
}) {
    const router = useRouter();
    const previewSubtopics = topic.subtopics.slice(0, 3);
    const remaining = topic.subtopics.length - previewSubtopics.length;

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest(`#topic-check-${topic.id}`)) return;
        router.push(`/home/edital/${edictId}/topico/${topic.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className={`
                group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer
                ${topic.completed
                    ? "bg-primary/5 border-primary/25 shadow-sm shadow-primary/10"
                    : "bg-card border-card-border hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                }
            `}
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* ── Left: check circle ─────────────────────── */}
            <button
                id={`topic-check-${topic.id}`}
                onClick={(e) => { e.stopPropagation(); onToggle(topic.id); }}
                title={topic.completed ? "Marcar como não concluído" : "Marcar como concluído"}
                className={`
                    mt-0.5 flex-shrink-0 transition-all duration-200 cursor-pointer rounded-full
                    focus:outline-none focus:ring-2 focus:ring-primary/40
                    ${topic.completed
                        ? "text-primary scale-110"
                        : "text-muted hover:text-primary hover:scale-110"
                    }
                `}
            >
                <IconCheckCircle filled={topic.completed} size={24} />
            </button>

            {/* ── Center: title + subtopics preview ────────── */}
            <div className="flex-1 min-w-0">
                <h3
                    className={`text-base font-bold leading-snug transition-colors duration-200 
                        ${topic.completed ? "text-primary" : "text-foreground group-hover:text-primary"}`}
                >
                    {topic.title}
                </h3>

                <div className="mt-2 flex flex-wrap gap-1.5">
                    {previewSubtopics.map((sub) => (
                        <span
                            key={sub.id}
                            className={`
                                text-xs px-2.5 py-0.5 rounded-full border transition-colors
                                ${topic.completed
                                    ? "bg-primary/10 border-primary/20 text-primary/80"
                                    : "bg-background border-card-border text-muted"
                                }
                            `}
                        >
                            {sub.title}
                        </span>
                    ))}
                    {remaining > 0 && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-background border border-card-border text-muted/60 italic">
                            +{remaining} mais
                        </span>
                    )}
                </div>
            </div>

            {/* ── Right: subtopic count + arrow ─────────────── */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5 ml-2">
                <div
                    className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors
                        ${topic.completed
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-background border-card-border text-muted"
                        }
                    `}
                >
                    <IconLayers size={12} />
                    <span>{topic.subtopics.length}</span>
                </div>
                <span className="text-[10px] text-muted/60 whitespace-nowrap">subtópicos</span>
                <span className="text-muted/40 group-hover:text-primary/60 transition-colors mt-0.5">
                    <IconChevronRight size={13} />
                </span>
            </div>

            {/* Completed overlay shimmer */}
            {topic.completed && (
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse at 0% 50%, rgba(99,102,241,0.04) 0%, transparent 70%)",
                    }}
                />
            )}
        </div>
    );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ percent }: { percent: number }) {
    const r = 30;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;

    return (
        <svg width={72} height={72} viewBox="0 0 72 72" className="-rotate-90">
            <circle cx="36" cy="36" r={r} fill="none" stroke="var(--card-border)" strokeWidth="6" />
            <circle
                cx="36"
                cy="36"
                r={r}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
        </svg>
    );
}

// ─── Processing Skeleton ──────────────────────────────────────────────────────

function ProcessingState({ status }: { status: string }) {
    const isFailed = status === "failed";

    return (
        <div className="flex flex-col items-center justify-center gap-6 py-16 max-w-md mx-auto text-center">
            {isFailed ? (
                <>
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <svg width={32} height={32} fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-red-400 mb-2">Falha no processamento</h2>
                        <p className="text-sm text-muted leading-relaxed">
                            Não foi possível extrair o conteúdo deste edital. O PDF pode estar escaneado, protegido ou não conter texto legível.
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <div className="relative w-16 h-16">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <svg width={28} height={28} fill="none" viewBox="0 0 24 24" className="text-primary animate-spin" style={{ animationDuration: "2s" }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.5} strokeDasharray="31.4" strokeDashoffset="10" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-2">Processando edital…</h2>
                        <p className="text-sm text-muted leading-relaxed">
                            Estamos extraindo e estruturando o conteúdo do seu PDF com IA. Isso pode levar alguns minutos.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                                style={{ animationDelay: `${(i - 1) * 200}ms` }}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-muted/60 italic">Esta página atualiza automaticamente</p>
                </>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditalTopicsPage() {
    const params = useParams();
    const router = useRouter();
    const { toasts, toast, removeToast } = useToast();

    const edictId = params.id as string;

    const [edictInfo, setEdictInfo] = useState<EdictInfo | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Load edict info from API ─────────────────────────────────────────────
    const fetchEdict = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/v1/edicts/${edictId}`, {
                headers: getAuthHeader(),
            });
            if (!res.ok) {
                if (res.status === 404) {
                    toast.error("Edital não encontrado.");
                    router.push("/home");
                }
                return null;
            }
            const data = await res.json();
            return data.edict as EdictInfo;
        } catch {
            toast.error("Não foi possível carregar o edital.");
            return null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edictId]);

    const fetchTopics = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/v1/edicts/${edictId}/topics`, {
                headers: getAuthHeader(),
            });
            if (!res.ok) return [];
            const data = await res.json();
            return (data.topics ?? []) as Array<{ id: number; title: string; subtopics: Subtopic[] }>;
        } catch {
            return [];
        }
    }, [edictId]);

    // ── Initial load ─────────────────────────────────────────────────────────
    useEffect(() => {
        localStorage.setItem("last_edict_id", edictId);

        const saved = localStorage.getItem(STORAGE_KEY(edictId));
        const completedIds: number[] = saved ? JSON.parse(saved) : [];

        const init = async () => {
            setLoading(true);
            const edict = await fetchEdict();
            if (!edict) { setLoading(false); return; }

            setEdictInfo(edict);

            if (edict.status === "completed") {
                const rawTopics = await fetchTopics();
                localStorage.setItem(`edict_topics_total_${edictId}`, String(rawTopics.length));
                setTopics(rawTopics.map((t) => ({
                    ...t,
                    completed: completedIds.includes(t.id),
                })));
            }

            setLoading(false);
        };

        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edictId]);

    // ── Polling while in_progress ─────────────────────────────────────────────
    useEffect(() => {
        if (!edictInfo) return;

        const shouldPoll = edictInfo.status === "in_progress" || edictInfo.status === "not_started";

        if (shouldPoll) {
            pollingRef.current = setInterval(async () => {
                const updated = await fetchEdict();
                if (!updated) return;

                setEdictInfo(updated);

                if (updated.status === "completed") {
                    clearInterval(pollingRef.current!);
                    const saved = localStorage.getItem(STORAGE_KEY(edictId));
                    const completedIds: number[] = saved ? JSON.parse(saved) : [];
                    const rawTopics = await fetchTopics();
                    localStorage.setItem(`edict_topics_total_${edictId}`, String(rawTopics.length));
                    setTopics(rawTopics.map((t) => ({
                        ...t,
                        completed: completedIds.includes(t.id),
                    })));
                } else if (updated.status === "failed") {
                    clearInterval(pollingRef.current!);
                }
            }, 5000); // poll every 5s
        }

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edictInfo?.status]);

    // ── Toggle completion ─────────────────────────────────────────────────────
    const handleToggle = useCallback(
        (topicId: number) => {
            setTopics((prev) => {
                const updated = prev.map((t) =>
                    t.id === topicId ? { ...t, completed: !t.completed } : t
                );
                const completedIds = updated.filter((t) => t.completed).map((t) => t.id);
                localStorage.setItem(STORAGE_KEY(edictId), JSON.stringify(completedIds));
                return updated;
            });
        },
        [edictId]
    );

    // ── Derived stats ─────────────────────────────────────────────────────────
    const completedCount = topics.filter((t) => t.completed).length;
    const totalCount = topics.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const edictName = edictInfo?.title ?? edictInfo?.pdf_filename ?? `Edital #${edictId}`;
    const isProcessing = edictInfo?.status === "in_progress" || edictInfo?.status === "not_started";
    const isFailed = edictInfo?.status === "failed";

    // ── Page title ───────────────────────────────────────────────────────────────
    useEffect(() => {
        document.title = loading ? "Carregando… — Editaly" : `${edictName} — Editaly`;
    }, [loading, edictName]);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex flex-col w-full min-h-screen p-6 md:p-8 space-y-8">

                {/* ── Back button ────────────────────────────────── */}
                <div>
                    <button
                        id="btn-voltar-home"
                        onClick={() => router.push("/home")}
                        className="flex items-center gap-2 text-muted hover:text-foreground transition-colors text-sm font-medium cursor-pointer"
                    >
                        <IconArrowLeft size={15} />
                        Voltar para início
                    </button>
                </div>

                {/* ── Header ─────────────────────────────────────── */}
                <header className="flex flex-col md:flex-row md:items-center gap-6 max-w-5xl">

                    {/* Title + subtitle */}
                    <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                                <IconBookOpen size={18} />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                                Trilha de Estudos
                            </span>
                        </div>
                        {loading ? (
                            <div className="animate-pulse">
                                <div className="h-8 bg-card-border rounded w-64 mb-2" />
                                <div className="h-4 bg-card-border rounded w-40" />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    {edictName}
                                </h1>
                                {!isProcessing && !isFailed && (
                                    <p className="text-muted text-sm">
                                        {completedCount} de {totalCount} tópicos concluídos
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Progress ring card — only when completed */}
                    {!loading && !isProcessing && !isFailed && totalCount > 0 && (
                        <div className="flex items-center gap-5 bg-card border border-card-border px-6 py-4 rounded-2xl shrink-0 shadow-sm">
                            <div className="relative w-[72px] h-[72px] flex items-center justify-center">
                                <ProgressRing percent={progressPct} />
                                <span className="absolute text-sm font-extrabold text-foreground">
                                    {progressPct}%
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">
                                    Progresso
                                </p>
                                <p className="text-2xl font-extrabold text-foreground leading-none">
                                    {completedCount}
                                    <span className="text-base font-medium text-muted">
                                        /{totalCount}
                                    </span>
                                </p>
                                <p className="text-xs text-muted mt-1">tópicos</p>
                            </div>
                        </div>
                    )}
                </header>

                {/* ── Body ────────────────────────────────────────── */}
                {loading ? (
                    <div className="space-y-3 max-w-5xl">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-card border border-card-border p-5 rounded-2xl animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-card-border shrink-0 mt-0.5" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-5 bg-card-border rounded w-2/5" />
                                        <div className="flex gap-2">
                                            <div className="h-4 bg-card-border rounded-full w-24" />
                                            <div className="h-4 bg-card-border rounded-full w-20" />
                                            <div className="h-4 bg-card-border rounded-full w-28" />
                                        </div>
                                    </div>
                                    <div className="w-12 h-10 bg-card-border rounded-xl shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (isProcessing || isFailed) ? (
                    <ProcessingState status={edictInfo?.status ?? "in_progress"} />
                ) : topics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center max-w-md mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-card border border-card-border flex items-center justify-center text-muted">
                            <IconBookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-foreground mb-1">Nenhum tópico encontrado</p>
                            <p className="text-sm text-muted">O processamento foi concluído mas não encontramos tópicos neste edital.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 max-w-5xl">
                        {topics.map((topic, i) => (
                            <TopicCard
                                key={topic.id}
                                topic={topic}
                                index={i}
                                edictId={edictId}
                                onToggle={handleToggle}
                            />
                        ))}
                    </div>
                )}

                {/* ── All done banner ─────────────────────────────── */}
                {!loading && progressPct === 100 && totalCount > 0 && (
                    <div className="max-w-5xl w-full">
                        <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/25 rounded-2xl px-6 py-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                                <IconCheckCircle filled size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-green-400">Parabéns!</p>
                                <p className="text-xs text-muted mt-0.5">
                                    Você concluiu todos os tópicos desta trilha. Continue se preparando!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
