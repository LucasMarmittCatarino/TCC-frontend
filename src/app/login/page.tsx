import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
    title: "Login — Editaly",
    description: "Faça login na sua conta",
};

export default function LoginPage() {
    return (
        <main
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "var(--background)" }}
        >
            <LoginForm />
        </main>
    );
}
