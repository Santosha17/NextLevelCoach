'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/src/lib/supabase';
import {
    UserCircle,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    Layers,
    Users,
    MessageCircle,
} from 'lucide-react';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

const Navbar = () => {
    const [user, setUser] = useState<any>(null);
    const [isCoach, setIsCoach] = useState(false);
    const [planTier, setPlanTier] = useState<'free' | 'pro' | 'elite' | 'other'>(
        'free'
    );
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const mapPlanTier = (raw?: string | null): 'free' | 'pro' | 'elite' | 'other' => {
        if (!raw) return 'free';
        const v = raw.toLowerCase();
        if (v === 'pro') return 'pro';
        if (v === 'elite') return 'elite';
        if (v === 'free') return 'free';
        return 'other';
    };

    const getPlanBadgeClasses = (tier: 'free' | 'pro' | 'elite' | 'other') => {
        switch (tier) {
            case 'pro':
                return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
            case 'elite':
                return 'bg-amber-400/15 text-amber-300 border-amber-400/40';
            case 'other':
                return 'bg-slate-500/15 text-slate-300 border-slate-500/40';
            case 'free':
            default:
                return 'bg-slate-700 text-slate-300 border-slate-500/60';
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadProfileFromSession = async (session: Session | null) => {
            if (!session?.user) {
                if (!isMounted) return;
                setUser(null);
                setIsCoach(false);
                setPlanTier('free');
                return;
            }

            if (!isMounted) return;
            setUser(session.user);

            const { data, error } = await supabase
                .from('profiles')
                .select('role, plan_tier')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!isMounted) return;

            if (error) {
                console.error('Erro a carregar perfil:', error);
                setIsCoach(false);
                setPlanTier('free');
                return;
            }

            const profile = data as { role?: string | null; plan_tier?: string | null };

            setIsCoach(profile.role === 'coach');
            setPlanTier(mapPlanTier(profile.plan_tier));
        };

        const checkUser = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            await loadProfileFromSession(session);
        };

        checkUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (_event: AuthChangeEvent, session: Session | null) => {
                if (!isMounted) return;
                await loadProfileFromSession(session);
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    const handleLogout = async () => {
        setIsMobileMenuOpen(false);
        await supabase.auth.signOut();
        setUser(null);
        setIsCoach(false);
        setPlanTier('free');
        router.push('/login');
        router.refresh();
    };

    const planLabel =
        planTier === 'free'
            ? 'FREE'
            : planTier === 'pro'
                ? 'PRO'
                : planTier === 'elite'
                    ? 'ELITE'
                    : 'PLANO';

    return (
        <nav className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800">
            <div className="w-full px-6 md:px-10 py-4 flex justify-between items-center">
                <Link href="/" className="hover:opacity-80 transition z-50">
                    <div className="font-black text-xl tracking-tighter italic text-white flex items-center gap-2 cursor-pointer">
                        COACH NEXT LEVEL
                    </div>
                </Link>

                {user && (
                    <div className="hidden md:flex gap-8 text-sm font-bold text-slate-400 items-center">
                        <Link
                            href="/dashboard"
                            className={`hover:text-white transition flex items-center gap-2 ${
                                pathname === '/dashboard' ? 'text-green-500' : ''
                            }`}
                        >
                            <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link
                            href="/comunidade"
                            className={`hover:text-white transition flex items-center gap-2 ${
                                pathname === '/comunidade' ? 'text-green-500' : ''
                            }`}
                        >
                            <MessageCircle size={16} /> Comunidade
                        </Link>
                        {isCoach && (
                            <>
                                <Link
                                    href="/dashboard/planos"
                                    className={`hover:text-white transition flex items-center gap-2 ${
                                        pathname === '/dashboard/planos' ? 'text-green-500' : ''
                                    }`}
                                >
                                    <Layers size={16} /> Planos
                                </Link>
                                <Link
                                    href="/dashboard/alunos"
                                    className={`hover:text-white transition flex items-center gap-2 ${
                                        pathname === '/dashboard/alunos' ? 'text-green-500' : ''
                                    }`}
                                >
                                    <Users size={16} /> Alunos
                                </Link>
                            </>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                <span className="text-white text-sm font-bold leading-tight">
                  {user.user_metadata?.full_name || 'Utilizador'}
                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-green-500 text-[10px] uppercase font-black tracking-widest text-right">
                    {isCoach ? 'TREINADOR' : 'JOGADOR'}
                  </span>
                                    <span
                                        className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${getPlanBadgeClasses(
                                            planTier
                                        )}`}
                                    >
                    {planLabel}
                  </span>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 bg-slate-800 text-slate-400 rounded-lg border border-slate-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition"
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

            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl">
                    <div className="flex flex-col p-4 space-y-2">
                        {user ? (
                            <>
                                <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Menu {isCoach ? 'Treinador' : 'Jogador'} · Plano {planLabel}
                                </div>
                                <MobileLink
                                    href="/dashboard"
                                    icon={<LayoutDashboard size={18} />}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </MobileLink>
                                <MobileLink
                                    href="/comunidade"
                                    icon={<MessageCircle size={18} />}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Comunidade
                                </MobileLink>
                                {isCoach && (
                                    <>
                                        <MobileLink
                                            href="/dashboard/planos"
                                            icon={<Layers size={18} />}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Planos de Aula
                                        </MobileLink>
                                        <MobileLink
                                            href="/dashboard/alunos"
                                            icon={<Users size={18} />}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
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

const MobileLink = ({
                        href,
                        children,
                        icon,
                        onClick,
                    }: {
    href: string;
    children: React.ReactNode;
    icon: React.ReactNode;
    onClick?: () => void;
}) => (
    <Link
        href={href}
        onClick={onClick}
        className="p-3 rounded-lg hover:bg-slate-800 text-slate-200 font-medium flex items-center gap-3 transition border border-transparent hover:border-slate-700"
    >
        {icon} {children}
    </Link>
);

export default Navbar;
