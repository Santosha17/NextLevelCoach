import { createBrowserClient } from '@supabase/ssr';

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (clientInstance) {
        return clientInstance;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Se as variáveis não existirem, o build não quebra, ele apenas não cria o cliente.
    if (!url || !key) {
        // Durante o build no Cloudflare, isso pode acontecer.
        // Retornamos um cliente "dummy" ou tratamos o erro de forma silenciosa.
        return createBrowserClient(
            url || 'https://placeholder.supabase.co',
            key || 'placeholder'
        );
    }

    clientInstance = createBrowserClient(url, key);

    return clientInstance;
}