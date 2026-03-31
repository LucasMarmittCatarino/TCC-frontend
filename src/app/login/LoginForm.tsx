"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

export default function LoginForm() {
    const router = useRouter();
    const { toasts, toast, removeToast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            toast.error("Preencha o e-mail e a senha.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:3001/api/v1/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ session: { email, password } }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("auth_token", data.token);
                localStorage.setItem("auth_user", JSON.stringify(data.user));
                router.push("/home");
            } else {
                const message =
                    data?.error ||
                    data?.errors?.[0] ||
                    "E-mail ou senha incorretos.";
                toast.error(message);
            }
        } catch {
            toast.error("Não foi possível conectar ao servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div
                className="w-full max-w-md rounded-2xl p-8 shadow-2xl border"
                style={{
                    background: "var(--card-bg)",
                    borderColor: "var(--card-border)",
                }}
            >
                {/* Header */}
                <div className="mb-8 text-center">
                    <div
                        className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                        style={{ background: "var(--primary)" }}
                    >
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: "var(--foreground)" }}
                    >
                        Bem-vindo de volta
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                        Entre com sua conta para continuar
                    </p>
                </div>

                {/* Form */}
                <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="email"
                            className="text-sm font-medium"
                            style={{ color: "var(--foreground)" }}
                        >
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200"
                            style={{
                                background: "var(--input-bg)",
                                border: "1px solid var(--input-border)",
                                color: "var(--foreground)",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                            onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
                        />
                    </div>

                    {/* Senha */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium"
                            style={{ color: "var(--foreground)" }}
                        >
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200"
                            style={{
                                background: "var(--input-bg)",
                                border: "1px solid var(--input-border)",
                                color: "var(--foreground)",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                            onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
                        />
                    </div>

                    {/* Botão */}
                    <button
                        type="submit"
                        id="login-submit"
                        disabled={isLoading}
                        className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 cursor-pointer mt-1 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ background: "var(--primary)" }}
                    >
                        {isLoading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Entrando...
                            </>
                        ) : (
                            "Entrar"
                        )}
                    </button>
                </form>

                {/* Rodapé */}
                <p
                    className="text-center text-sm mt-6"
                    style={{ color: "var(--muted)" }}
                >
                    Não tem conta?{" "}
                    <Link
                        href="/register"
                        className="font-medium underline-offset-2 hover:underline"
                        style={{ color: "var(--primary)" }}
                    >
                        Cadastre-se
                    </Link>
                </p>
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </>
    );
}
