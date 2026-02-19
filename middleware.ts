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
        // Verificar se as variáveis de ambiente existem (evita crash imediato)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error("Middleware: Variáveis de ambiente Supabase em falta.");
            return response; // Deixa passar sem tentar auth para não dar erro 500
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
                        // Atualiza os cookies no pedido
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        );

                        // Recria a resposta para manter o contexto
                        response = NextResponse.next({
                            request,
                        });

                        // Atualiza os cookies na resposta final
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // 2. Verificar o utilizador (Protegido contra falhas de rede)
        // O getUser() é mais seguro que getSession() no middleware
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            // Se houver erro no token (expirado/inválido), ignoramos e tratamos como "não logado"
            // console.log("Middleware Auth Error (inofensivo se for logout):", error.message);
        }

        const path = request.nextUrl.pathname;

        // 3. Proteção de Rotas

        // Se NÃO estiver logado e tentar entrar em áreas privadas
        if (!user && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            // Adiciona o parâmetro 'next' para redirecionar de volta após login (opcional)
            url.searchParams.set("next", path);
            return NextResponse.redirect(url);
        }

        // Se ESTIVER logado e tentar ir para Login ou Registo
        if (user && (path.startsWith("/login") || path === "/")) {
            // Opcional: Se quiseres que a Home '/' também redirecione para dashboard
            if (path.startsWith("/login")) {
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard";
                return NextResponse.redirect(url);
            }
        }

    } catch (e) {
        // Se acontecer um erro catastrófico, não partimos o site.
        // Apenas deixamos o utilizador passar (o layout ou a página vão lidar com a falta de dados)
        console.error("Middleware Exception:", e);
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (public images)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};