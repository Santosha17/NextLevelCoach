'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Shield, CheckCircle, ArrowLeft, Search,
    AlertCircle, Loader2, Users, Crown, Ban, Trash2,
    Database, UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [totalDrills, setTotalDrills] = useState(0);
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'pro' | 'blocked' | 'admins'>('all');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // ESTADO PARA NOTIFICAÇÕES REALTIME
    const [hasNewPending, setHasNewPending] = useState(false);

    const stats = {
        total: users.length,
        pending: users.filter(u => u.role === 'coach' && !u.verified_coach).length,
        pro: users.filter(u => u.plan_tier === 'pro' || u.plan_tier === 'elite').length,
        blocked: users.filter(u => u.is_blocked).length,
        drills: totalDrills
    };

    const fetchUsers = useCallback(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setUsers(data);
    }, [supabase]);

    const fetchGlobalStats = useCallback(async () => {
        const { count, error } = await supabase
            .from('drills')
            .select('*', { count: 'exact', head: true });
        if (!error && count !== null) setTotalDrills(count);
    }, [supabase]);

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push('/login'); return; }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!profile?.is_admin) {
                    router.push('/dashboard');
                    return;
                }

                setIsAdmin(true);
                await Promise.all([fetchUsers(), fetchGlobalStats()]);
            } catch (err) {
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        checkAdminAccess();

        // --- SISTEMA DE NOTIFICAÇÕES REALTIME ---
        const channel = supabase
            .channel('admin-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'profiles' },
                (payload :any) => {
                    // Se entrar um novo coach, ativa o alerta visual
                    if (payload.new.role === 'coach') {
                        setHasNewPending(true);
                        void fetchUsers(); // Atualiza a lista na hora
                    }
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [router, supabase, fetchUsers, fetchGlobalStats]);

    // Limpar o alerta quando o admin clica no filtro de pendentes
    useEffect(() => {
        if (filterTab === 'pending') setHasNewPending(false);
    }, [filterTab]);

    const updateField = async (userId: string, field: string, value: any) => {
        const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', userId);
        if (error) {
            setToast({ type: 'error', message: 'Erro ao atualizar base de dados.' });
        } else {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
            setToast({ type: 'success', message: 'Alteração guardada com sucesso!' });
        }
    };

    const deleteUser = async (userId: string, name: string) => {
        if (!confirm(`AVISO CRÍTICO: Eliminar o perfil de ${name}?`)) return;
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (!error) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            setToast({ type: 'success', message: 'Utilizador removido.' });
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
        const matchesTab =
            filterTab === 'all' ? true :
                filterTab === 'pending' ? (u.role === 'coach' && !u.verified_coach) :
                    filterTab === 'pro' ? (u.plan_tier === 'pro' || u.plan_tier === 'elite') :
                        filterTab === 'blocked' ? u.is_blocked :
                            filterTab === 'admins' ? u.is_admin : true;
        return matchesSearch && matchesTab;
    });

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-red-500 gap-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <p className="font-bold animate-pulse uppercase tracking-widest text-xs">Terminal Admin Ativo...</p>
        </div>
    );

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-10 text-white font-sans">
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-right-4 ${
                    toast.type === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'
                }`}>
                    {toast.message}
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                    <div className="flex items-center gap-5">
                        <Link href="/dashboard" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 border border-slate-700 transition-all">
                            <ArrowLeft size={22} />
                        </Link>
                        <div className="relative">
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                                Control <span className="text-red-500">Center</span>
                            </h1>
                            {/* O PONTO VERMELHO DE NOTIFICAÇÃO */}
                            {hasNewPending && (
                                <span className="absolute -top-1 -right-4 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-slate-900"></span>
                                </span>
                            )}
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Management Hub</p>
                        </div>
                    </div>

                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-4 text-slate-500" size={20} />
                        <input
                            type="text" placeholder="Pesquisar utilizador..."
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all shadow-inner"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                    <MetricCard icon={<Users size={20}/>} label="Total Users" value={stats.total} color="blue" />
                    <MetricCard
                        icon={<AlertCircle size={20}/>}
                        label="Pendentes"
                        value={stats.pending}
                        color="yellow"
                        alert={stats.pending > 0 || hasNewPending}
                    />
                    <MetricCard icon={<Crown size={20}/>} label="Premium" value={stats.pro} color="amber" />
                    <MetricCard icon={<Database size={20}/>} label="Táticas" value={stats.drills} color="purple" />
                    <MetricCard icon={<Ban size={20}/>} label="Bloqueados" value={stats.blocked} color="red" />
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    <Tab active={filterTab === 'all'} label="Todos" onClick={() => setFilterTab('all')} />
                    <Tab active={filterTab === 'pending'} label="Pendentes" count={stats.pending} onClick={() => setFilterTab('pending')} />
                    <Tab active={filterTab === 'pro'} label="Pro/Elite" onClick={() => setFilterTab('pro')} />
                    <Tab active={filterTab === 'admins'} label="Equipa" onClick={() => setFilterTab('admins')} />
                    <Tab active={filterTab === 'blocked'} label="Bloqueados" onClick={() => setFilterTab('blocked')} />
                </div>

                <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                            <tr className="bg-slate-900/80 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                                <th className="p-6 border-b border-slate-700">Utilizador</th>
                                <th className="p-6 border-b border-slate-700 text-center">Nível / Plano</th>
                                <th className="p-6 border-b border-slate-700 text-center">Status</th>
                                <th className="p-6 border-b border-slate-700 text-right">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30 text-sm">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.03] transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-black text-lg border border-slate-600 group-hover:border-red-500/50 transition-colors text-slate-300">
                                                    {u.full_name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                {u.is_admin && <div className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-lg border-2 border-slate-900 shadow-lg"><Shield size={10} className="text-white"/></div>}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-white uppercase italic tracking-tight">{u.full_name || 'Anonymous'}</p>
                                                    {u.is_blocked && <span className="text-[8px] bg-red-500 text-white px-1 rounded font-black uppercase">Banned</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <select
                                            value={u.plan_tier || 'free'}
                                            onChange={(e) => updateField(u.id, 'plan_tier', e.target.value)}
                                            className={`text-[10px] font-black rounded-lg px-3 py-1.5 border outline-none transition-all cursor-pointer ${
                                                u.plan_tier === 'elite' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                                                    u.plan_tier === 'pro' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                                                        'bg-slate-900 border-slate-700 text-slate-400'
                                            }`}
                                        >
                                            <option value="free">FREE PLAYER</option>
                                            <option value="pro">PRO COACH</option>
                                            <option value="elite">ELITE PERFORMANCE</option>
                                        </select>
                                    </td>
                                    <td className="p-6 text-center">
                                        {u.role === 'coach' ? (
                                            u.verified_coach
                                                ? <div className="inline-flex items-center gap-1.5 text-green-400 text-[10px] font-black uppercase bg-green-400/5 px-3 py-1 rounded-full border border-green-400/20 shadow-[0_0_15px_-5px_rgba(74,222,128,0.2)]">
                                                    <UserCheck size={12}/> Verificado
                                                </div>
                                                : <div className="inline-flex items-center gap-1.5 text-yellow-500 text-[10px] font-black uppercase bg-yellow-500/5 px-3 py-1 rounded-full border border-yellow-500/20 animate-pulse">
                                                    <AlertCircle size={12}/> Pendente
                                                </div>
                                        ) : <span className="text-slate-600">---</span>}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => updateField(u.id, 'is_admin', !u.is_admin)} className={`p-2.5 rounded-xl border transition-all ${u.is_admin ? 'bg-red-500 border-transparent text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-red-500/50'}`} title="Admin Toggle"><Shield size={18} /></button>
                                            {u.role === 'coach' && (
                                                <button onClick={() => updateField(u.id, 'verified_coach', !u.verified_coach)} className={`p-2.5 rounded-xl border transition-all ${u.verified_coach ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-green-400' : 'bg-green-600 border-transparent text-white hover:bg-green-500 shadow-lg shadow-green-900/20'}`} title="Aprovar Treinador"><CheckCircle size={18} /></button>
                                            )}
                                            <button onClick={() => updateField(u.id, 'is_blocked', !u.is_blocked)} className={`p-2.5 rounded-xl border transition-all ${u.is_blocked ? 'bg-red-500 border-transparent text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-red-500/10 hover:text-red-500'}`} title="Block User"><Ban size={18} /></button>
                                            <button onClick={() => deleteUser(u.id, u.full_name)} className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-500 hover:bg-red-500 hover:text-white hover:border-transparent transition-all" title="Delete Profile"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// UI COMPONENTS
function MetricCard({ icon, label, value, color, alert }: any) {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-400/10',
        yellow: 'text-yellow-400 bg-yellow-400/10',
        amber: 'text-amber-400 bg-amber-400/10',
        purple: 'text-purple-400 bg-purple-400/10',
        red: 'text-red-400 bg-red-400/10'
    };
    return (
        <div className={`p-5 rounded-3xl border transition-all duration-500 ${alert ? 'border-red-500 bg-red-500/5 animate-pulse shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]' : 'border-slate-700 bg-slate-800/40'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-black italic tracking-tighter">{value}</p>
        </div>
    );
}

function Tab({ active, label, onClick, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border shrink-0 flex items-center gap-3 ${
                active ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-900/20 scale-105' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
        >
            {label}
            {count !== undefined && count > 0 && <span className={`px-2 py-0.5 rounded-lg text-[10px] ${active ? 'bg-white text-red-500' : 'bg-red-500 text-white'}`}>{count}</span>}
        </button>
    );
}