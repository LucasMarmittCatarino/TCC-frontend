"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function IconTrail({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
    );
}

function IconLogout({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    );
}

function IconChevronLeft({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

// ─── Nav item data ─────────────────────────────────────────────────────────────

const navItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        href: "/home",
        icon: IconDashboard,
        dynamicHref: false,
    },
    {
        id: "trilha",
        label: "Trilha de Estudos",
        href: "/home",           // fallback; overridden below
        icon: IconTrail,
        dynamicHref: true,       // uses lastEdictId
    },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────

// ─── Per-user localStorage key for last trail location ───────────────────────
function trailPathKey(userId?: string | number): string {
    return userId ? `trail_path_${userId}` : "trail_path_guest";
}

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const width = collapsed ? "72px" : "240px";

    // ── Real user from localStorage ──────────────────────────────────────────
    const [user, setUser] = useState({ name: "", email: "", id: "" });
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [lastTrailPath, setLastTrailPath] = useState<string | null>(null);
    const userIdRef = useRef<string>("");

    // Track trail path: every time we're inside /home/edital/... persist the full path
    const prevPathname = useRef<string | null>(null);
    useEffect(() => {
        const key = trailPathKey(userIdRef.current);
        if (pathname.startsWith("/home/edital")) {
            localStorage.setItem(key, pathname);
            setLastTrailPath(pathname);
        } else if (prevPathname.current?.startsWith("/home/edital")) {
            // leaving the trail — keep the last trail path as-is so we can resume
            const saved = localStorage.getItem(key);
            if (saved) setLastTrailPath(saved);
        }
        prevPathname.current = pathname;
    }, [pathname]);

    useEffect(() => {
        const loadUser = () => {
            try {
                const stored = localStorage.getItem("auth_user");
                if (stored) {
                    const obj = JSON.parse(stored);
                    const uid = String(obj.id ?? obj.email ?? "");
                    userIdRef.current = uid;
                    setUser({ name: obj.name ?? "", email: obj.email ?? "", id: uid });
                    setAvatarUrl(obj.avatar_url ?? null);

                    // Restore per-user trail path
                    const saved = localStorage.getItem(trailPathKey(uid));
                    if (saved) setLastTrailPath(saved);
                } else {
                    setAvatarUrl(null);
                }
            } catch { /* ignore */ }
        };

        loadUser();

        // Listen for avatar changes dispatched by the profile page
        window.addEventListener("avatar_updated", loadUser);
        return () => window.removeEventListener("avatar_updated", loadUser);
    }, []);

    const handleLogout = () => {
        document.cookie = "auth_token=; path=/; max-age=0";
        // Don't erase the per-user trail path on logout — it must persist across sessions
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("last_edict_id");
        // Legacy cleanup
        localStorage.removeItem("avatar_url");
        localStorage.removeItem("trail_path_guest");
        setLastTrailPath(null);
        userIdRef.current = "";
        router.push("/login");
    };

    return (
        <aside
            style={{
                width,
                minWidth: width,
                background: "var(--card-bg)",
                borderRight: "1px solid var(--card-border)",
                transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* ── Logo / Brand ───────────────────────────────── */}
            <div
                style={{
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "space-between",
                    padding: collapsed ? "0" : "0 12px 0 20px",
                    borderBottom: "1px solid var(--card-border)",
                    flexShrink: 0,
                    gap: "8px",
                }}
            >
                {/* Brand */}
                {!collapsed && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden", flex: 1 }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>

                    {!collapsed && (
                        <span
                            style={{
                                fontWeight: 700,
                                fontSize: "15px",
                                color: "var(--foreground)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                            }}
                        >
                            Editaly
                        </span>
                    )}
                </div>
                )}

                {/* ── Toggle button ──────────────────────────────── */}
                <button
                    id="sidebar-toggle"
                    onClick={() => setCollapsed((c) => !c)}
                    title={collapsed ? "Expandir menu" : "Recolher menu"}
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "1px solid var(--card-border)",
                        color: "var(--muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "background 0.2s, color 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = "var(--primary)";
                        el.style.color = "white";
                        el.style.borderColor = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = "transparent";
                        el.style.color = "var(--muted)";
                        el.style.borderColor = "var(--card-border)";
                    }}
                >
                    <span style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.25s", display: "flex" }}>
                        <IconChevronLeft size={14} />
                    </span>
                </button>
            </div>


            {/* ── Nav items ─────────────────────────────────── */}
            <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                {navItems.map((item) => {
                    const isTrail = item.dynamicHref;
                    const trailLocked = isTrail && !lastTrailPath;
                    const href = isTrail
                        ? (lastTrailPath ?? "/home")
                        : item.href;
                    const isActive = isTrail
                        ? pathname.startsWith("/home/edital")
                        : pathname === item.href;
                    const Icon = item.icon;

                    // Disabled state for trail item when no trail visited yet
                    if (trailLocked) {
                        return (
                            <div
                                key={item.id}
                                id={`nav-${item.id}`}
                                title={collapsed ? "Nenhuma trilha iniciada" : undefined}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: collapsed ? "center" : "flex-start",
                                    gap: "12px",
                                    padding: collapsed ? "10px 0" : "10px 14px",
                                    borderRadius: "10px",
                                    color: "var(--muted)",
                                    opacity: 0.4,
                                    fontSize: "14px",
                                    cursor: "not-allowed",
                                    userSelect: "none",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    position: "relative",
                                }}
                            >
                                <span style={{ flexShrink: 0 }}><Icon size={20} /></span>
                                {!collapsed && (
                                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {item.label}
                                        {/* Lock icon */}
                                        <svg width={11} height={11} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.8 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.id}
                            href={href}
                            id={`nav-${item.id}`}
                            title={collapsed ? item.label : undefined}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: collapsed ? "center" : "flex-start",
                                gap: "12px",
                                padding: collapsed ? "10px 0" : "10px 14px",
                                borderRadius: "10px",
                                textDecoration: "none",
                                color: isActive ? "white" : "var(--muted)",
                                background: isActive ? "var(--primary)" : "transparent",
                                fontWeight: isActive ? 600 : 400,
                                fontSize: "14px",
                                transition: "background 0.18s, color 0.18s",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.1)";
                                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--foreground)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)";
                                }
                            }}
                        >
                            <span style={{ flexShrink: 0 }}>
                                <Icon size={20} />
                            </span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Bottom section ────────────────────────────── */}
            <div
                style={{
                    padding: "8px",
                    borderTop: "1px solid var(--card-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    flexShrink: 0,
                }}
            >
                {/* User info */}
                <div
                    id="sidebar-user"
                    title={collapsed ? `${user.name}\n${user.email}` : undefined}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "space-between",
                        gap: collapsed ? "0" : "12px",
                        padding: collapsed ? "10px 0" : "10px 14px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        cursor: "default",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px", overflow: "hidden", flex: collapsed ? "none" : 1 }}>
                        {/* Avatar */}
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: avatarUrl ? "transparent" : "linear-gradient(135deg, var(--primary), #818cf8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                color: "white",
                                overflow: "hidden",
                            }}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <IconUser size={16} />
                            )}
                        </div>

                        {!collapsed && (
                            <div style={{ overflow: "hidden", flex: 1 }}>
                                <p
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "var(--foreground)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {user.name || "Usuário"}
                                </p>
                                <p
                                    style={{
                                        fontSize: "11px",
                                        color: "var(--muted)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {user.email || "—"}
                                </p>
                            </div>
                        )}
                    </div>

                    {!collapsed && (
                        <button
                            id="user-settings-btn"
                            onClick={() => router.push("/perfil")}
                            title="Configurações de Usuário"
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                background: "transparent",
                                border: "1px solid var(--card-border)",
                                color: "var(--muted)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                flexShrink: 0,
                                transition: "background 0.2s, color 0.2s, border-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLButtonElement;
                                el.style.background = "var(--primary)";
                                el.style.color = "white";
                                el.style.borderColor = "var(--primary)";
                            }}
                            onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLButtonElement;
                                el.style.background = "transparent";
                                el.style.color = "var(--muted)";
                                el.style.borderColor = "var(--card-border)";
                            }}
                        >
                            <span style={{ transform: "rotate(180deg)", display: "flex" }}>
                                <IconChevronLeft size={14} />
                            </span>
                        </button>
                    )}
                </div>

                {/* Logout */}
                <button
                    id="sidebar-logout"
                    onClick={handleLogout}
                    title={collapsed ? "Sair" : undefined}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: "12px",
                        padding: collapsed ? "10px 0" : "10px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: "transparent",
                        color: "var(--muted)",
                        fontSize: "14px",
                        fontWeight: 400,
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        transition: "background 0.18s, color 0.18s",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                    }}
                >
                    <span style={{ flexShrink: 0 }}>
                        <IconLogout size={20} />
                    </span>
                    {!collapsed && <span>Sair</span>}
                </button>
            </div>
        </aside>
    );
}
