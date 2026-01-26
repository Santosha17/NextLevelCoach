'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, XCircle, Search, Loader2, UserCheck } from 'lucide-react';

export default function AdminPage() {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Carregar dados
    useEffect(() => {
        const checkAdminAndLoadUsers = async () => {

            // 1. Verificar se quem está logado é Admin
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (!profile || !profile.is_admin) {
                alert('Acesso negado. Esta área é restrita.');
                router.push('/dashboard');
                return;
            }

            setIsAdmin(true);

            // 2. Buscar TODOS os utilizadores (só Admins conseguem fazer isto graças à Policy que criámos)
            fetchUsers();
        };

        checkAdminAndLoadUsers();
    }, []);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setUsers(data);
        setLoading(false);
    };

    // Função para Aprovar/Desaprovar Treinador
    const toggleVerification = async (userId: string, currentStatus: boolean) => {
        // Atualiza na base de dados
        const { error } = await supabase
            .from('profiles')
            .update({ verified_coach: !currentStatus })
            .eq('id', userId);

        if (error) {
            alert('Erro: ' + error.message);
        } else {
            // Atualiza a lista localmente para veres a mudança logo
            setUsers(users.map(u => u.id === userId ? { ...u, verified_coach: !currentStatus } : u));
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">A verificar credenciais...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">

                <div className="flex items-center gap-4 mb-10 border-b border-slate-800 pb-6">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Backoffice Admin</h1>
                        <p className="text-slate-400">Gere as licenças e permissões dos utilizadores.</p>
                    </div>
                </div>

                {/* Tabela de Utilizadores */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-slate-300">
                            <thead className="bg-slate-900/50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="p-4">Utilizador</th>
                                <th className="p-4">Função</th>
                                <th className="p-4">Licença FPP</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-700/30 transition">
                                    <td className="p-4 font-medium text-white">
                                        {u.full_name}
                                        <div className="text-xs text-slate-500 font-normal">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'coach' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-700 text-slate-400'}`}>
                        {u.role === 'coach' ? 'Treinador' : 'Jogador'}
                      </span>
                                    </td>
                                    <td className="p-4 font-mono text-sm">
                                        {u.license_number ? u.license_number : <span className="text-slate-600">-</span>}
                                    </td>
                                    <td className="p-4">
                                        {u.verified_coach ? (
                                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase">
                                                <CheckCircle size={14} /> Verificado
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-slate-500 text-xs font-bold uppercase">
                                                <XCircle size={14} /> Pendente
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {u.role === 'coach' && (
                                            <button
                                                onClick={() => toggleVerification(u.id, u.verified_coach)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition border ${
                                                    u.verified_coach
                                                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                                        : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
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
                </div>

            </div>
        </div>
    );
}