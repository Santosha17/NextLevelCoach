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

    // Proteção para não correr 2x (React Strict Mode)
    const processedRef = useRef(false);

    useEffect(() => {
        const handleAuthCallback = async () => {
            // Se já processámos este pedido, ignora para não dar erro de "código já usado"
            if (processedRef.current) return;
            processedRef.current = true;

            const code = searchParams.get('code');
            const next = searchParams.get('next') || '/dashboard';
            const error = searchParams.get('error');
            const error_description = searchParams.get('error_description');

            // 1. Se houver erro na URL (ex: link cancelado)
            if (error) {
                setMsg(`Erro: ${error_description || 'Ocorreu um erro.'}`);
                return; // Pára aqui
            }

            // 2. Se houver código, tentamos trocar pela sessão
            if (code) {
                try {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        // TRUQUE IMPORTANTE:
                        // Se der erro ao trocar o código (ex: código já usado),
                        // verificamos se o utilizador JÁ tem sessão ativa.
                        // Se tiver, ignoramos o erro e avançamos.
                        const { data: { session } } = await supabase.auth.getSession();

                        if (session) {
                            console.log('Sessão recuperada, a redirecionar...');
                            router.push(next);
                            router.refresh();
                            return;
                        }

                        // Se não tem sessão e deu erro, lançamos a exceção
                        throw error;
                    }

                    // Sucesso na troca do código
                    router.push(next);
                    router.refresh();

                } catch (error) {
                    setMsg('O link expirou ou é inválido.');
                    console.error(error);
                    // Não mandamos para o login automaticamente para o utilizador poder ler a mensagem
                }
            } else {
                // 3. NÃO HÁ CÓDIGO NA URL
                // Antes de mandar para o login, verificamos se já está logado
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    // Já está logado, vai para o dashboard
                    router.push(next);
                } else {
                    // Não está logado nem tem código, vai para login
                    router.push('/login');
                }
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