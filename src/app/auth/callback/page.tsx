'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const [msg, setMsg] = useState('A verificar segurança...');

    // Proteção para não correr 2x em dev (React Strict Mode)
    const processedRef = useRef(false);

    useEffect(() => {
        const handleAuthCallback = async () => {
            const code = searchParams.get('code');
            const next = searchParams.get('next') || '/dashboard';
            const error = searchParams.get('error');
            const error_description = searchParams.get('error_description');

            if (error) {
                setMsg(`Erro: ${error_description || 'Ocorreu um erro.'}`);
                return;
            }

            // Se já processámos, não faz nada (evita erro de código já usado)
            if (processedRef.current) return;

            if (code) {
                processedRef.current = true; // Marca como processado
                try {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;

                    // Sucesso!
                    router.push(next);
                    router.refresh(); // Garante que o layout atualiza os dados do user
                } catch (error) {
                    setMsg('Erro na autenticação. O link pode ter expirado.');
                    console.error(error);
                    processedRef.current = false; // Permite tentar de novo se falhar
                }
            } else {
                // Se não há código, manda para o login ou dashboard se já tiver sessão
                router.push('/login');
            }
        };

        handleAuthCallback();
    }, [router, searchParams, supabase]);

    return (
        <div className="flex flex-col items-center gap-4 mt-20">
            <Loader2 size={48} className="animate-spin text-green-500" />
            <p className="text-slate-400 font-medium animate-pulse">{msg}</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
            <Suspense fallback={<div className="text-slate-500">A carregar autenticação...</div>}>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}