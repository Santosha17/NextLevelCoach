'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, ArrowLeft, Search, User, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const checkAccessAndLoad = async () => {
            // 1. Verificar quem está logado
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // 2. O GRANDE TESTE DE SEGURANÇA 🛡️
            // Vamos à base de dados ver se este user tem a flag is_admin = true
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            // SE NÃO FOR ADMIN (mesmo que seja coach), É EXPULSO
            if (!profile || profile.is_admin !== true) {
                console.warn("Tentativa de acesso não autorizado.");
                router.push('/dashboard');
                return;
            }

            // 3. Se passou no teste, carrega a lista de todos os utilizadores
            fetchUsers();
        };

        checkAccessAndLoad();
    }, [router, supabase]);

    const fetchUsers = async () => {
        // Graças às tuas Policies RLS, só o Admin consegue fazer este select sem filtro
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setUsers(data);
        setLoading(false);
    };

    // Função para Aprovar/Bloquear Treinadores
    const toggleVerification = async (userId: string, currentStatus: boolean) => {
        if (!confirm(currentStatus ? 'Revogar acesso de treinador?' : 'Aprovar este treinador?')) return;

        const { error } = await supabase
            .from('profiles')
            .update({ verified_coach: !currentStatus })
            .eq('id', userId);

        if (error) {
            alert('Erro: ' + error.message);
        } else {
            // Atualiza a tabela localmente para veres o visto verde aparecer logo
            setUsers(users.map(u => u.id === userId ? { ...u, verified_coach: !currentStatus } : u));
        }
    };

    // Filtro simples
    const filteredUsers = users.filter(u =>
        (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500 font-bold animate-pulse">A verificar credenciais de Admin...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Shield className="text-red-500" /> Backoffice
                            </h1>
                            <p className="text-slate-400 text-sm">Área restrita a Administradores.</p>
                        </div>
                    </div>

                    {/* Barra de Pesquisa */}
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Procurar utilizador..."
                            className="w-full md:w-80 bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 text-white focus:border-red-500 outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabela */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-900/50 text-xs uppercase font-bold text-slate-500 border-b border-slate-700">
                                <th className="p-5">Utilizador</th>
                                <th className="p-5">Função</th>
                                <th className="p-5">Licença</th>
                                <th className="p-5">Estado</th>
                                <th className="p-5 text-right">Ação</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-700/30 transition group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">
                                                {u.full_name?.charAt(0).toUpperCase() || <User size={18}/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{u.full_name || 'Sem nome'}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail size={10} /> {u.email || 'Email oculto'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-5">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                                u.role === 'coach'
                                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {u.role === 'coach' ? 'Treinador' : 'Jogador'}
                                            </span>
                                    </td>

                                    <td className="p-5 text-sm text-slate-400 font-mono">
                                        {u.license_number || '-'}
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
                                        {u.role === 'coach' && (
                                            <button
                                                onClick={() => toggleVerification(u.id, u.verified_coach)}
                                                className={`text-xs font-bold px-4 py-2 rounded-lg transition border shadow-sm ${
                                                    u.verified_coach
                                                        ? 'bg-slate-900 border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500'
                                                        : 'bg-green-500 hover:bg-green-400 text-slate-900 border-transparent shadow-green-500/20'
                                                }`}
                                            >
                                                {u.verified_coach ? 'Revogar' : 'Aprovar'}
                                            </button>
                                        )}
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