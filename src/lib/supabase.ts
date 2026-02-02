import { createBrowserClient } from '@supabase/ssr';

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (clientInstance) {
        return clientInstance;
    }

    clientInstance = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );

    return clientInstance;
}
