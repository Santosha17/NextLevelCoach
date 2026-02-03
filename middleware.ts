import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    // 1. Criar uma resposta inicial vazia
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Aqui está o segredo do F5:
                    // Atualiza os cookies no PEDIDO (para o Next.js ler agora)
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    // Recria a resposta para incluir os novos cookies do pedido
                    response = NextResponse.next({
                        request,
                    });

                    // Atualiza os cookies na RESPOSTA (para o navegador guardar)
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 2. IMPORTANTE: Isto verifica se o token expirou e faz o refresh automático
    // Sem isto, o F5 falha após 1 hora.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // 3. Proteção de Rotas (Lógica de Redirecionamento)

    // Se NÃO estiver logado e tentar entrar em áreas privadas -> Login
    if (!user && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Se ESTIVER logado e tentar ir para Login -> Dashboard
    if (user && path.startsWith("/login")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Retorna a resposta com os cookies atualizados
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};