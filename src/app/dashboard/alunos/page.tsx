'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [msg, setMsg] = useState('A verificar segurança...');

    // Proteção para não correr múltiplas vezes
    const processedRef = useRef(false);

    useEffect(() => {
        const handleAuthCallback = async () => {
            // Se já processámos, ignora
            if (processedRef.current) return;
            processedRef.current = true;

            const code = searchParams.get('code');
            const next = searchParams.get('next') || '/dashboard';
            const error = searchParams.get('error');
            const error_desc = searchParams.get('error_description');

            if (error) {
                setStatus('error');
                setMsg(error_desc || 'Erro na verificação.');
                return;
            }

            if (code) {
                try {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        // TRUQUE: Se der erro, verificamos se já temos sessão ativa
                        // (Acontece muito em React Strict Mode ou se o email scanner clicou antes)
                        const { data: { session } } = await supabase.auth.getSession();

                        if (session) {
                            // Sucesso! Já estamos logados, ignora o erro.
                            console.log("Sessão já existe, a redirecionar...");
                            router.push(next);
                            return;
                        }

                        throw error;
                    }

                    // Sucesso normal
                    setStatus('success');
                    setMsg('Conta verificada! A entrar...');
                    setTimeout(() => {
                        router.push(next);
                        router.refresh();
                    }, 1000);

                } catch (error: any) {
                    console.error('Erro Auth:', error);
                    setStatus('error');
                    setMsg('O link expirou ou já foi usado. Tenta fazer login normalmente.');
                }
            } else {
                // Sem código na URL, manda para o login
                router.push('/login');
            }
        };

        handleAuthCallback();
    }, [router, searchParams, supabase]);

    return (
        <div className="flex flex-col items-center gap-6 mt-20 p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-sm w-full text-center">

            {status === 'loading' && (
                <>
                    <Loader2 size={48} className="animate-spin text-green-500" />
                    <p className="text-slate-400 font-medium animate-pulse">{msg}</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="text-green-500 bg-green-500/20 p-4 rounded-full">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Sucesso!</h2>
                    <p className="text-slate-400">{msg}</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="text-yellow-500 bg-yellow-500/20 p-4 rounded-full">
                        <AlertTriangle size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Atenção</h2>
                    <p className="text-slate-400 text-sm">{msg}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="mt-4 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold transition"
                    >
                        Ir para Login
                    </button>
                </>
            )}
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
            <Suspense fallback={<div className="text-slate-500">A carregar...</div>}>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}