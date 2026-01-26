'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const PadelCourt = dynamic(() => import('@/src/components/PadelCourt'), {
    ssr: false,
    loading: () => <div className="text-white text-center py-20">A carregar campo...</div>,
});

export default function EditorPage() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-4">
                <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 transition text-sm font-bold">
                    <ArrowLeft size={18} />
                    Voltar à Biblioteca
                </Link>
                <div className="h-6 w-px bg-slate-700"></div>
                <span className="text-green-500 font-bold tracking-wider text-sm">MODO EDITOR</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-900">
                <Suspense fallback={<div>A carregar...</div>}>
                    <PadelCourt />
                </Suspense>
            </div>
        </div>
    );
}