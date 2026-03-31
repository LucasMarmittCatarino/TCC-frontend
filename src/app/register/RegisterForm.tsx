"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    api?: string[];
}

export default function RegisterForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const fieldMap: Record<string, keyof FormData> = {
            name: "name",
            email: "email",
            password: "password",
            "confirm-password": "confirmPassword",
        };
        const field = fieldMap[id];
        if (field) {
            setFormData((prev) => ({ ...prev, [field]: value }));
            // Clear field error on typing
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Nome é obrigatório";
        }

        if (!formData.email.trim()) {
            newErrors.email = "E-mail é obrigatório";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "E-mail inválido";
        }

        if (!formData.password) {
            newErrors.password = "Senha é obrigatória";
        } else if (formData.password.length < 6) {
            newErrors.password = "Senha deve ter pelo menos 6 caracteres";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Confirmação de senha é obrigatória";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "As senhas não coincidem";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch("http://localhost:3001/api/v1/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    user: {
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        password_confirmation: formData.confirmPassword,
                    },
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                setErrors({ api: data.errors || ["Erro ao criar conta. Tente novamente."] });
            }
        } catch {
            setErrors({ api: ["Não foi possível conectar ao servidor. Verifique sua conexão."] });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        "w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200";
    const inputStyle = (hasError: boolean) => ({
        background: "var(--input-bg)",
        border: `1px solid ${hasError ? "#ef4444" : "var(--input-border)"}`,
        color: "var(--foreground)",
    });

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

            {/* Success Banner */}
            {success && (
                <div
                    className="rounded-lg px-4 py-3 mb-5 text-sm flex items-center gap-2"
                    style={{
                        background: "rgba(34, 197, 94, 0.12)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        color: "#22c55e",
                    }}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Conta criada com sucesso! Redirecionando para o login...
                </div>
            )}

            {/* API Errors */}
            {errors.api && errors.api.length > 0 && (
                <div
                    className="rounded-lg px-4 py-3 mb-5 text-sm"
                    style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#ef4444",
                    }}
                >
                    {errors.api.map((err, i) => (
                        <p key={i}>{err}</p>
                    ))}
                </div>
            )}

            {/* Form */}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
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
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass}
                        style={inputStyle(!!errors.name)}
                        onFocus={(e) => (e.target.style.borderColor = errors.name ? "#ef4444" : "var(--primary)")}
                        onBlur={(e) => (e.target.style.borderColor = errors.name ? "#ef4444" : "var(--input-border)")}
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{errors.name}</p>
                    )}
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
                        value={formData.email}
                        onChange={handleChange}
                        className={inputClass}
                        style={inputStyle(!!errors.email)}
                        onFocus={(e) => (e.target.style.borderColor = errors.email ? "#ef4444" : "var(--primary)")}
                        onBlur={(e) => (e.target.style.borderColor = errors.email ? "#ef4444" : "var(--input-border)")}
                        disabled={isLoading}
                    />
                    {errors.email && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{errors.email}</p>
                    )}
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
                        value={formData.password}
                        onChange={handleChange}
                        className={inputClass}
                        style={inputStyle(!!errors.password)}
                        onFocus={(e) => (e.target.style.borderColor = errors.password ? "#ef4444" : "var(--primary)")}
                        onBlur={(e) => (e.target.style.borderColor = errors.password ? "#ef4444" : "var(--input-border)")}
                        disabled={isLoading}
                    />
                    {errors.password && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{errors.password}</p>
                    )}
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
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={inputClass}
                        style={inputStyle(!!errors.confirmPassword)}
                        onFocus={(e) => (e.target.style.borderColor = errors.confirmPassword ? "#ef4444" : "var(--primary)")}
                        onBlur={(e) => (e.target.style.borderColor = errors.confirmPassword ? "#ef4444" : "var(--input-border)")}
                        disabled={isLoading}
                    />
                    {errors.confirmPassword && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{errors.confirmPassword}</p>
                    )}
                </div>

                {/* Botão */}
                <button
                    type="submit"
                    id="register-submit"
                    disabled={isLoading || success}
                    className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 cursor-pointer mt-1 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: "var(--primary)" }}
                >
                    {isLoading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Criando conta...
                        </>
                    ) : (
                        "Criar conta"
                    )}
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
