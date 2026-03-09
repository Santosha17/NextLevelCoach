"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowRight,
    Shield,
    Zap,
    Target,
    Users,
    Loader2,
    CheckCircle2,
    Play
} from "lucide-react";

export default function Home() {
    const supabase = createClient();
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;
                if (session?.user) {
                    router.push("/dashboard");
                } else {
                    setChecking(false);
                }
            } catch (e) {
                if (isMounted) setChecking(false);
            }
        };
        checkUser();
        return () => { isMounted = false; };
    }, [router, supabase]);

    if (checking) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-600 gap-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <span className="font-black uppercase tracking-[0.3em] text-xs text-slate-500">Next Level Coach</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-red-500/30 flex flex-col font-sans scroll-smooth overflow-x-hidden">

            {/* NAV */}
            <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-900/20">
                            <Shield size={20} className="text-white fill-white/20" />
                        </div>
                        <span className="text-xl font-black italic uppercase tracking-tighter">
                            Next <span className="text-red-600">Level Coach</span>
                        </span>
                    </div>
                    <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <a href="#features" className="hover:text-white transition cursor-pointer">Funcionalidades</a>
                        <a href="#pricing" className="hover:text-white transition cursor-pointer">Preços</a>
                    </div>
                    <Link
                        href="/login"
                        className="bg-white text-black px-6 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        Entrar
                    </Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-24 px-6 text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-pulse">
                        <Zap size={12} fill="currentColor" /> Tactical Editor 2.0
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] mb-8">
                        Leva a tua tática ao <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
                            Próximo Nível
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
                        O editor tático de Padel mais rápido do mundo. Desenha, organiza e partilha exercícios profissionais em segundos.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/login" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest rounded-2xl transition-all shadow-2xl shadow-red-900/40 flex items-center justify-center gap-3 active:scale-95">
                                Começar Grátis <ArrowRight size={20} />
                            </button>
                        </Link>
                        <button className="w-full sm:w-auto px-10 py-5 bg-slate-900 border border-white/5 text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition active:scale-95">
                            <Play size={18} fill="white" /> Ver Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* APP PREVIEW MOCKUP - REALISTIC TACTICAL INTERFACE */}
            <section className="max-w-5xl mx-auto px-6 mb-32 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-blue-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl overflow-hidden backdrop-blur-sm">
                    {/* Toolbar Simulado */}
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/40" />
                            <div className="w-3 h-3 rounded-full bg-slate-700" />
                            <div className="w-3 h-3 rounded-full bg-slate-700" />
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
                            Visual Tactical Interface 2.0
                        </div>
                        <div className="bg-red-600/20 px-2 py-1 rounded text-[8px] text-red-500 font-black">LIVE</div>
                    </div>

                    {/* Preview do Campo de Padel */}
                    <div className="aspect-video w-full bg-slate-950 rounded-2xl relative border border-white/5 overflow-hidden flex items-center justify-center shadow-inner group-hover:border-red-600/30 transition-colors">

                        {/* PISO DO CAMPO */}
                        <div className="w-[45%] h-[85%] bg-blue-700/80 rounded-sm relative border-2 border-white/30 shadow-2xl">
                            {/* Linhas Brancas */}
                            <div className="absolute top-1/2 left-0 w-full h-px bg-white/40" />
                            <div className="absolute top-1/4 left-0 w-full h-px bg-white/20" />
                            <div className="absolute bottom-1/4 left-0 w-full h-px bg-white/20" />
                            <div className="absolute top-0 left-1/2 w-px h-full bg-white/20" />

                            {/* JOGADORES - DOTS ANIMADOS */}
                            {/* Equipa Vermelha (Ataque) */}
                            <div className="absolute top-[15%] left-[20%] w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-xl animate-pulse" />
                            <div className="absolute top-[18%] right-[25%] w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-xl animate-pulse" />

                            {/* Equipa Azul (Defesa) */}
                            <div className="absolute bottom-[20%] left-[30%] w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-xl" />
                            <div className="absolute bottom-[15%] right-[20%] w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-xl" />

                            {/* SETA TÁTICA SIMULADA (SVG) */}
                            <svg className="absolute top-[25%] left-[25%] w-32 h-32 text-red-500/60" viewBox="0 0 100 100" fill="none">
                                <path d="M10,10 Q50,5 80,40" stroke="currentColor" strokeWidth="3" strokeDasharray="5,5" />
                                <polygon points="80,40 70,35 75,45" fill="currentColor" />
                            </svg>
                        </div>

                        {/* OVERLAY DE TEXTO GRADIENTE */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-10">
                            <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                                Controlo <span className="text-red-600">Estratégico</span> Total
                            </h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
                                Desenha jogadas vencedoras com fluidez absoluta.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-24">
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Target size={32} className="text-red-500" />}
                        title="Editor Pro"
                        description="Ferramentas de desenho precisas para criar qualquer situação de jogo no court."
                    />
                    <FeatureCard
                        icon={<Users size={32} className="text-blue-500" />}
                        title="Gestão de Alunos"
                        description="Organiza a tua base de dados e partilha táticas personalizadas com cada nível."
                    />
                    <FeatureCard
                        icon={<Zap size={32} className="text-amber-500" />}
                        title="Exportação HD"
                        description="Gera cartões táticos profissionais para enviar via WhatsApp ou Instagram."
                    />
                </div>
            </section>

            {/* PRICING SECTION */}
            <section id="pricing" className="max-w-7xl mx-auto px-6 py-32 text-center scroll-mt-24 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="mb-20">
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-4 tracking-tighter text-white">
                        Planos de <span className="text-red-600">Alta Performance</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
                        Escolhe o arsenal que a tua carreira de treinador exige
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <PriceCard
                        tier="Free"
                        price="0€"
                        features={[
                            'Até 5 Táticas Ativas',
                            'Acesso à Comunidade',
                            'Exportação PNG Padrão'
                        ]}
                    />

                    <PriceCard
                        tier="Pro Coach"
                        price="7,99€"
                        features={[
                            'Táticas Ilimitadas',
                            'Biblioteca de Exercícios',
                            'Exportação HD sem Marca de Água',
                            'Suporte por Email',
                            'Gestão Completa de Alunos'
                        ]}
                    />

                    <PriceCard
                        tier="Elite Performance"
                        price="14,99€"
                        featured={true}
                        features={[
                            'Tudo do Plano Pro',
                            'Exportação de Planos em PDF Pro',
                            'QR Codes para Vídeos Técnicos',
                            'Análise Tática Avançada',
                            'Suporte Prioritário 24/7'
                        ]}
                    />
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/5 py-16 px-6 bg-slate-950 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-900 p-1.5 rounded-lg border border-white/5">
                            <Shield size={16} className="text-red-600" />
                        </div>
                        <span className="text-sm font-black italic uppercase tracking-tighter">
                            Next <span className="text-red-600">Level Coach</span>
                        </span>
                    </div>
                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.4em]">
                        © 2026 Next Level Coach
                    </p>
                </div>
            </footer>
        </div>
    );
}

// --- COMPONENTES AUXILIARES ---

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[2.5rem] hover:border-red-600/30 transition-all group hover:shadow-2xl hover:shadow-black/50">
            <div className="mb-6 group-hover:scale-110 transition-transform duration-500">{icon}</div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium italic">"{description}"</p>
        </div>
    );
}

function PriceCard({ tier, price, features, featured = false }: { tier: string, price: string, features: string[], featured?: boolean }) {
    return (
        <div className={`p-10 rounded-[2.5rem] border transition-all relative overflow-hidden flex flex-col h-full ${featured ? 'bg-red-600 border-transparent shadow-2xl shadow-red-900/40 scale-105 z-10' : 'bg-slate-900 border-white/10'}`}>
            {featured && (
                <div className="absolute top-0 right-0 bg-white text-red-600 text-[8px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-widest">
                    Recomendado
                </div>
            )}
            <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${featured ? 'text-white/70' : 'text-slate-500'}`}>{tier}</h4>
            <div className="text-6xl font-black italic uppercase mb-10 tracking-tighter">
                {price}<span className="text-xs font-normal not-italic opacity-60">/mês</span>
            </div>
            <ul className="text-left space-y-4 mb-12 text-[11px] font-bold uppercase tracking-wider flex-1">
                {features.map((f: string) => (
                    <li key={f} className="flex items-center gap-3">
                        <CheckCircle2 size={16} className={featured ? 'text-white' : 'text-red-600'} /> {f}
                    </li>
                ))}
            </ul>
            <Link
                href="/login"
                className={`block w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 ${featured ? 'bg-white text-red-600 hover:bg-slate-100 shadow-xl' : 'bg-slate-950 border border-white/5 text-white hover:bg-slate-800'}`}
            >
                Selecionar Plano
            </Link>
        </div>
    );
}