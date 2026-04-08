"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUploadCloud({ size = 40 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
    );
}

function IconFilePdf({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    );
}

function IconX({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function IconSparkles({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function IconArrowRight({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
        </svg>
    );
}

function IconCheckCircle({ size = 48 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getAuthHeader(): string {
    return typeof window !== "undefined" ? localStorage.getItem("auth_token") ?? "" : "";
}

// Etapas que aparecem na barra de progresso
const PROGRESS_STEPS = [
    "Enviando arquivo...",
    "Lendo conteúdo do edital...",
    "Identificando matérias...",
    "Estruturando trilha...",
    "Finalizando...",
];

// Duração total simulada em ms
const TOTAL_DURATION_MS = 6000;

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageState = "idle" | "loading" | "done";

export default function NovoEditalPage() {
    const router = useRouter();
    const { toasts, toast, removeToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [trailName, setTrailName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [trailError, setTrailError] = useState<string | null>(null);

    const [pageState, setPageState] = useState<PageState>("idle");
    const [progress, setProgress] = useState(0);
    const [stepLabel, setStepLabel] = useState(PROGRESS_STEPS[0]);

    // ── Animação de progresso ────────────────────────────────────────────────

    useEffect(() => {
        if (pageState !== "loading") return;

        const stepDuration = TOTAL_DURATION_MS / PROGRESS_STEPS.length;
        let elapsed = 0;

        const interval = setInterval(() => {
            elapsed += 80;
            const rawPct = Math.min((elapsed / TOTAL_DURATION_MS) * 100, 99);
            setProgress(rawPct);

            const stepIndex = Math.min(
                Math.floor((elapsed / TOTAL_DURATION_MS) * PROGRESS_STEPS.length),
                PROGRESS_STEPS.length - 1
            );
            setStepLabel(PROGRESS_STEPS[stepIndex]);
        }, 80);

        const done = setTimeout(() => {
            clearInterval(interval);
            setProgress(100);
            setStepLabel("Trilha gerada com sucesso!");
            setPageState("done");
            toast.success("Trilha de estudos gerada com sucesso!");
        }, TOTAL_DURATION_MS);

        return () => {
            clearInterval(interval);
            clearTimeout(done);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageState]);

    // ── File validation ──────────────────────────────────────────────────────

    const validateAndSetFile = useCallback((f: File) => {
        setFileError(null);
        if (f.type !== "application/pdf") {
            setFileError("O arquivo deve estar no formato PDF.");
            return;
        }
        if (f.size > MAX_SIZE_BYTES) {
            setFileError("O arquivo excede o tamanho máximo de 10 MB.");
            return;
        }
        setFile(f);
    }, []);

    // ── Drag events ──────────────────────────────────────────────────────────

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) validateAndSetFile(dropped);
    }, [validateAndSetFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) validateAndSetFile(selected);
    };

    const removeFile = () => {
        setFile(null);
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let hasError = false;
        if (!trailName.trim()) { setTrailError("O nome da trilha é obrigatório."); hasError = true; }
        else setTrailError(null);
        if (!file) { setFileError("Selecione um arquivo PDF para continuar."); hasError = true; }
        if (hasError) return;

        // Start progress animation immediately for better UX
        setProgress(0);
        setPageState("loading");

        try {
            if (!file) return; // type-guard (already validated above)
            const formData = new FormData();
            formData.append("edict[pdf]", file);
            formData.append("edict[status]", "not_started");

            const res = await fetch(`${API_BASE}/api/v1/edicts`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getAuthHeader()}` },
                body: formData,
            });

            if (res.status === 422) {
                const data = await res.json();
                // Volta para idle e mostra aviso amarelo
                setPageState("idle");
                setProgress(0);
                toast.warning(data.error ?? "Limite de editais atingido.");
                return;
            }

            if (!res.ok) {
                throw new Error("Erro ao enviar edital.");
            }
            // Sucesso: o useEffect da animação já vai cuidar do estado "done"
        } catch {
            setPageState("idle");
            setProgress(0);
            toast.error("Não foi possível enviar o edital. Tente novamente.");
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex flex-col items-center justify-center w-full min-h-screen px-4 py-12">

                {/* ── Voltar ─────────────────────────────────────────── */}
                {pageState === "idle" && (
                    <div className="w-full max-w-2xl mb-6">
                        <button
                            id="btn-voltar"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors text-sm font-medium cursor-pointer"
                        >
                            <IconArrowLeft size={16} />
                            Voltar
                        </button>
                    </div>
                )}

                {/* ── Cabeçalho ──────────────────────────────────────── */}
                <header className="w-full max-w-2xl mb-8 space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {pageState === "done" ? "Trilha gerada!" : "Enviar novo edital"}
                    </h1>
                    <p className="text-muted text-base">
                        {pageState === "done"
                            ? "Sua trilha de estudos está pronta para começar."
                            : "Faça upload de um PDF e nossa IA cuidará do resto!"}
                    </p>
                </header>

                {/* ══════════ IDLE: formulário ══════════ */}
                {pageState === "idle" && (
                    <form
                        id="form-novo-edital"
                        onSubmit={handleSubmit}
                        className="w-full max-w-2xl space-y-6"
                        noValidate
                    >
                        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">

                            {/* Cabeçalho do card */}
                            <div className="px-6 py-5 border-b border-card-border flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                                    <IconUploadCloud size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-foreground">Upload de documento</h2>
                                    <p className="text-xs text-muted mt-0.5">
                                        Envie seu edital em formato PDF (máx. 10 MB)
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">

                                {/* Nome da trilha */}
                                <div className="space-y-2">
                                    <label htmlFor="trail-name" className="block text-sm font-medium text-foreground">
                                        Nome da trilha
                                        <span className="text-red-400 ml-1" aria-hidden>*</span>
                                    </label>
                                    <input
                                        id="trail-name"
                                        type="text"
                                        value={trailName}
                                        onChange={(e) => { setTrailName(e.target.value); if (e.target.value.trim()) setTrailError(null); }}
                                        placeholder="Ex: Polícia Federal 2026"
                                        className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/60 outline-none transition-all
                                            focus:ring-2 focus:ring-primary/40 focus:border-primary
                                            ${trailError ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500" : "border-input-border"}`}
                                    />
                                    {trailError && <p className="text-xs text-red-400 mt-1">{trailError}</p>}
                                </div>

                                {/* Dropzone / arquivo selecionado */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">
                                        Arquivo PDF
                                        <span className="text-red-400 ml-1" aria-hidden>*</span>
                                    </label>

                                    {!file ? (
                                        <div
                                            id="dropzone"
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Área de upload de arquivo"
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                                            className={`
                                                relative flex flex-col items-center justify-center
                                                rounded-2xl border-2 border-dashed py-14 px-6 cursor-pointer
                                                transition-all duration-200 group select-none
                                                ${isDragging
                                                    ? "border-primary bg-primary/10 scale-[1.01]"
                                                    : fileError
                                                        ? "border-red-500/50 bg-red-500/5 hover:border-red-500/70 hover:bg-red-500/10"
                                                        : "border-card-border bg-background/40 hover:border-primary/50 hover:bg-primary/5"
                                                }
                                            `}
                                        >
                                            <div className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${isDragging ? "opacity-100" : "opacity-0"}`}
                                                style={{ background: "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)" }}
                                            />
                                            <div className={`transition-colors duration-200 mb-4 ${isDragging ? "text-primary" : "text-muted group-hover:text-primary/70"}`}>
                                                <IconUploadCloud size={44} />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground text-center">
                                                {isDragging ? "Solte o arquivo aqui!" : "Clique para selecionar"}
                                            </p>
                                            <p className="text-xs text-muted text-center mt-1.5">ou arraste e solte o arquivo</p>
                                            <p className="text-xs text-muted/60 text-center mt-3 bg-background/50 border border-card-border px-3 py-1 rounded-full">
                                                PDF • Máximo 10 MB
                                            </p>
                                            <input
                                                ref={fileInputRef}
                                                id="pdf-input"
                                                type="file"
                                                accept="application/pdf"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 bg-primary/5 border border-primary/25 rounded-xl px-5 py-4">
                                            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl text-primary flex items-center justify-center shrink-0">
                                                <IconFilePdf size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                                                <p className="text-xs text-muted mt-0.5">{formatFileSize(file.size)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                id="btn-remove-file"
                                                onClick={removeFile}
                                                title="Remover arquivo"
                                                className="w-7 h-7 rounded-lg bg-card border border-card-border text-muted hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all cursor-pointer shrink-0"
                                            >
                                                <IconX size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {fileError && <p className="text-xs text-red-400 mt-1">{fileError}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Botão Gerar trilha */}
                        <button
                            id="btn-gerar-trilha"
                            type="submit"
                            className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/40 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        >
                            <IconSparkles size={18} />
                            Gerar trilha
                        </button>
                    </form>
                )}

                {/* ══════════ LOADING: barra de progresso ══════════ */}
                {pageState === "loading" && (
                    <div className="w-full max-w-2xl space-y-8">
                        <div className="bg-card border border-card-border rounded-2xl p-8 space-y-7">

                            {/* Ícone animado */}
                            <div className="flex justify-center">
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                    {/* Anel giratório externo */}
                                    <svg className="absolute inset-0 animate-spin" viewBox="0 0 80 80" fill="none">
                                        <circle cx="40" cy="40" r="34" stroke="rgba(99,102,241,0.15)" strokeWidth="6" />
                                        <path d="M40 6 A34 34 0 0 1 74 40" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" />
                                    </svg>
                                    {/* Ícone central */}
                                    <div className="text-primary">
                                        <IconSparkles size={28} />
                                    </div>
                                </div>
                            </div>

                            {/* Título */}
                            <div className="text-center space-y-1">
                                <h2 className="text-lg font-bold text-foreground">Gerando trilha</h2>
                                <p className="text-sm text-muted">{stepLabel}</p>
                            </div>

                            {/* Barra de progresso */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted font-medium">Progresso</span>
                                    <span className="text-xs font-bold text-foreground">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-card-border">
                                    <div
                                        className="h-full rounded-full transition-all duration-150 ease-out relative"
                                        style={{
                                            width: `${progress}%`,
                                            background: "linear-gradient(90deg, var(--primary), #818cf8)",
                                        }}
                                    >
                                        {/* Brilho deslizante */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            {/* Info do arquivo */}
                            <div className="flex items-center gap-3 bg-background/50 border border-card-border rounded-xl px-4 py-3">
                                <div className="text-muted shrink-0">
                                    <IconFilePdf size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">{file?.name}</p>
                                    <p className="text-xs text-muted">{trailName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════ DONE: sucesso ══════════ */}
                {pageState === "done" && (
                    <div className="w-full max-w-2xl space-y-6">
                        <div className="bg-card border border-card-border rounded-2xl p-10 flex flex-col items-center text-center space-y-5">

                            {/* Ícone de sucesso */}
                            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 flex items-center justify-center">
                                <IconCheckCircle size={40} />
                            </div>

                            <div className="space-y-1.5">
                                <h2 className="text-xl font-bold text-foreground">{trailName}</h2>
                                <p className="text-sm text-muted">
                                    Sua trilha de estudos foi gerada e está pronta!
                                </p>
                            </div>

                            {/* Barra de progresso completa */}
                            <div className="w-full space-y-1.5">
                                <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-card-border">
                                    <div
                                        className="h-full rounded-full w-full transition-all duration-700"
                                        style={{ background: "linear-gradient(90deg, #16a34a, #4ade80)" }}
                                    />
                                </div>
                                <p className="text-xs text-green-400 font-medium text-right">100% concluído</p>
                            </div>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                id="btn-novo-edital"
                                onClick={() => {
                                    setFile(null);
                                    setTrailName("");
                                    setProgress(0);
                                    setPageState("idle");
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-card border border-card-border hover:border-primary/40 text-foreground px-6 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                Enviar outro edital
                            </button>

                            <button
                                id="btn-ir-trilha"
                                onClick={() => router.push("/home/trilha")}
                                className="flex-1 flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/40 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                Ir para trilha
                                <IconArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
