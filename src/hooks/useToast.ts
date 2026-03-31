import { useCallback, useState } from "react";
import { type ToastItem, type ToastType } from "@/components/Toast";

let counter = 0;

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info", duration?: number) => {
        const id = `toast-${++counter}`;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (message: string, duration?: number) => addToast(message, "success", duration),
        error: (message: string, duration?: number) => addToast(message, "error", duration),
        info: (message: string, duration?: number) => addToast(message, "info", duration),
    };

    return { toasts, toast, removeToast };
}
