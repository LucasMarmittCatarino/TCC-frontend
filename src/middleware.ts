import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas que não requerem autenticação
const publicRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Permitir arquivos estáticos do Next.js
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get("auth_token")?.value;
    const isPublicRoute = publicRoutes.includes(pathname);

    // Se estiver logado e tentar acessar login/register, redirecionar para dashboard
    if (token && isPublicRoute) {
        return NextResponse.redirect(new URL("/home", request.url));
    }

    // Se não estiver logado e tentar acessar rota restrita, redirecionar para login
    if (!token && !isPublicRoute) {
        const loginUrl = new URL("/login", request.url);
        // Opcional: salvar a URL original para redirecionar depois do login
        // loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Caso base de acesso à raiz sem token
    if (pathname === "/") {
        if (!token) return NextResponse.redirect(new URL("/login", request.url));
        return NextResponse.redirect(new URL("/home", request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Definimos o matcher para cobrir toda a aplicação, exceto as pastas internas do Next
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
