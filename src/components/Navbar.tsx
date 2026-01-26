'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import { UserCircle, LogOut, Menu, X } from 'lucide-react'; // <--- Adicionei ícones Menu e X

const Navbar = () => {
    const [user, setUser] = useState<any>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // <--- Novo estado para o menu
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setUser(session.user);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsMobileMenuOpen(false); // Fecha o menu se sair
        router.refresh();
    };

    return (
        <div className="sticky top-0 z-50">
            <nav className="w-full py-3 px-6 flex justify-between items-center bg-slate-900 border-b border-slate-800">

                {/* 1. LOGO */}
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition group z-50">
                    <img
                        src="/logo.png"
                        alt="CNL Logo"
                        className="h-10 w-auto object-contain sm:h-14" // h-10 no telemóvel, h-14 no PC
                    />
                    <span className="text-white font-bold text-xl tracking-wider hidden sm:block group-hover:text-green-400 transition-colors">
                        COACH NEXT LEVEL
                    </span>
                </Link>

                {/* 2. MENU CENTRAL (APENAS PC - hidden em mobile) */}
                <div className="hidden md:flex gap-6 text-slate-400 text-sm font-medium items-center">
                    <Link href="/dashboard" className="hover:text-green-400 transition">Dashboard</Link>
                    <Link href="/dashboard/planos" className="hover:text-green-400 transition">Planos de Aula</Link>
                    <Link href="/community" className="hover:text-green-400 transition">Comunidade</Link>
                </div>

                {/* 3. LADO DIREITO (User + Menu Mobile) */}
                <div className="flex items-center gap-3">

                    {/* Botões de Utilizador (Sempre visíveis ou adaptados) */}
                    {user ? (
                        <div className="flex items-center gap-3">
                            {/* Nome (Escondido em telemóveis muito pequenos para poupar espaço) */}
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-slate-200 text-sm font-bold">
                                    {user.user_metadata?.full_name || 'Treinador'}
                                </span>
                                <span className="text-green-500 text-[10px] uppercase tracking-wider font-bold">
                                    Pro Account
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2 bg-slate-800 text-red-400 rounded-lg border border-slate-700 hover:bg-red-500/10 hover:border-red-500 transition"
                                title="Sair da Conta"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="hidden sm:block"> {/* Login normal esconde no mobile para não encavalitar com o menu */}
                            <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-slate-900 rounded-lg font-bold hover:bg-green-400 transition shadow-lg shadow-green-500/20">
                                <UserCircle size={18} />
                                <span>Entrar</span>
                            </button>
                        </Link>
                    )}

                    {/* 4. BOTÃO HAMBÚRGUER (Só aparece no telemóvel) */}
                    <button
                        className="md:hidden p-2 text-slate-300 hover:text-white transition"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* 5. GAVETA DO MENU MOBILE (Abre quando clicas no hambúrguer) */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-800 border-b border-slate-700 shadow-xl animate-[slideDown_0.2s_ease-out]">
                    <div className="flex flex-col p-4 space-y-2">
                        <Link
                            href="/dashboard"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-3 rounded-lg hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-3"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/planos"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-3 rounded-lg hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-3"
                        >
                            Planos de Aula
                        </Link>
                        <Link
                            href="/community"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-3 rounded-lg hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-3"
                        >
                            Comunidade
                        </Link>

                        {/* Se não estiver logado, mostra o botão de entrar aqui também */}
                        {!user && (
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="mt-2 p-3 rounded-lg bg-green-500 text-slate-900 font-bold flex justify-center items-center gap-2"
                            >
                                <UserCircle size={18} /> Entrar / Criar Conta
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;