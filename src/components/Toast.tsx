"use client";

import { useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

// ─── Single Toast ──────────────────────────────────────────────────────────────

const COLORS: Record<ToastType, { bg: string; border: string; text: string; bar: string }> = {
    success: {
        bg: "rgba(22, 163, 74, 0.12)",
        border: "rgba(22, 163, 74, 0.35)",
        text: "#4ade80",
        bar: "#16a34a",
    },
    error: {
        bg: "rgba(239, 68, 68, 0.12)",
        border: "rgba(239, 68, 68, 0.35)",
        text: "#f87171",
        bar: "#ef4444",
    },
    info: {
        bg: "rgba(99, 102, 241, 0.12)",
        border: "rgba(99, 102, 241, 0.35)",
        text: "#a5b4fc",
        bar: "#6366f1",
    },
};

function ToastIcon({ type }: { type: ToastType }) {
    if (type === "success") {
        return (
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
        );
    }
    if (type === "error") {
        return (
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
        );
    }
    return (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function SingleToast({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
    const c = COLORS[toast.type];
    const duration = toast.duration ?? 4000;
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Slide in
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    // Auto-dismiss
    useEffect(() => {
        timerRef.current = setTimeout(() => handleClose(), duration);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
    };

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "12px",
                border: `1px solid ${c.border}`,
                background: c.bg,
                backdropFilter: "blur(12px)",
                color: c.text,
                fontSize: "13px",
                fontWeight: 500,
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                minWidth: "280px",
                maxWidth: "380px",
                overflow: "hidden",
                transform: visible ? "translateX(0)" : "translateX(110%)",
                opacity: visible ? 1 : 0,
                transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
            }}
        >
            {/* Icon */}
            <span style={{ flexShrink: 0, marginTop: "1px" }}>
                <ToastIcon type={toast.type} />
            </span>

            {/* Message */}
            <span style={{ flex: 1, lineHeight: 1.5 }}>{toast.message}</span>

            {/* Close */}
            <button
                onClick={handleClose}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: c.text,
                    opacity: 0.6,
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                    marginTop: "1px",
                    flexShrink: 0,
                    transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.6")}
            >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Progress bar */}
            <span
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "2px",
                    background: c.bar,
                    width: visible ? "0%" : "100%",
                    transition: `width ${duration}ms linear`,
                    transitionDelay: visible ? "0ms" : "10ms",
                }}
            />
        </div>
    );
}

// ─── Toast Container ───────────────────────────────────────────────────────────

export function ToastContainer({ toasts, onRemove }: {
    toasts: ToastItem[];
    onRemove: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "flex-end",
            }}
        >
            {toasts.map((t) => (
                <SingleToast key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
}
