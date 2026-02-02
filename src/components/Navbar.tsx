'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/src/lib/supabase';
import { UserCircle, LogOut, Menu, X, LayoutDashboard, Layers, Users, MessageCircle } from 'lucide-react';

const Navbar = () => {
    const [user, setUser] = useState<any>(null);
    const [isCoach, setIsCoach] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // FIX CRÍTICO: useMemo evita que o supabase seja recriado a cada render
    const supabase = useMemo(() => createClient(), []);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let isMounted = true;

        const getUserAndProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (isMounted) {
                setUser(user);
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (isMounted) setIsCoach(profile?.role === 'coach');
                }
            }
        };

        getUserAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (isMounted) {
                setUser(session?.user ?? null);
                if (session?.user) {
                    const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
                    if (isMounted) setIsCoach(data?.role === 'coach');
                } else {
                    if (isMounted) setIsCoach(false);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    const handleLogout = async () => {
        // 1. Limpar estado local imediatamente para feedback visual
        setUser(null);
        setIsCoach(false);
        setIsMobileMenuOpen(false);

        // 2. Fazer logout no Supabase
        await supabase.auth.signOut();

        // 3. Redirecionar para login
        router.push('/login');
        router.refresh();
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800">
            <div className="w-full px-6 md:px-10 py-4 flex justify-between items-center">
                {/* 1. LOGO */}
                <Link href="/" className="hover:opacity-80 transition z-50">
                    <div className="font-black text-xl tracking-tighter italic text-white flex items-center gap-2 cursor-pointer">
                        COACH NEXT LEVEL
                    </div>
                </Link>

                {/* 2. MENU CENTRAL (Desktop) */}
                {user && (
                    <div className="hidden md:flex gap-8 text-sm font-bold text-slate-400 items-center">
                        <Link
                            href="/dashboard"
                            className={`hover:text-white transition flex items-center gap-2 ${pathname === '/dashboard' ? 'text-green-500' : ''}`}
                        >
                            <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link
                            href="/comunidade"
                            className={`hover:text-white transition flex items-center gap-2 ${pathname === '/dashboard/comunidade' ? 'text-green-500' : ''}`}
                        >
                            <MessageCircle size={16} /> Comunidade
                        </Link>
                        {isCoach && (
                            <>
                                <Link
                                    href="/dashboard/planos"
                                    className={`hover:text-white transition flex items-center gap-2 ${pathname === '/dashboard/planos' ? 'text-green-500' : ''}`}
                                >
                                    <Layers size={16} /> Planos
                                </Link>
                                <Link
                                    href="/dashboard/alunos"
                                    className={`hover:text-white transition flex items-center gap-2 ${pathname === '/dashboard/alunos' ? 'text-green-500' : ''}`}
                                >
                                    <Users size={16} /> Alunos
                                </Link>
                            </>
                        )}
                    </div>
                )}

                {/* 3. LADO DIREITO (User Actions) */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-white text-sm font-bold leading-tight">
                                    {user.user_metadata?.full_name || 'Utilizador'}
                                </span>
                                <span className="text-green-500 text-[10px] uppercase font-black tracking-widest text-right">
                                    {isCoach ? 'TREINADOR' : 'JOGADOR'}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 bg-slate-800 text-slate-400 rounded-lg border border-slate-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition"
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="hidden sm:block">
                            <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-slate-900 rounded-lg font-bold hover:bg-green-400 transition shadow-lg shadow-green-500/20">
                                <UserCircle size={18} />
                                <span>Entrar</span>
                            </button>
                        </Link>
                    )}
                    <button
                        className="md:hidden p-2 text-slate-300 hover:text-white transition"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* 4. MENU MOBILE */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl animate-in slide-in-from-top-2">
                    <div className="flex flex-col p-4 space-y-2">
                        {user ? (
                            <>
                                <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Menu {isCoach ? 'Treinador' : 'Jogador'}
                                </div>
                                <MobileLink href="/dashboard" icon={<LayoutDashboard size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>
                                    Dashboard
                                </MobileLink>
                                <MobileLink href="/comunidade" icon={<MessageCircle size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>
                                    Comunidade
                                </MobileLink>
                                {isCoach && (
                                    <>
                                        <MobileLink href="/dashboard/planos" icon={<Layers size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>
                                            Planos de Aula
                                        </MobileLink>
                                        <MobileLink href="/dashboard/alunos" icon={<Users size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>
                                            Meus Alunos
                                        </MobileLink>
                                    </>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left p-3 rounded-lg hover:bg-red-500/10 text-red-400 font-bold flex items-center gap-3 mt-4 border border-transparent hover:border-red-500/20 transition"
                                >
                                    <LogOut size={18} /> Sair da Conta
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-3 rounded-lg bg-green-500 text-slate-900 font-bold flex justify-center items-center gap-2"
                            >
                                <UserCircle size={18} /> Entrar na Conta
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

const MobileLink = ({ href, children, icon, onClick }: any) => (
    <Link
        href={href}
        onClick={onClick}
        className="p-3 rounded-lg hover:bg-slate-800 text-slate-200 font-medium flex items-center gap-3 transition border border-transparent hover:border-slate-700"
    >
        {icon} {children}
    </Link>
);

export default Navbar;