"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            router.replace("/home");
        } else {
            router.replace("/login");
        }
    }, [router]);

    return (
        <div
            className="flex min-h-screen items-center justify-center"
            style={{ background: "var(--background)" }}
        >
            <svg
                className="w-8 h-8 animate-spin"
                style={{ color: "var(--primary)" }}
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
            </svg>
        </div>
    );
}

