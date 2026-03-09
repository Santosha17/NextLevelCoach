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
                const { data: { user } } = await supabase.auth.getUser();
                if (!isMounted) return;
                if (user) {
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 gap-2">
            <Loader2 className="animate-spin" />
            <span className="font-black uppercase tracking-widest text-xs">Next Level</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-red-500/30 flex flex-col font-sans scroll-smooth">
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
                        className="bg-white text-black px-6 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:text-white transition-all"
                    >
                        Entrar
                    </Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-pulse">
                        <Zap size={12} fill="currentColor" /> Tactical Editor 2.0
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] mb-8">
                        Leva a tua tática ao <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-b from-white to-slate-500">
                            Próximo Nível
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
                        O editor tático de Padel mais rápido do mundo. Desenha, organiza e partilha exercícios profissionais em segundos.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/login" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest rounded-2xl transition-all shadow-2xl shadow-red-900/40 flex items-center justify-center gap-3">
                                Começar Grátis <ArrowRight size={20} />
                            </button>
                        </Link>
                        <button className="w-full sm:w-auto px-10 py-5 bg-slate-900 border border-slate-800 text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition">
                            <Play size={18} fill="white" /> Ver Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* APP PREVIEW MOCKUP */}
            <section className="max-w-5xl mx-auto px-6 mb-32 relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-red-600 to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden">
                    <div className="bg-slate-950 rounded-[1.5rem] aspect-video flex items-center justify-center border border-white/5 relative overflow-hidden">
                        <Target size={48} className="text-red-600/20 absolute animate-ping" />
                        <div className="text-center z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Visual Tactical Interface</p>
                            <div className="mt-4 flex gap-2 justify-center">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            </div>
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

            {/* PRICING */}
            <section id="pricing" className="max-w-5xl mx-auto px-6 py-32 text-center scroll-mt-24">
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-4 tracking-tighter">Planos para Campeões</h2>
                <p className="text-slate-500 font-bold mb-16 uppercase text-xs tracking-widest">Escolhe o teu nível de performance</p>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <PriceCard
                        tier="Free Player"
                        price="0€"
                        features={['Até 3 Táticas', 'Acesso à Comunidade', 'Exportação Padrão']}
                    />
                    <PriceCard
                        tier="Elite Coach"
                        price="9.90€"
                        featured
                        features={['Táticas Ilimitadas', 'Gestão de Alunos', 'Exportação Premium HD', 'Suporte Prioritário']}
                    />
                </div>
            </section>

            {/* FOOTER */}
            <footer className="mt-auto border-t border-white/5 py-12 px-6 bg-slate-950">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black italic uppercase tracking-tighter">
                            Next <span className="text-red-600">Level Coach</span>
                        </span>
                    </div>
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                        © 2026 Next Level Coach.
                    </p>
                </div>
            </footer>
        </div>
    );
}

// --- COMPONENTES AUXILIARES (FUNDAMENTAL) ---

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[2rem] hover:border-red-500/30 transition-all group">
            <div className="mb-6 group-hover:scale-110 transition-transform">{icon}</div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">{description}</p>
        </div>
    );
}

function PriceCard({ tier, price, features, featured = false }: { tier: string, price: string, features: string[], featured?: boolean }) {
    return (
        <div className={`p-10 rounded-[2.5rem] border transition-all relative overflow-hidden ${featured ? 'bg-red-600 border-transparent shadow-2xl shadow-red-900/40 scale-105 z-10' : 'bg-slate-900 border-white/10'}`}>
            {featured && (
                <div className="absolute top-0 right-0 bg-white text-red-600 text-[8px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-widest">
                    Recomendado
                </div>
            )}
            <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${featured ? 'text-white/70' : 'text-slate-500'}`}>{tier}</h4>
            <div className="text-6xl font-black italic uppercase mb-10 tracking-tighter">
                {price}<span className="text-xs font-normal not-italic opacity-60">/mês</span>
            </div>
            <ul className="text-left space-y-4 mb-12 text-sm font-bold">
                {features.map((f: string) => (
                    <li key={f} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className={featured ? 'text-white' : 'text-red-600'} /> {f}
                    </li>
                ))}
            </ul>
            <Link
                href="/login"
                className={`block w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${featured ? 'bg-white text-red-600 hover:bg-slate-100 shadow-xl' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            >
                Selecionar Plano
            </Link>
        </div>
    );
}