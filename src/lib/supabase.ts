import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    // REMOVIDO: A lógica de Singleton (clientInstance).
    // Motivo: Precisamos que o cliente leia sempre os cookies mais recentes
    // a cada renderização para evitar conflitos com o Middleware.

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Mantive a tua proteção contra build errors (boa prática!)
    if (!url || !key) {
        return createBrowserClient(
            url || 'https://placeholder.supabase.co',
            key || 'placeholder'
        );
    }

    // Cria sempre uma nova instância para garantir sincronia com os cookies
    return createBrowserClient(url, key);
}