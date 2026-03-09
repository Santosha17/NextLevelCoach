'use client';

import React, { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Loader2, Share2, Download } from 'lucide-react';
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

    const triggerExport = () => {
        window.dispatchEvent(new CustomEvent('trigger-tatica-export'));
    };

    const triggerShare = () => {
        window.dispatchEvent(new CustomEvent('trigger-tatica-share'));
    };

    useEffect(() => {
        let isMounted = true;
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;
                if (!session?.user) { router.push('/login'); return; }
            } catch (e) { if (isMounted) router.push('/login'); } finally { if (isMounted) setChecking(false); }
        };
        checkSession();
        return () => { isMounted = false; };
    }, [router, supabase]);

    if (checking) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <div className="bg-slate-900/50 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between gap-4 z-50 sticky top-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition font-black text-xs uppercase tracking-tighter">
                        <ArrowLeft size={16} /> Voltar
                    </Link>
                    <div className="h-4 w-px bg-white/10"></div>
                    <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Tactical Editor</span>
                </div>

                <div className="flex gap-3">
                    {/* BOTÃO WHATSAPP */}
                    <button
                        onClick={triggerShare}
                        className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-green-900/20 flex items-center gap-2 active:scale-95"
                    >
                        <Share2 size={14} /> Partilhar
                    </button>

                    {/* BOTÃO EXPORTAR */}
                    <button
                        onClick={triggerExport}
                        className="bg-white hover:bg-slate-200 text-slate-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-white/5"
                    >
                        <Download size={14} /> Exportar PNG
                    </button>
                </div>
            </div>

            <div id="export-container" className="flex-1 bg-slate-950 overflow-hidden relative p-4 md:p-8">
                <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-500"/></div>}>
                    <PadelCourt />
                </Suspense>
            </div>
        </div>
    );
}