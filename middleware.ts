import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    // 1. Criar a resposta inicial
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return response;

    // 2. Instanciar o cliente Supabase com a lógica correta de sincronização
    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Atualiza os cookies no pedido (para o Supabase ler de imediato)
                    request.cookies.set({ name, value, ...options });
                    // Atualiza os cookies na resposta (para o browser guardar)
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: "", ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    // 3. Importante: refrescar a sessão (necessário para o F5 funcionar sempre)
    // O getUser() é mais seguro que o getSession() no middleware.
    const { data: { user } } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // 4. Proteção de Rotas com Redirecionamento Inteligente
    if (!user && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", path);
        return redirectWithCookies(request, url, response);
    }

    if (user && path.startsWith("/login")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return redirectWithCookies(request, url, response);
    }

    return response;
}

// FUNÇÃO AUXILIAR: Garante que os cookies (Set-Cookie headers) são passados para o redirecionamento
function redirectWithCookies(request: NextRequest, url: URL, response: NextResponse) {
    const redirectResponse = NextResponse.redirect(url);

    // Em vez de iterar pelos cookies, copiamos os headers 'set-cookie'
    // Isto preserva flags como httpOnly, secure, maxAge, etc.
    const setCookies = response.headers.getSetCookie();
    if (setCookies.length > 0) {
        setCookies.forEach((cookie) => {
            redirectResponse.headers.append("set-cookie", cookie);
        });
    }

    return redirectResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};