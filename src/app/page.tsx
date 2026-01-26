'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Globe, Shield, PenTool, Layout, Users, Star } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-green-500 selection:text-slate-900 flex flex-col">

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-500/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="container mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-green-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Nova Versão 2.0 Disponível
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
                        Eleva o teu treino <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">ao próximo nível.</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        A ferramenta definitiva para treinadores de Padel. Cria, organiza e partilha exercícios táticos em segundos. Deixa o papel e caneta no passado.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/dashboard">
                            <button className="px-8 py-4 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-xl text-lg transition transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-green-500/25">
                                Começar Grátis <ArrowRight size={20} />
                            </button>
                        </Link>
                        <Link href="/community">
                            <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-lg transition border border-slate-700 flex items-center gap-2">
                                Explorar Comunidade
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- FUNCIONALIDADES (Bento Grid) --- */}
            <section className="py-20 bg-slate-900">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo o que precisas num só lugar</h2>
                        <p className="text-slate-400">Desenvolvido por treinadores, para treinadores.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

                        {/* Feature 1 */}
                        <div className="col-span-1 md:col-span-2 bg-slate-800 p-8 rounded-3xl border border-slate-700 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition group-hover:bg-green-500/20"></div>
                            <PenTool className="text-green-500 mb-4" size={40} />
                            <h3 className="text-2xl font-bold mb-2">Editor Tático Profissional</h3>
                            <p className="text-slate-400 mb-6">Desenha jogadas com setas inteligentes, linhas de passe e jogadores arrastáveis. Simples, rápido e intuitivo.</p>
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="flex items-center gap-4 text-sm text-slate-300">
                                    <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500"/> Desenho Livre</span>
                                    <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500"/> Setas de Movimento</span>
                                    <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500"/> Exportação HD</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-green-500/50 transition relative group">
                            <Layout className="text-blue-400 mb-4" size={40} />
                            <h3 className="text-xl font-bold mb-2">Organização Total</h3>
                            <p className="text-slate-400 text-sm">Categoriza os teus treinos por "Ataque", "Defesa", "Volei" e encontra tudo em segundos.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-green-500/50 transition relative group">
                            <Globe className="text-purple-400 mb-4" size={40} />
                            <h3 className="text-xl font-bold mb-2">Comunidade Global</h3>
                            <p className="text-slate-400 text-sm">Acede a uma biblioteca pública de exercícios. Copia, edita e adapta ao teu estilo.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-green-600 to-emerald-800 p-8 rounded-3xl relative overflow-hidden text-white flex flex-col justify-center">
                            <div className="z-10">
                                <Shield className="mb-4" size={40} />
                                <h3 className="text-2xl font-bold mb-2">Privacidade Garantida</h3>
                                <p className="text-green-100 mb-4">Os teus segredos estão seguros. Mantém as tuas táticas privadas ou partilha apenas o que quiseres.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-10 translate-y-10">
                                <LockIcon size={200} />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- SOCIAL PROOF --- */}
            <section className="py-20 border-t border-slate-800">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-sm font-bold uppercase text-slate-500 tracking-widest mb-8">Usado por treinadores em</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
                        {/* Logos fictícios ou texto estilizado */}
                        <span className="text-xl font-black text-white">FPP</span>
                        {/*<span className="text-xl font-black text-white">PREMIER PADEL</span>*/}
                        {/*<span className="text-xl font-black text-white">A1 PADEL</span>*/}
                        {/*<span className="text-xl font-black text-white">FPP</span>*/}
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="py-20 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para começar?</h2>
                        <p className="text-slate-400 text-lg mb-8">Junta-te a centenas de treinadores que já digitalizaram o seu método de trabalho.</p>
                        <Link href="/dashboard">
                            <button className="px-10 py-5 bg-white text-slate-900 font-bold rounded-xl text-xl hover:bg-slate-200 transition shadow-xl">
                                Criar Conta Gratuita
                            </button>
                        </Link>
                        <p className="mt-4 text-xs text-slate-500">Não é necessário cartão de crédito.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Pequeno helper para o ícone de fundo
const LockIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);