"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Placeholder for user context data
const initialUserData = {
    name: "Lucas Marmitt",
    email: "lucas@example.com",
    avatarUrl: null as string | null,
};

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

function IconCamera({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const [name, setName] = useState(initialUserData.name);
    const [email, setEmail] = useState(initialUserData.email);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initialUserData.avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAvatarPreview(url);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage("");

        // Mock API call to save user profile
        setTimeout(() => {
            setSaving(false);
            setSuccessMessage("Perfil atualizado com sucesso!");
            setTimeout(() => setSuccessMessage(""), 3000);
        }, 800);
    };

    const handleLogout = () => {
        document.cookie = "auth_token=; path=/; max-age=0";
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-neutral-50 px-6 py-12 dark:bg-neutral-900 w-full" style={{ background: "var(--background)" }}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Cabeçalho */}
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

                {/* Conteúdo (Dividido em duas colunas) */}
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 items-start">
                    {/* Coluna Esquerda: Quadrado com Perfil */}
                    <div
                        className="rounded-2xl p-6 flex flex-col items-center text-center shadow-sm"
                        style={{
                            backgroundColor: "var(--card-bg)",
                            border: "1px solid var(--card-border)",
                        }}
                    >
                        {/* Avatar */}
                        <div className="relative group mb-4">
                            <div
                                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-2 shadow-sm"
                                style={{
                                    borderColor: "var(--card-border)",
                                    background: "linear-gradient(135deg, var(--primary), #818cf8)",
                                    color: "white"
                                }}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <IconUser size={40} />
                                )}
                            </div>
                            
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md border hover:scale-105 transition-transform"
                                style={{
                                    backgroundColor: "var(--card-bg)",
                                    borderColor: "var(--card-border)",
                                    color: "var(--foreground)"
                                }}
                                title="Trocar foto"
                            >
                                <IconCamera size={16} />
                            </button>
                            
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Nome e Email */}
                        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>{name}</h2>
                        <p className="text-sm font-medium mb-8" style={{ color: "var(--muted)" }}>{email}</p>

                        {/* Botão Sair */}
                        <button
                            onClick={handleLogout}
                            className="w-full py-2.5 px-4 rounded-lg font-medium border border-rose-500 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                            Sair da conta
                        </button>
                    </div>

                    {/* Coluna Direita: Formulário */}
                    <div
                        className="rounded-2xl p-8 shadow-sm"
                        style={{
                            backgroundColor: "var(--card-bg)",
                            border: "1px solid var(--card-border)",
                        }}
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
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                                            Nome Completo
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg outline-none transition-colors border"
                                            style={{
                                                backgroundColor: "var(--card-bg)",
                                                borderColor: "var(--card-border)",
                                                color: "var(--foreground)"
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                            onBlur={(e) => e.target.style.borderColor = "var(--card-border)"}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                                            E-mail
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg outline-none transition-colors border"
                                            style={{
                                                backgroundColor: "var(--card-bg)",
                                                borderColor: "var(--card-border)",
                                                color: "var(--foreground)"
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                            onBlur={(e) => e.target.style.borderColor = "var(--card-border)"}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <div>
                                    {successMessage && (
                                        <span className="text-sm font-medium text-green-500">
                                            {successMessage}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-lg font-medium transition-opacity"
                                    style={{
                                        backgroundColor: "var(--primary)",
                                        color: "white",
                                        opacity: saving ? 0.7 : 1,
                                        cursor: saving ? "not-allowed" : "pointer"
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
