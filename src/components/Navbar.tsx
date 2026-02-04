'use client';

// 1. Importar useMemo
import React, { useEffect, useState, useMemo } from 'react';
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
    Shield,
} from 'lucide-react';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

const Navbar = () => {
    // 2. CORREÇÃO CRUCIAL: Usar useMemo para impedir o loop infinito
    // Isto garante que o cliente Supabase é criado apenas UMA vez
    const supabase = useMemo(() => createClient(), []);

    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState<any>(null);
    const [isCoach, setIsCoach] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [planTier, setPlanTier] = useState<'free' | 'pro' | 'elite' | 'other'>('free');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                setIsAdmin(false);
                setPlanTier('free');
                return;
            }

            if (!isMounted) return;
            setUser(session.user);

            const { data, error } = await supabase
                .from('profiles')
                .select('role, plan_tier, is_admin')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!isMounted) return;

            if (error) {
                console.error('Erro a carregar perfil:', error);
                setIsCoach(false);
                setIsAdmin(false);
                setPlanTier('free');
                return;
            }

            const profile = data as {
                role?: string | null;
                plan_tier?: string | null;
                is_admin?: boolean | null
            };

            setIsCoach(profile.role === 'coach');
            setIsAdmin(profile.is_admin === true);
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

                if (_event === 'SIGNED_OUT') {
                    setUser(null);
                    setIsCoach(false);
                    setIsAdmin(false);
                    setPlanTier('free');
                    router.push('/login');
                    router.refresh();
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, router]); // Agora 'supabase' é estável e não causa loop

    const handleLogout = async () => {
        try {
            setIsMobileMenuOpen(false);
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Erro logout:', error);
        } catch (err) {
            console.error('Erro logout:', err);
        } finally {
            setUser(null);
            setIsCoach(false);
            setIsAdmin(false);
            setPlanTier('free');
            router.push('/login');
            router.refresh();
        }
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
                        NEXT LEVEL COACH
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

                        {isAdmin && (
                            <Link
                                href="/admin"
                                className={`hover:text-red-400 transition flex items-center gap-2 ${
                                    pathname.startsWith('/admin') ? 'text-red-500' : ''
                                }`}
                            >
                                <Shield size={16} /> Backoffice
                            </Link>
                        )}

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
                            {/* Tornei esta área clicável para ir ao perfil */}
                            <Link href="/dashboard/perfil" className="hidden sm:flex flex-col items-end cursor-pointer group">
                                <span className="text-white text-sm font-bold leading-tight group-hover:text-green-400 transition">
                                    {user.user_metadata?.full_name || 'Utilizador'}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-green-500 text-[10px] uppercase font-black tracking-widest text-right">
                                        {isCoach ? 'TREINADOR' : 'JOGADOR'}
                                    </span>
                                    {isAdmin && (
                                        <span className="text-red-500 text-[10px] uppercase font-black tracking-widest text-right border border-red-500/30 px-1 rounded bg-red-500/10">
                                            ADMIN
                                        </span>
                                    )}
                                    <span
                                        className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${getPlanBadgeClasses(
                                            planTier
                                        )}`}
                                    >
                                        {planLabel}
                                    </span>
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                title="Sair da conta"
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
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl animate-in slide-in-from-top-5">
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

                                {isAdmin && (
                                    <MobileLink
                                        href="/admin"
                                        icon={<Shield size={18} className="text-red-500" />}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <span className="text-red-400 font-bold">Backoffice</span>
                                    </MobileLink>
                                )}

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

                                <MobileLink href="/dashboard/perfil" icon={<UserCircle size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>
                                    O Meu Perfil
                                </MobileLink>

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