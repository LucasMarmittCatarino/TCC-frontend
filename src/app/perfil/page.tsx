"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconChevronLeft({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function IconUser({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

function IconCamera({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function IconTrash({ size = 14 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

// ─── Allowed types ────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/webp", "image/png", "image/gif"];
const ALLOWED_LABEL = "JPEG, WebP, PNG ou GIF";
const MAX_AVATAR_MB = 2;

// ─── API base ─────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthUser(): Record<string, string> | null {
    try {
        const stored = localStorage.getItem("auth_user");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName]               = useState("");
    const [email, setEmail]             = useState("");
    const [avatarUrl, setAvatarUrl]     = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [saving, setSaving]           = useState(false);
    const [avatarSaving, setAvatarSaving] = useState(false);
    const [successMsg, setSuccessMsg]   = useState("");

    // ── Load from localStorage ───────────────────────────────────────────────
    useEffect(() => {
        document.title = "Meu Perfil — Editaly";
        const obj = getAuthUser();
        if (obj) {
            setName(obj.name ?? "");
            setEmail(obj.email ?? "");
            setAvatarUrl(obj.avatar_url ?? null);
        }
    }, []);

    // ── Update auth_user in localStorage & dispatch event ───────────────────
    const syncLocalUser = (updates: Record<string, string | null>) => {
        try {
            const obj = getAuthUser() ?? {};
            const merged = { ...obj, ...updates };
            // Remove null keys
            Object.keys(merged).forEach((k) => merged[k] === null && delete merged[k]);
            localStorage.setItem("auth_user", JSON.stringify(merged));
            window.dispatchEvent(new Event("avatar_updated"));
        } catch { /* ignore */ }
    };

    // ── Handle avatar file pick ──────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setAvatarError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setAvatarError(`Formato inválido. Use ${ALLOWED_LABEL}.`);
            return;
        }
        if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
            setAvatarError(`O arquivo deve ter no máximo ${MAX_AVATAR_MB} MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string;

            // Optimistically update UI
            setAvatarUrl(dataUrl);
            setAvatarSaving(true);

            try {
                const token = getAuthToken();
                const res = await fetch(`${API_BASE}/api/v1/profile`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ profile: { avatar_url: dataUrl } }),
                });

                if (res.ok) {
                    const data = await res.json();
                    // Persist the server-confirmed avatar in auth_user
                    syncLocalUser({ avatar_url: data.user?.avatar_url ?? dataUrl });
                } else {
                    // Server error — still keep the local preview but warn
                    setAvatarError("Não foi possível salvar o avatar no servidor.");
                    syncLocalUser({ avatar_url: dataUrl });
                }
            } catch {
                setAvatarError("Erro de conexão ao salvar avatar.");
                syncLocalUser({ avatar_url: dataUrl });
            } finally {
                setAvatarSaving(false);
            }
        };
        reader.readAsDataURL(file);

        // reset input so same file can be re-selected
        e.target.value = "";
    };

    const handleRemoveAvatar = async () => {
        setAvatarUrl(null);
        setAvatarSaving(true);

        try {
            const token = getAuthToken();
            await fetch(`${API_BASE}/api/v1/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ profile: { avatar_url: "" } }),
            });
        } catch { /* ignore */ } finally {
            setAvatarSaving(false);
        }

        // Remove from local auth_user
        try {
            const obj = getAuthUser() ?? {};
            delete obj.avatar_url;
            localStorage.setItem("auth_user", JSON.stringify(obj));
            window.dispatchEvent(new Event("avatar_updated"));
        } catch { /* ignore */ }
    };

    // ── Save profile (name only — email read-only) ────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg("");

        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE}/api/v1/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ profile: { name: name.trim() } }),
            });

            if (res.ok) {
                const data = await res.json();
                // Update localStorage with server-confirmed values
                syncLocalUser({
                    name: data.user?.name ?? name.trim(),
                    email: data.user?.email ?? email,
                    ...(data.user?.avatar_url ? { avatar_url: data.user.avatar_url } : {}),
                });
                setSuccessMsg("Perfil atualizado com sucesso!");
            } else {
                const data = await res.json().catch(() => ({}));
                setSuccessMsg(data.errors?.[0] ?? "Erro ao atualizar o perfil.");
            }
        } catch {
            // Fallback: update only locally
            syncLocalUser({ name: name.trim() });
            setSuccessMsg("Perfil atualizado localmente.");
        } finally {
            setSaving(false);
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    };

    const handleLogout = () => {
        document.cookie = "auth_token=; path=/; max-age=0";
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        router.push("/login");
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen w-full px-6 py-12" style={{ background: "var(--background)" }}>
            <div className="max-w-4xl mx-auto space-y-8">

                {/* ── Cabeçalho ─────────────────────────────────── */}
                <div className="space-y-4">
                    <Link
                        href="/home"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-colors w-fit"
                        style={{ color: "var(--muted)" }}
                    >
                        <IconChevronLeft size={16} />
                        voltar ao dashboard
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                            Meu Perfil
                        </h1>
                        <p className="mt-2 text-base" style={{ color: "var(--muted)" }}>
                            Gerencie suas informações pessoais e configurações de conta.
                        </p>
                    </div>
                </div>

                {/* ── Grid ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 items-start">

                    {/* ── Coluna Esquerda: avatar + logout ──────── */}
                    <div
                        className="rounded-2xl p-6 flex flex-col items-center text-center shadow-sm"
                        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
                    >
                        {/* Avatar */}
                        <div className="relative group mb-4">
                            <div
                                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-2 shadow-sm"
                                style={{
                                    borderColor: "var(--card-border)",
                                    background: "linear-gradient(135deg, var(--primary), #818cf8)",
                                    color: "white",
                                }}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <IconUser size={40} />
                                )}
                            </div>

                            {/* Saving spinner overlay */}
                            {avatarSaving && (
                                <div className="absolute inset-0 rounded-full flex items-center justify-center"
                                    style={{ background: "rgba(0,0,0,0.45)" }}>
                                    <svg className="animate-spin" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                                        <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                </div>
                            )}

                            {/* Camera button */}
                            <button
                                id="btn-trocar-avatar"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md border hover:scale-105 transition-transform cursor-pointer"
                                style={{
                                    backgroundColor: "var(--card-bg)",
                                    borderColor: "var(--card-border)",
                                    color: "var(--foreground)",
                                }}
                                title="Trocar foto"
                                disabled={avatarSaving}
                            >
                                <IconCamera size={16} />
                            </button>

                            <input
                                ref={fileInputRef}
                                id="avatar-input"
                                type="file"
                                accept="image/jpeg,image/webp,image/png,image/gif"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Avatar error */}
                        {avatarError && (
                            <p className="text-xs text-red-400 mb-2 px-2">{avatarError}</p>
                        )}

                        {/* Remove avatar */}
                        {avatarUrl && (
                            <button
                                id="btn-remover-avatar"
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="flex items-center gap-1.5 text-xs text-muted hover:text-red-400 transition-colors mb-3 cursor-pointer"
                                disabled={avatarSaving}
                            >
                                <IconTrash size={12} />
                                Remover foto
                            </button>
                        )}

                        {/* Formats hint */}
                        <p className="text-[11px] mb-6" style={{ color: "var(--muted)" }}>
                            {ALLOWED_LABEL} · máx. {MAX_AVATAR_MB} MB
                        </p>

                        {/* Name & Email */}
                        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>{name || "Usuário"}</h2>
                        <p className="text-sm font-medium mb-8" style={{ color: "var(--muted)" }}>{email || "—"}</p>

                        {/* Logout */}
                        <button
                            id="btn-logout"
                            onClick={handleLogout}
                            className="w-full py-2.5 px-4 rounded-lg font-medium border border-rose-500 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                            Sair da conta
                        </button>
                    </div>

                    {/* ── Coluna Direita: formulário ─────────────── */}
                    <div
                        className="rounded-2xl p-8 shadow-sm"
                        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
                    >
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                                Detalhes da conta
                            </h2>
                            <p className="mt-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
                                Atualize suas informações pessoais
                            </p>
                        </div>

                        <hr style={{ borderColor: "var(--card-border)" }} className="my-6" />

                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>
                                    Informações Pessoais
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="profile-name"
                                            className="block text-sm font-medium mb-1.5"
                                            style={{ color: "var(--foreground)" }}
                                        >
                                            Nome Completo
                                        </label>
                                        <input
                                            id="profile-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg outline-none transition-colors border"
                                            style={{
                                                backgroundColor: "var(--card-bg)",
                                                borderColor: "var(--card-border)",
                                                color: "var(--foreground)",
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                                            onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="profile-email"
                                            className="block text-sm font-medium mb-1.5"
                                            style={{ color: "var(--foreground)" }}
                                        >
                                            E-mail
                                        </label>
                                        <input
                                            id="profile-email"
                                            type="email"
                                            value={email}
                                            readOnly
                                            className="w-full px-4 py-2.5 rounded-lg outline-none border"
                                            style={{
                                                backgroundColor: "var(--card-bg)",
                                                borderColor: "var(--card-border)",
                                                color: "var(--muted)",
                                                cursor: "default",
                                                opacity: 0.7,
                                            }}
                                        />
                                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                                            O e-mail não pode ser alterado.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <div>
                                    {successMsg && (
                                        <span className={`text-sm font-medium ${successMsg.includes("Erro") || successMsg.includes("Não") ? "text-red-400" : "text-green-500"}`}>
                                            {successMsg}
                                        </span>
                                    )}
                                </div>
                                <button
                                    id="btn-salvar-perfil"
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-lg font-medium transition-opacity cursor-pointer"
                                    style={{
                                        backgroundColor: "var(--primary)",
                                        color: "white",
                                        opacity: saving ? 0.7 : 1,
                                        cursor: saving ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {saving ? "Salvando..." : "Salvar Alterações"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
