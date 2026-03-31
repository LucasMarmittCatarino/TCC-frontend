import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
    title: "Cadastro | TCC",
    description: "Crie sua conta",
};

export default function RegisterPage() {
    return (
        <main
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "var(--background)" }}
        >
            <RegisterForm />
        </main>
    );
}
