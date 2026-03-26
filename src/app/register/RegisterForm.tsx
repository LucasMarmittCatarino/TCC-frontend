"use client";

import Link from "next/link";

export default function RegisterForm() {
    return (
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
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                    </svg>
                </div>
                <h1
                    className="text-2xl font-bold"
                    style={{ color: "var(--foreground)" }}
                >
                    Criar conta
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    Preencha os dados abaixo para se cadastrar
                </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-5">
                {/* Nome completo */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="name"
                        className="text-sm font-medium"
                        style={{ color: "var(--foreground)" }}
                    >
                        Nome completo
                    </label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
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

                {/* E-mail */}
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

                {/* Confirmar senha */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="confirm-password"
                        className="text-sm font-medium"
                        style={{ color: "var(--foreground)" }}
                    >
                        Confirmar senha
                    </label>
                    <input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
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
                    id="register-submit"
                    className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 cursor-pointer mt-1 hover:opacity-90 active:scale-95"
                    style={{ background: "var(--primary)" }}
                >
                    Criar conta
                </button>
            </form>

            {/* Rodapé */}
            <p
                className="text-center text-sm mt-6"
                style={{ color: "var(--muted)" }}
            >
                Já tem conta?{" "}
                <Link
                    href="/login"
                    className="font-medium underline-offset-2 hover:underline"
                    style={{ color: "var(--primary)" }}
                >
                    Entrar
                </Link>
            </p>
        </div>
    );
}
