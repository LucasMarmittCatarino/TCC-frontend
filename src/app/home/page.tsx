"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

// ─── Topic progress helpers ────────────────────────────────────────────────────

function getEdictProgress(edictId: number): number {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(`edict_topics_${edictId}`);
    const totalStr = localStorage.getItem(`edict_topics_total_${edictId}`);
    if (!saved || !totalStr) return 0;
    try {
        const completedIds: number[] = JSON.parse(saved);
        const total = parseInt(totalStr, 10);
        if (total === 0) return 0;
        return Math.round((completedIds.length / total) * 100);
    } catch {
        return 0;
    }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Edict {
    id: number;
    title: string | null;
    status: "not_started" | "in_progress" | "completed" | "failed";
    created_at: string;
    pdf_filename: string | null;
    pdf_size: number | null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBookOpen({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    );
}

function IconTrendUp({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 7h8m0 0v8m0-8l-8 14-4-4-6 6" />
        </svg>
    );
}

function IconPlus({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function IconCalendar({ size = 14 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function IconFilePdf({ size = 14 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    );
}

function IconTrash({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function IconSpinner({ size = 20 }: { size?: number }) {
    return (
        <svg className="animate-spin" width={size} height={size} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<Edict["status"], string> = {
    not_started: "Não iniciado",
    in_progress: "Em progresso",
    completed: "Concluído",
    failed: "Falha no processamento",
};

const STATUS_COLOR: Record<Edict["status"], string> = {
    not_started: "var(--muted)",
    in_progress: "var(--primary)",
    completed: "#22c55e",
    failed: "#ef4444",
};

function progressColor(pct: number): string {
    if (pct === 100) return "#22c55e";
    if (pct > 0) return "var(--primary)";
    return "var(--muted)";
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatSize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAuthHeader(): Record<string, string> {
    const token = typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ?? ""
        : "";
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const EDICT_LIMIT = 4;

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
    const router = useRouter();
    const { toasts, toast, removeToast } = useToast();

    const [userName, setUserName] = useState("Usuário");
    const [edicts, setEdicts] = useState<Edict[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [edictProgress, setEdictProgress] = useState<Record<number, number>>({});

    // ── Set page title ───────────────────────────────────────────────────────
    useEffect(() => { document.title = "Dashboard — Editaly"; }, []);

    // ── Load user name ───────────────────────────────────────────────────────
    useEffect(() => {
        const stored = localStorage.getItem("auth_user");
        if (stored) {
            try {
                const obj = JSON.parse(stored);
                if (obj.name) setUserName(obj.name.split(" ")[0]);
            } catch { /* ignore */ }
        }
    }, []);

    // ── Fetch edicts ─────────────────────────────────────────────────────────
    const fetchEdicts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/edicts`, {
                headers: getAuthHeader(),
            });
            if (!res.ok) throw new Error("Erro ao carregar editais");
            const data = await res.json();
            setEdicts(data.edicts ?? []);
        } catch {
            toast.error("Não foi possível carregar os editais.");
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { fetchEdicts(); }, [fetchEdicts]);

    // ── Load real progress from localStorage ─────────────────────────────────
    const refreshProgress = useCallback(() => {
        setEdictProgress((prev) => {
            const next: Record<number, number> = { ...prev };
            edicts.forEach((e) => {
                next[e.id] = getEdictProgress(e.id);
            });
            return next;
        });
    }, [edicts]);

    useEffect(() => { refreshProgress(); }, [refreshProgress]);

    // Re-compute progress when the window regains focus (user navigated back)
    useEffect(() => {
        const onFocus = () => refreshProgress();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [refreshProgress]);

    // ── Delete edict ─────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este edital?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`${API_BASE}/api/v1/edicts/${id}`, {
                method: "DELETE",
                headers: getAuthHeader(),
            });
            if (!res.ok) throw new Error();
            setEdicts((prev) => prev.filter((e) => e.id !== id));
            toast.success("Edital excluído com sucesso.");
        } catch {
            toast.error("Não foi possível excluir o edital.");
        } finally {
            setDeletingId(null);
        }
    };

    // ── Derived stats ────────────────────────────────────────────────────────
    const totalAbertos = edicts.length;
    const progressoMedio = edicts.length > 0
        ? Math.round(edicts.reduce((acc, e) => acc + (edictProgress[e.id] ?? 0), 0) / edicts.length)
        : 0;
    const atLimit = edicts.length >= EDICT_LIMIT;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex flex-col w-full min-h-screen p-6 md:p-8 space-y-8">

                {/* ── Cabeçalho ─────────────────────────────────── */}
                <header className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Olá, <span className="text-primary">{userName}</span>
                    </h1>
                    <p className="text-muted text-sm md:text-base">
                        Vamos continuar seus estudos ou adicione um novo edital.
                    </p>
                </header>

                {/* ── Cards de Métricas ──────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">

                    {/* Editais abertos */}
                    <div className="flex flex-col bg-card border border-card-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                                <IconBookOpen size={24} />
                            </div>
                            <h2 className="text-base font-semibold text-foreground">Editais abertos</h2>
                        </div>
                        <div className="mt-auto flex items-end justify-between">
                            <span className="text-4xl font-extrabold text-foreground">{totalAbertos}</span>
                            <span className="text-xs text-muted bg-background border border-card-border px-2.5 py-1 rounded-full">
                                limite: {EDICT_LIMIT}
                            </span>
                        </div>
                    </div>

                    {/* Progresso médio */}
                    <div className="flex flex-col bg-card border border-card-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-colors pointer-events-none" />
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center shrink-0 border border-teal-500/20">
                                <IconTrendUp size={24} />
                            </div>
                            <h2 className="text-base font-semibold text-foreground">Progresso médio</h2>
                        </div>
                        <div className="mt-auto flex items-end justify-between">
                            <span className="text-4xl font-extrabold text-foreground">{progressoMedio}%</span>
                            {progressoMedio > 0 && (
                                <div className="text-xs font-medium text-teal-400 flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-md">
                                    <IconTrendUp size={12} /> Desempenho
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Cabeçalho da lista ────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 mt-4 max-w-5xl">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Meus Editais</h3>
                        {atLimit && (
                            <p className="text-xs text-amber-400 mt-0.5">
                                Limite de {EDICT_LIMIT} editais atingido. Exclua um para adicionar outro.
                            </p>
                        )}
                    </div>

                    <button
                        id="btn-novo-edital"
                        onClick={() => router.push("/home/novo-edital")}
                        disabled={atLimit}
                        className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-[0.98] sm:ml-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50
                            ${atLimit
                                ? "bg-card border border-card-border text-muted cursor-not-allowed opacity-60"
                                : "bg-primary hover:bg-primary-hover shadow-primary/20 hover:shadow-md hover:shadow-primary/40"
                            }`}
                    >
                        <IconPlus size={18} />
                        <span>Novo edital</span>
                    </button>
                </div>

                {/* ── Listagem ──────────────────────────────────── */}
                <div className="flex flex-col gap-4 max-w-5xl">

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-card border border-card-border p-5 rounded-2xl animate-pulse">
                                    <div className="h-5 bg-card-border rounded w-1/3 mb-3" />
                                    <div className="h-3 bg-card-border rounded w-1/4 mb-6" />
                                    <div className="h-2 bg-card-border rounded w-full" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && edicts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 px-4 bg-card/60 border border-dashed border-card-border rounded-2xl text-center space-y-4">
                            <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center mb-2">
                                <IconBookOpen size={30} />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground">
                                Nenhum edital enviado ainda
                            </h4>
                            <p className="text-muted text-sm max-w-md">
                                Adicione o seu primeiro edital clicando em <strong className="text-foreground">Novo edital</strong> e deixe a IA organizar sua trilha de estudos.
                            </p>
                        </div>
                    )}

                    {/* Edict cards */}
                    {!loading && edicts.map((edict) => {
                        const progress = edictProgress[edict.id] ?? 0;
                        const color = progressColor(progress);
                        const label = STATUS_LABEL[edict.status];
                        const isDeleting = deletingId === edict.id;

                        return (
                            <div
                                key={edict.id}
                                className="bg-card border border-card-border p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-primary/40 transition-colors group cursor-pointer active:scale-[0.99]"
                                onClick={() => router.push(`/home/edital/${edict.id}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && router.push(`/home/edital/${edict.id}`)}
                            >
                                {/* Textos Esquerda */}
                                <div className="flex-1 w-full space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                                            {edict.title ?? edict.pdf_filename ?? `Edital #${edict.id}`}
                                        </h4>
                                        {/* Badge de status */}
                                        <span
                                            className="text-xs font-medium px-2.5 py-0.5 rounded-full border"
                                            style={{
                                                color,
                                                background: `${color}18`,
                                                borderColor: `${color}40`,
                                            }}
                                        >
                                            {label}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-sm text-muted">
                                        <span className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-full border border-card-border">
                                            <IconCalendar size={13} />
                                            Enviado em {formatDate(edict.created_at)}
                                        </span>
                                        {edict.pdf_size && (
                                            <span className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-full border border-card-border">
                                                <IconFilePdf size={13} />
                                                {formatSize(edict.pdf_size)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Barra de progresso */}
                                <div className="w-full md:w-56 space-y-2 shrink-0">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Progresso</span>
                                        <span className="text-sm font-bold text-foreground">{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-card-border">
                                        <div
                                            className="h-full transition-all duration-700 ease-out relative"
                                            style={{ width: `${progress}%`, background: color }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                                        </div>
                                    </div>
                                </div>

                                {/* Botão excluir */}
                                <button
                                    id={`btn-delete-edict-${edict.id}`}
                                    onClick={(e) => { e.stopPropagation(); handleDelete(edict.id); }}
                                    disabled={isDeleting}
                                    title="Excluir edital"
                                    className="w-9 h-9 rounded-xl bg-background border border-card-border text-muted hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                >
                                    {isDeleting ? <IconSpinner size={15} /> : <IconTrash size={15} />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
