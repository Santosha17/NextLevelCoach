'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Componente interno que lê os parâmetros
function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const [msg, setMsg] = useState('A verificar segurança...');

    useEffect(() => {
        const handleAuthCallback = async () => {
            const code = searchParams.get('code');
            const next = searchParams.get('next') || '/dashboard';

            if (code) {
                try {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;
                    router.push(next);
                } catch (error) {
                    setMsg('Erro na autenticação. Tenta pedir o link novamente.');
                    console.error(error);
                }
            } else {
                router.push('/login');
            }
        };

        handleAuthCallback();
    }, [router, searchParams, supabase]);

    return (
        <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="animate-spin text-green-500" />
            <p className="text-slate-400">{msg}</p>
        </div>
    );
}

// Página Principal com Suspense (OBRIGATÓRIO para Static Export)
export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
            <Suspense fallback={<div className="text-slate-500">A carregar...</div>}>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}