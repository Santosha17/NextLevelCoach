'use client';

import React, { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';

const PadelCourt = dynamic(() => import('@/src/components/PadelCourt'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
            <Loader2 className="animate-spin" /> A preparar o campo...
        </div>
    ),
});

export default function TaticaPage() {
    const supabase = createClient();
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error || !session?.user) {
                    router.push('/login');
                    return;
                }
            } catch (e) {
                console.error('Erro a verificar sessão em /dashboard/tatica:', e);
                if (isMounted) router.push('/login');
            } finally {
                if (isMounted) setChecking(false);
            }
        };

        checkSession();

        return () => {
            isMounted = false;
        };
    }, [router, supabase]);

    if (checking) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
                <Loader2 className="animate-spin" /> A carregar editor...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition font-bold text-sm"
                >
                    <ArrowLeft size={18} />
                    Voltar à Biblioteca
                </Link>
                <div className="h-4 w-px bg-slate-600"></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Editor Tático
        </span>
            </div>

            <div className="flex-1 bg-slate-900 overflow-hidden">
                <Suspense
                    fallback={
                        <div className="min-h-full flex items-center justify-center text-green-500 gap-2">
                            <Loader2 className="animate-spin" /> A carregar editor...
                        </div>
                    }
                >
                    <PadelCourt />
                </Suspense>
            </div>
        </div>
    );
}
