'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Globe, Shield, PenTool, Layout, Loader2 } from 'lucide-react';

export default function Home() {
    const supabase = createClient();
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    // O "Porteiro Inteligente"
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push('/dashboard');
            } else {
                setChecking(false);
            }
        };
        checkUser();
    }, []);

    if (checking) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
            <Loader2 className="animate-spin" /> A carregar...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-green-500 selection:text-slate-900 flex flex-col">


            {/* --- HERO SECTION --- */}
            <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
                {/* Luz de Fundo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-500/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="container mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-green-400 text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Nova Versão 2.0 Disponível
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight animate-in zoom-in-50 duration-700">
                        Eleva o teu treino <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">ao próximo nível.</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                        A ferramenta definitiva para treinadores de Padel. Cria, organiza e partilha exercícios táticos em segundos. Deixa o papel e a caneta no passado.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                        <Link href="/login">
                            <button className="px-8 py-4 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-xl text-lg transition transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-green-500/25">
                                Começar Grátis <ArrowRight size={20} />
                            </button>
                        </Link>

                        <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-lg transition border border-slate-700 flex items-center gap-2">
                            Saber Mais
                        </button>
                    </div>
                </div>
            </section>

            {/* --- RESTO DA PÁGINA (Igual) --- */}
            <section className="py-20 bg-slate-900 relative z-10">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo o que precisas num só lugar</h2>
                        <p className="text-slate-400">Desenvolvido por treinadores, para treinadores.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {/* Card 1 */}
                        <div className="col-span-1 md:col-span-2 bg-slate-800 p-8 rounded-3xl border border-slate-700 relative overflow-hidden group hover:border-green-500/30 transition duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition group-hover:bg-green-500/20"></div>
                            <div className="relative z-10">
                                <PenTool className="text-green-500 mb-4" size={40} />
                                <h3 className="text-2xl font-bold mb-2 text-white">Editor de Planos Profissional</h3>
                                <p className="text-slate-400 mb-6 max-w-md">Constrói aulas completas selecionando exercícios da tua biblioteca. Gera PDFs automáticos com a tua marca.</p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-blue-500/50 transition relative group">
                            <Layout className="text-blue-400 mb-4" size={40} />
                            <h3 className="text-xl font-bold mb-2 text-white">Organização Total</h3>
                            <p className="text-slate-400 text-sm">Categoriza os teus treinos por "Ataque", "Defesa" e encontra tudo em segundos.</p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-purple-500/50 transition relative group">
                            <Globe className="text-purple-400 mb-4" size={40} />
                            <h3 className="text-xl font-bold mb-2 text-white">Acesso em Qualquer Lugar</h3>
                            <p className="text-slate-400 text-sm">No tablet dentro do court ou no PC em casa. A tua biblioteca viaja contigo.</p>
                        </div>

                        {/* Card 4 */}
                        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-green-600 to-emerald-900 p-8 rounded-3xl relative overflow-hidden text-white flex flex-col justify-center shadow-xl">
                            <div className="z-10">
                                <Shield className="mb-4 text-green-200" size={40} />
                                <h3 className="text-2xl font-bold mb-2">Privacidade Garantida</h3>
                                <p className="text-green-100 mb-4 max-w-md">Os teus segredos estão seguros. Mantém as tuas táticas privadas.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 rotate-12">
                                <LockIcon size={200} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-green-500/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Pronto para começar?</h2>
                            <Link href="/login">
                                <button className="px-10 py-5 bg-white text-slate-900 font-bold rounded-xl text-xl hover:bg-slate-200 transition shadow-xl transform hover:-translate-y-1">
                                    Criar Conta Gratuita
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

const LockIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);