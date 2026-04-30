"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SubtopicItem {
    id: number;
    title: string;
    status: "not_started" | "in_progress" | "completed";
}

interface TopicData {
    id: number;
    title: string;
    subtopics: SubtopicItem[];
}

interface EdictInfo {
    id: number;
    title: string | null;
    pdf_filename: string | null;
    status: string;
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

const SUBTOPIC_KEY = (edictId: string, topicId: string) =>
    `subtopics_${edictId}_${topicId}`;

function loadSubtopicStatuses(
    edictId: string,
    topicId: string
): Record<number, SubtopicItem["status"]> {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(SUBTOPIC_KEY(edictId, topicId));
    return raw ? JSON.parse(raw) : {};
}

function saveSubtopicStatuses(
    edictId: string,
    topicId: string,
    statuses: Record<number, SubtopicItem["status"]>
) {
    localStorage.setItem(SUBTOPIC_KEY(edictId, topicId), JSON.stringify(statuses));
}

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
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
        </svg>
    );
}

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

function IconLock({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
        </svg>
    );
}

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    not_started: {
        label: "Não iniciado",
        pill: "bg-[#1e293b] border-[#334155] text-[#64748b]",
        card: "bg-[#1e293b] border-[#334155]",
        dot: "bg-[#475569]",
        checkColor: "text-[#475569]",
    },
    in_progress: {
        label: "Em andamento",
        pill: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        card: "bg-amber-500/5 border-amber-500/25",
        dot: "bg-amber-400",
        checkColor: "text-amber-400",
    },
    completed: {
        label: "Concluído",
        pill: "bg-green-500/10 border-green-500/30 text-green-400",
        card: "bg-green-500/5 border-green-500/20",
        dot: "bg-green-400",
        checkColor: "text-green-400",
    },
};

// ─── Subtopic Card ──────────────────────────────────────────────────────────────

function SubtopicCard({
    subtopic,
    index,
    onCycle,
    onNavigate,
}: {
    subtopic: SubtopicItem;
    index: number;
    onCycle: (id: number) => void;
    onNavigate: (id: number) => void;
}) {
    const cfg = STATUS_CONFIG[subtopic.status];

    return (
        <div
            className={`
                group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300
                ${cfg.card}
                hover:scale-[1.01] hover:shadow-lg cursor-pointer
            `}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onNavigate(subtopic.id)}
        >
            {/* Status dot */}
            <div className={`absolute top-3.5 right-14 w-2 h-2 rounded-full ${cfg.dot} opacity-80`} />

            {/* Check button */}
            <button
                id={`subtopic-check-${subtopic.id}`}
                onClick={(e) => { e.stopPropagation(); onCycle(subtopic.id); }}
                title="Alterar status"
                className={`
                    flex-shrink-0 transition-all duration-200 cursor-pointer rounded-full
                    focus:outline-none focus:ring-2 focus:ring-primary/40
                    ${cfg.checkColor}
                    ${subtopic.status !== "not_started" ? "scale-110" : "hover:scale-110 hover:text-primary"}
                `}
            >
                <IconCheckCircle filled={subtopic.status === "completed"} size={24} />
            </button>

            {/* Title */}
            <div className="flex-1 min-w-0 pr-4">
                <h3
                    className={`
                        text-sm font-semibold leading-snug transition-colors duration-200
                        ${subtopic.status === "completed"
                            ? "text-green-400 line-through decoration-green-400/50"
                            : subtopic.status === "in_progress"
                            ? "text-amber-300"
                            : "text-foreground"
                        }
                    `}
                >
                    {subtopic.title}
                </h3>
                <p className="text-[11px] text-muted/60 mt-0.5 group-hover:text-muted transition-colors">
                    Clique para estudar com IA
                </p>
            </div>

            {/* Right: status pill + arrow */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <span
                    className={`
                        text-[11px] font-semibold px-2.5 py-1 rounded-full border
                        ${cfg.pill}
                    `}
                >
                    {cfg.label}
                </span>
                <span className="text-muted/40 group-hover:text-primary transition-colors duration-200">
                    <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function SubtopicsPage() {
    const params = useParams();
    const router = useRouter();
    const { toasts, toast, removeToast } = useToast();

    const edictId = params.id as string;
    const topicId = params.topicId as string;

    const [edictInfo, setEdictInfo] = useState<EdictInfo | null>(null);
    const [topicData, setTopicData] = useState<TopicData | null>(null);
    const [subtopics, setSubtopics] = useState<SubtopicItem[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Load edict info ──────────────────────────────────────────────────────
    const fetchEdictInfo = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/v1/edicts/${edictId}`, {
                headers: getAuthHeader(),
            });
            if (!res.ok) {
                toast.error("Edital não encontrado.");
                router.push("/home");
                return;
            }
            const data = await res.json();
            setEdictInfo(data.edict);
        } catch {
            toast.error("Não foi possível carregar o edital.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edictId]);

    // ── Load topic data ──────────────────────────────────────────────────────
    const fetchTopic = useCallback(async () => {
        try {
            const res = await fetch(
                `${API_BASE}/api/v1/edicts/${edictId}/topics/${topicId}`,
                { headers: getAuthHeader() }
            );
            if (!res.ok) {
                toast.error("Tópico não encontrado.");
                router.push(`/home/edital/${edictId}`);
                return;
            }
            const data = await res.json();
            const topic = data.topic as TopicData;

            const saved = loadSubtopicStatuses(edictId, topicId);
            setTopicData(topic);
            setSubtopics(
                topic.subtopics.map((sub) => ({
                    ...sub,
                    status: saved[sub.id] ?? "not_started",
                }))
            );
        } catch {
            toast.error("Erro ao carregar o tópico.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edictId, topicId]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchEdictInfo(), fetchTopic()]);
            setLoading(false);
        };
        init();
    }, [fetchEdictInfo, fetchTopic]);

    // ── Cycle subtopic status ─────────────────────────────────────────────────
    const handleCycle = useCallback(
        (subtopicId: number) => {
            setSubtopics((prev) => {
                const updated = prev.map((s) => {
                    if (s.id !== subtopicId) return s;
                    const next: SubtopicItem["status"] =
                        s.status === "not_started"
                            ? "in_progress"
                            : s.status === "in_progress"
                            ? "completed"
                            : "not_started";
                    return { ...s, status: next };
                });

                const statuses: Record<number, SubtopicItem["status"]> = {};
                updated.forEach((s) => (statuses[s.id] = s.status));
                saveSubtopicStatuses(edictId, topicId, statuses);

                return updated;
            });
        },
        [edictId, topicId]
    );

    // ── Derived ───────────────────────────────────────────────────────────────
    const allCompleted =
        subtopics.length > 0 && subtopics.every((s) => s.status === "completed");
    const completedCount = subtopics.filter((s) => s.status === "completed").length;
    const edictName = edictInfo?.title ?? edictInfo?.pdf_filename ?? `Edital #${edictId}`;

    // ── Page title ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (topicData) {
            document.title = `${topicData.title} — Editaly`;
        }
    }, [topicData]);

    const handleQuiz = () => {
        toast.success("Quiz em breve disponível!");
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex flex-col w-full min-h-screen p-6 md:p-8 space-y-8">

                {/* ── Breadcrumb / back ─────────────────────────────── */}
                <nav className="flex items-center gap-2 text-sm text-muted">
                    <button
                        id="btn-voltar-home"
                        onClick={() => router.push("/home")}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        Início
                    </button>
                    <span>/</span>
                    <button
                        id="btn-voltar-edital"
                        onClick={() => router.push(`/home/edital/${edictId}`)}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        {edictName}
                    </button>
                    <span>/</span>
                    <span className="text-foreground font-medium truncate max-w-[200px]">
                        {topicData?.title ?? "Tópico"}
                    </span>
                </nav>

                {/* ── Header ───────────────────────────────────────── */}
                <header className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                            <IconBookOpen size={18} />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                            Subtópicos
                        </span>
                    </div>

                    {loading ? (
                        <div className="h-9 bg-card-border rounded w-72 animate-pulse" />
                    ) : topicData ? (
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {topicData.title}
                        </h1>
                    ) : null}

                    <p className="text-muted text-sm">
                        {completedCount} de {subtopics.length} subtópicos concluídos
                    </p>
                </header>

                {/* ── Back button (mobile) ─────────────────────────── */}
                <button
                    id="btn-voltar-topicos"
                    onClick={() => router.push(`/home/edital/${edictId}`)}
                    className="flex items-center gap-2 text-muted hover:text-foreground transition-colors text-sm font-medium cursor-pointer w-fit -mt-4"
                >
                    <IconArrowLeft size={14} />
                    Ver todos os tópicos
                </button>

                {/* ── Subtopics list ────────────────────────────────── */}
                <div className="flex flex-col gap-3 max-w-3xl">
                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-1 flex-wrap">
                        {(["not_started", "in_progress", "completed"] as const).map((s) => (
                            <div key={s} className="flex items-center gap-1.5">
                                <div
                                    className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`}
                                />
                                <span className="text-xs text-muted">
                                    {STATUS_CONFIG[s].label}
                                </span>
                            </div>
                        ))}
                        <span className="text-xs text-muted/50 ml-auto italic">
                            Clique no círculo para avançar o status
                        </span>
                    </div>

                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-card border border-card-border p-4 rounded-2xl animate-pulse">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-6 h-6 rounded-full bg-card-border shrink-0" />
                                        <div className="flex-1 h-4 bg-card-border rounded w-3/5" />
                                        <div className="w-20 h-6 bg-card-border rounded-full shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        subtopics.map((sub, i) => (
                            <SubtopicCard
                                key={sub.id}
                                subtopic={sub}
                                index={i}
                                onCycle={handleCycle}
                                onNavigate={(id) =>
                                    router.push(`/home/edital/${edictId}/topico/${topicId}/subtopico/${id}`)
                                }
                            />
                        ))
                    )}
                </div>

                {/* ── Quiz button ───────────────────────────────────── */}
                <div className="max-w-3xl w-full">
                    <div
                        className={`
                            relative rounded-2xl border p-5 transition-all duration-500
                            ${allCompleted
                                ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/10"
                                : "bg-[#1e293b] border-[#334155]"
                            }
                        `}
                    >
                        <div className="flex items-center justify-between gap-6 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
                                        ${allCompleted
                                            ? "bg-primary/15 border border-primary/30 text-primary"
                                            : "bg-[#0f172a] border border-[#334155] text-[#475569]"
                                        }
                                    `}
                                >
                                    {allCompleted ? (
                                        <IconSparkles size={18} />
                                    ) : (
                                        <IconLock size={16} />
                                    )}
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-semibold transition-colors duration-300 ${
                                            allCompleted ? "text-foreground" : "text-muted"
                                        }`}
                                    >
                                        {allCompleted
                                            ? "Pronto para o quiz!"
                                            : "Quiz bloqueado"}
                                    </p>
                                    <p className="text-xs text-muted/70 mt-0.5">
                                        {allCompleted
                                            ? "Todos os subtópicos foram concluídos. Teste seus conhecimentos!"
                                            : `Conclua todos os ${subtopics.length} subtópicos para desbloquear.`}
                                    </p>
                                </div>
                            </div>

                            <button
                                id="btn-gerar-quiz"
                                onClick={handleQuiz}
                                disabled={!allCompleted}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                                    border transition-all duration-300 focus:outline-none focus:ring-2
                                    ${allCompleted
                                        ? "bg-primary border-primary/50 text-white hover:bg-primary-hover hover:border-primary-hover cursor-pointer focus:ring-primary/40 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.03]"
                                        : "bg-[#0f172a] border-[#334155] text-[#475569] cursor-not-allowed opacity-60"
                                    }
                                `}
                            >
                                <IconSparkles size={16} />
                                Gerar Quiz
                            </button>
                        </div>

                        {/* Progress bar */}
                        {subtopics.length > 0 && (
                            <div className="mt-4">
                                <div className="flex justify-between text-[11px] text-muted/70 mb-1.5">
                                    <span>Progresso</span>
                                    <span>{Math.round((completedCount / subtopics.length) * 100)}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[#0f172a] border border-[#334155] overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{
                                            width: `${Math.round((completedCount / subtopics.length) * 100)}%`,
                                            background: allCompleted
                                                ? "var(--primary)"
                                                : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
}
