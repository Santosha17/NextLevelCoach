import { createBrowserClient } from '@supabase/ssr';

// Variável para guardar a conexão no navegador
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Proteção contra build errors (caso falte variáveis)
    if (!url || !key) {
        return createBrowserClient(
            url || 'https://placeholder.supabase.co',
            key || 'placeholder'
        );
    }

    // 1. No Servidor (SSR/Build), criamos SEMPRE um novo cliente.
    // Isto evita que pedidos de utilizadores diferentes se misturem no servidor.
    if (typeof window === 'undefined') {
        return createBrowserClient(url, key);
    }

    // 2. No Navegador (Cliente), usamos SEMPRE a mesma instância (Singleton).
    // Isto impede que o React recarregue os componentes infinitamente (o tal loop).
    // O createBrowserClient já sabe ler os cookies atualizados automaticamente.
    if (!clientInstance) {
        clientInstance = createBrowserClient(url, key);
    }

    return clientInstance;
}