import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    // 1. Criar uma resposta inicial vazia e preparar headers
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error("Middleware: Variáveis de ambiente Supabase em falta.");
            return response;
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        );
                        response = NextResponse.next({
                            request,
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // 2. Verificar o utilizador
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        const path = request.nextUrl.pathname;

        // 3. Proteção de Rotas

        // Se NÃO estiver logado e tentar entrar em áreas privadas
        if (!user && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("next", path);

            // Criar a resposta de redirecionamento
            const redirectResponse = NextResponse.redirect(url);

            // MAGIA AQUI: Copiar os cookies que o Supabase possa ter atualizado!
            response.cookies.getAll().forEach((cookie) => {
                redirectResponse.cookies.set(cookie.name, cookie.value);
            });

            return redirectResponse;
        }

        // Se ESTIVER logado e tentar ir para Login
        if (user && path.startsWith("/login")) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";

            // Criar a resposta de redirecionamento
            const redirectResponse = NextResponse.redirect(url);

            // MAGIA AQUI: Copiar os cookies que o Supabase possa ter atualizado!
            response.cookies.getAll().forEach((cookie) => {
                redirectResponse.cookies.set(cookie.name, cookie.value);
            });

            return redirectResponse;
        }

    } catch (e) {
        console.error("Middleware Exception:", e);
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }

    return response; // Se não houver redirect, devolve a resposta normal com os cookies corretos
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};