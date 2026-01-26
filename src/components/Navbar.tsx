'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import { UserCircle, LogOut } from 'lucide-react';

const Navbar = () => {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        // 1. Verificar quem está logado ao abrir a página
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        // 2. Ficar à escuta: Se alguém fizer login/logout, atualiza a barra na hora
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
        router.refresh(); // Atualiza a página para garantir que limpamos tudo
    };

    return (
        <nav className="w-full py-3 px-6 flex justify-between items-center bg-slate-900 border-b border-slate-800 sticky top-0 z-50">

            {/* 1. LOGO AUMENTADO (Clica para ir ao Início) */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition group">
                {/* Imagem do Logo - Aumentada para h-14 */}
                <img
                    src="/logo.png"
                    alt="CNL Logo"
                    className="h-14 w-auto object-contain"
                />

                {/* Nome por extenso ajustado */}
                <span className="text-white font-bold text-xl tracking-wider hidden sm:block group-hover:text-green-400 transition-colors">
                    COACH NEXT LEVEL
                </span>
            </Link>

            {/* 2. MENU CENTRAL (Só aparece em ecrãs grandes) */}
            <div className="hidden md:flex gap-6 text-slate-400 text-sm font-medium items-center">
                <Link href="/dashboard" className="hover:text-green-400 transition">Dashboard</Link>
                <Link href="/dashboard/planos" className="hover:text-green-400 transition">Planos de Aula</Link>
                <Link href="/community" className="hover:text-green-400 transition">Comunidade</Link>
            </div>

            {/* 3. ÁREA DE UTILIZADOR */}
            <div>
                {user ? (
                    // === ESTADO: LOGADO (Mostra Perfil) ===
                    <div className="flex items-center gap-4">

                        {/* Nome do Treinador */}
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-slate-200 text-sm font-bold">
                                {user.user_metadata?.full_name || 'Treinador'}
                            </span>
                            <span className="text-green-500 text-[10px] uppercase tracking-wider font-bold">
                                Pro Account
                            </span>
                        </div>

                        {/* Botão Sair */}
                        <button
                            onClick={handleLogout}
                            className="p-2 bg-slate-800 text-red-400 rounded-lg border border-slate-700 hover:bg-red-500/10 hover:border-red-500 transition"
                            title="Sair da Conta"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    // === ESTADO: VISITANTE (Mostra Login) ===
                    <Link href="/login">
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-slate-900 rounded-lg font-bold hover:bg-green-400 transition shadow-lg shadow-green-500/20">
                            <UserCircle size={18} />
                            <span>Entrar / Criar Conta</span>
                        </button>
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;