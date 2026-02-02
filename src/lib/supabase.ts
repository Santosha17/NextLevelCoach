import { createBrowserClient } from '@supabase/ssr'

// Variável global para guardar a conexão
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    // Se a conexão já existe, DEVOLVE A MESMA (Singleton)
    // Isto impede que o useEffect dispare novamente porque o objeto é exatamente o mesmo
    if (clientInstance) {
        return clientInstance;
    }

    // Se não existe, cria a primeira vez
    clientInstance = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    return clientInstance;
}