'use client';

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
    Zap,
} from 'lucide-react';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

const Navbar = () => {
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
        return 'free';
    };

    const getPlanBadgeClasses = (tier: 'free' | 'pro' | 'elite' | 'other') => {
        switch (tier) {
            case 'pro':
                return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'elite':
                return 'bg-red-600/10 text-red-500 border-red-600/20';
            case 'free':
            default:
                return 'bg-slate-800 text-slate-400 border-white/5';
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadProfileFromSession = async (session: Session | null) => {
            if (!session?.user) {
                if (!isMounted) return;
                setUser(null); setIsCoach(false); setIsAdmin(false); setPlanTier('free');
                return;
            }

            if (!isMounted) return;
            setUser(session.user);

            const { data } = await supabase
                .from('profiles')
                .select('role, plan_tier, is_admin')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!isMounted || !data) return;

            setIsCoach(data.role === 'coach');
            setIsAdmin(data.is_admin === true);
            setPlanTier(mapPlanTier(data.plan_tier));
        };

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await loadProfileFromSession(session);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: AuthChangeEvent, session: Session | null) => {
                if (!isMounted) return;
                await loadProfileFromSession(session);
                if (_event === 'SIGNED_OUT') window.location.href = '/login';
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <nav className="sticky top-0 z-[100] w-full bg-slate-950/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex justify-between items-center">

                {/* LOGO */}
                <Link href="/" className="hover:opacity-80 transition group">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-600 p-1 rounded shadow-lg shadow-red-900/20 group-hover:scale-110 transition-transform">
                            <Shield size={18} className="text-white fill-white/10" />
                        </div>
                        <span className="font-black text-lg tracking-tighter italic text-white uppercase">
                            Next Level <span className="text-red-600 font-black">Coach</span>
                        </span>
                    </div>
                </Link>

                {/* DESKTOP NAV */}
                {user && (
                    <div className="hidden md:flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 items-center">
                        <NavLink href="/dashboard" active={pathname === '/dashboard'} icon={<LayoutDashboard size={14}/>}>Dashboard</NavLink>

                        {isAdmin && (
                            <NavLink href="/admin" active={pathname.startsWith('/admin')} icon={<Shield size={14}/>} variant="admin">Backoffice</NavLink>
                        )}

                        <NavLink href="/comunidade" active={pathname === '/comunidade'} icon={<MessageCircle size={14}/>}>Comunidade</NavLink>

                        {isCoach && (
                            <>
                                <NavLink href="/dashboard/planos" active={pathname === '/dashboard/planos'} icon={<Layers size={14}/>}>Planos</NavLink>
                                <NavLink href="/dashboard/alunos" active={pathname === '/dashboard/alunos'} icon={<Users size={14}/>}>Alunos</NavLink>
                            </>
                        )}
                    </div>
                )}

                {/* USER AREA */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/perfil" className="hidden sm:flex flex-col items-end group cursor-pointer">
                                <span className="text-white text-[11px] font-black uppercase tracking-wider group-hover:text-red-500 transition">
                                    {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-red-600 text-[8px] font-black tracking-widest uppercase italic">
                                        {isCoach ? 'TREINADOR' : 'JOGADOR'}
                                    </span>
                                    <span className={`text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded border ${getPlanBadgeClasses(planTier)}`}>
                                        {planTier.toUpperCase()}
                                    </span>
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="p-2.5 bg-slate-900 text-slate-500 rounded-xl border border-white/5 hover:bg-red-600/10 hover:text-red-500 hover:border-red-600/20 transition-all active:scale-95"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <Link href="/login">
                            <button className="bg-white text-slate-950 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-white/5 active:scale-95">
                                Entrar
                            </button>
                        </Link>
                    )}

                    {/* MOBILE TOGGLE */}
                    <button
                        className="md:hidden p-2 text-slate-400 hover:text-white transition"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-950 border-b border-white/5 shadow-2xl animate-in slide-in-from-top-5">
                    <div className="flex flex-col p-6 space-y-3">
                        {user ? (
                            <>
                                <MobileNavLink href="/dashboard" icon={<LayoutDashboard size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                                {isAdmin && (
                                    <MobileNavLink href="/admin" icon={<Shield size={18}/>} onClick={() => setIsMobileMenuOpen(false)} variant="admin">Backoffice</MobileNavLink>
                                )}
                                <MobileNavLink href="/comunidade" icon={<MessageCircle size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>Comunidade</MobileNavLink>
                                {isCoach && (
                                    <>
                                        <MobileNavLink href="/dashboard/planos" icon={<Layers size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>Planos de Aula</MobileNavLink>
                                        <MobileNavLink href="/dashboard/alunos" icon={<Users size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>Alunos</MobileNavLink>
                                    </>
                                )}
                                <MobileNavLink href="/dashboard/perfil" icon={<UserCircle size={18}/>} onClick={() => setIsMobileMenuOpen(false)}>Perfil</MobileNavLink>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left p-4 rounded-2xl bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 mt-4"
                                >
                                    <LogOut size={18} /> Sair da Sessão
                                </button>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest text-center">
                                Entrar na Conta
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

// COMPONENTES AUXILIARES DE ESTILO
const NavLink = ({ href, children, active, icon, variant }: any) => (
    <Link
        href={href}
        className={`flex items-center gap-2 transition-all hover:text-white ${
            active
                ? (variant === 'admin' ? 'text-red-500' : 'text-white')
                : (variant === 'admin' ? 'text-red-400/60' : 'text-slate-500')
        }`}
    >
        {icon}
        {children}
        {active && <span className={`w-1 h-1 rounded-full ${variant === 'admin' ? 'bg-red-500' : 'bg-red-600'}`} />}
    </Link>
);

const MobileNavLink = ({ href, children, icon, onClick, variant }: any) => (
    <Link
        href={href}
        onClick={onClick}
        className={`p-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all active:scale-95 ${
            variant === 'admin' ? 'bg-red-600/5 text-red-500 border-red-500/10' : 'bg-slate-900 text-slate-300'
        }`}
    >
        {icon} {children}
    </Link>
);

export default Navbar;