'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Importamos o teu componente complexo sem SSR (Server Side Rendering)
// porque o Konva/Canvas precisa de acesso à janela do browser.
const PadelCourt = dynamic(() => import('@/src/components/PadelCourt'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
            <Loader2 className="animate-spin" /> A preparar o campo...
        </div>
    ),
});

export default function TaticaPage() {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">

            {/* Barra de Topo Simples para Voltar */}
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

            {/* O teu Componente PadelCourt faz o resto! */}
            <div className="flex-1 bg-slate-900 overflow-hidden">
                <Suspense fallback={<div className="p-10 text-center">A carregar editor...</div>}>
                    <PadelCourt />
                </Suspense>
            </div>
        </div>
    );
}