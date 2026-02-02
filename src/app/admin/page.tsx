'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Shield,
    CheckCircle,
    ArrowLeft,
    Search,
    User,
    Mail,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        let isMounted = true;

        const checkAccessAndLoad = async () => {
            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    if (isMounted) router.push('/login');
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error('Erro ao ler perfil:', profileError.message);
                }

                if (!profile || profile.is_admin !== true) {
                    console.warn('Acesso negado.');
                    if (isMounted) router.push('/dashboard');
                    return;
                }

                if (isMounted) await fetchUsers();
            } catch (err) {
                console.error('Erro crítico no Admin:', err);
                if (isMounted) router.push('/dashboard');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        checkAccessAndLoad();

        return () => {
            isMounted = false;
        };
    }, [supabase, router]);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setUsers(data);
        } catch (err) {
            console.error('Erro ao buscar utilizadores:', err);
            setToast({
                type: 'error',
                message: 'Erro ao carregar utilizadores.',
            });
        }
    };

    const toggleVerification = async (userId: string, currentStatus: boolean) => {
        if (
            !confirm(
                currentStatus
                    ? 'Revogar acesso de treinador?'
                    : 'Aprovar este treinador?'
            )
        )
            return;

        setUsers((prev) =>
            prev.map((u) =>
                u.id === userId ? { ...u, verified_coach: !currentStatus } : u
            )
        );

        const { error } = await supabase
            .from('profiles')
            .update({ verified_coach: !currentStatus })
            .eq('id', userId);

        if (error) {
            setToast({
                type: 'error',
                message: 'Erro ao atualizar treinador.',
            });
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, verified_coach: currentStatus } : u
                )
            );
        } else {
            setToast({
                type: 'success',
                message: currentStatus
                    ? 'Acesso de treinador revogado.'
                    : 'Treinador aprovado com sucesso.',
            });
        }
    };

    const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
        if (!confirm(currentStatus ? 'Desbloquear conta?' : 'Bloquear conta?'))
            return;

        setUsers((prev) =>
            prev.map((u) =>
                u.id === userId ? { ...u, is_blocked: !currentStatus } : u
            )
        );

        const { error } = await supabase
            .from('profiles')
            .update({ is_blocked: !currentStatus })
            .eq('id', userId);

        if (error) {
            setToast({
                type: 'error',
                message: 'Erro ao atualizar estado da conta.',
            });
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, is_blocked: currentStatus } : u
                )
            );
        } else {
            setToast({
                type: 'success',
                message: currentStatus
                    ? 'Conta desbloqueada.'
                    : 'Conta bloqueada com sucesso.',
            });
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    if (loading)
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-red-500 gap-4">
                <Loader2 className="animate-spin w-10 h-10" />
                <p className="font-bold animate-pulse">
                    A verificar credenciais de Admin...
                </p>
            </div>
        );

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            {/* TOAST */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 ${
                        toast.type === 'success'
                            ? 'bg-emerald-500 text-slate-900'
                            : 'bg-red-500 text-white'
                    }`}
                >
                    {toast.type === 'success' ? '✔️' : '⚠️'} {toast.message}
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Shield className="text-red-500" /> Backoffice
                            </h1>
                            <p className="text-slate-400 text-sm">
                                Área restrita a Administradores.
                            </p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <Search
                            className="absolute left-3 top-3 text-slate-500"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Procurar utilizador..."
                            className="w-full md:w-80 bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 text-white focus:border-red-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-900/50 text-xs uppercase font-bold text-slate-500 border-b border-slate-700">
                                <th className="p-5">Utilizador</th>
                                <th className="p-5">Função</th>
                                <th className="p-5">Licença</th>
                                <th className="p-5">Conta</th>
                                <th className="p-5">Plano</th>
                                <th className="p-5">Estado</th>
                                <th className="p-5 text-right">Ação</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                            {filteredUsers.map((u) => (
                                <tr
                                    key={u.id}
                                    className="hover:bg-slate-700/30 transition group"
                                >
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">
                                                {u.full_name?.charAt(0).toUpperCase() || (
                                                    <User size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">
                                                    {u.full_name || 'Sem nome'}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail size={10} /> {u.email || 'Email oculto'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                      <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              u.role === 'coach'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                      >
                        {u.role === 'coach' ? 'Treinador' : 'Jogador'}
                      </span>
                                    </td>
                                    <td className="p-5 text-sm text-slate-400 font-mono">
                                        {u.license_number || '-'}
                                    </td>
                                    <td className="p-5">
                      <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              u.is_blocked
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                      >
                        {u.is_blocked ? 'Bloqueado' : 'Ativo'}
                      </span>
                                    </td>
                                    <td className="p-5 text-sm text-slate-400 font-mono">
                                        {u.plan_tier || 'free'}
                                    </td>
                                    <td className="p-5">
                                        {u.role === 'coach' ? (
                                            u.verified_coach ? (
                                                <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase bg-green-500/10 px-2 py-1 rounded w-fit border border-green-500/20">
                                                    <CheckCircle size={14} /> Aprovado
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-yellow-500 text-xs font-bold uppercase bg-yellow-500/10 px-2 py-1 rounded w-fit border border-yellow-500/20 animate-pulse">
                                                    <AlertCircle size={14} /> Pendente
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-slate-600 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            {u.role === 'coach' && (
                                                <button
                                                    onClick={() =>
                                                        toggleVerification(u.id, u.verified_coach)
                                                    }
                                                    className={`text-xs font-bold px-4 py-2 rounded-lg transition border shadow-sm ${
                                                        u.verified_coach
                                                            ? 'bg-slate-900 border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500'
                                                            : 'bg-green-500 hover:bg-green-400 text-slate-900 border-transparent shadow-green-500/20'
                                                    }`}
                                                >
                                                    {u.verified_coach ? 'Revogar' : 'Aprovar'}
                                                </button>
                                            )}

                                            <button
                                                onClick={() =>
                                                    toggleBlockUser(u.id, u.is_blocked === true)
                                                }
                                                className="text-xs font-bold px-4 py-2 rounded-lg transition border shadow-sm bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                                            >
                                                {u.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="p-10 text-center text-slate-500">
                            Nenhum utilizador encontrado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
