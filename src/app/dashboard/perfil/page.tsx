'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import { User, Shield, Save, Loader2, Check, Phone } from 'lucide-react'; // <--- Adicionei Phone
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Dados do Formulário
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState(''); // <--- NOVO ESTADO
    const [role, setRole] = useState('player');
    const [license, setLicense] = useState('');

    // 1. Carregar dados atuais
    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Preencher o formulário com o que já existe
            setFullName(user.user_metadata?.full_name || '');
            setPhone(user.user_metadata?.phone || ''); // <--- CARREGAR TELEMÓVEL
            setRole(user.user_metadata?.role || 'player');
            setLicense(user.user_metadata?.license_number || '');
            setLoading(false);
        };

        loadProfile();
    }, []);

    // 2. Gravar Alterações
    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            // 1. Validação: Treinador precisa de licença
            if (role === 'coach' && !license.trim()) {
                alert('Para o perfil de Treinador, a Licença FPP é obrigatória.');
                setSaving(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utilizador não encontrado');

            // 2. Atualizar METADADOS (Auth)
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    phone: phone, // <--- ATUALIZAR NOS METADADOS
                    role: role,
                    license_number: license
                }
            });
            if (authError) throw authError;

            // 3. Atualizar TABELA PROFILES (Base de Dados)
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    phone: phone, // <--- ATUALIZAR NA TABELA
                    role: role,
                    license_number: license
                })
                .eq('id', user.id);

            if (dbError) throw dbError;

            setSuccess(true);

            // Pequeno delay para mostrar o "Visto" verde antes de fazer refresh ou não
            setTimeout(() => {
                setSuccess(false);
                // Opcional: router.refresh() se quiseres forçar reload dos dados
            }, 2000);

        } catch (error: any) {
            alert('Erro ao atualizar: ' + error.message);
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">A carregar perfil...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10">
            <div className="max-w-2xl mx-auto">

                <h1 className="text-3xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
                    Definições de Perfil
                </h1>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
                    <form onSubmit={updateProfile} className="space-y-6">

                        {/* Campo Nome */}
                        <div>
                            <label className="block text-slate-400 text-sm font-bold uppercase mb-2">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Campo Telemóvel (NOVO) */}
                        <div>
                            <label className="block text-slate-400 text-sm font-bold uppercase mb-2">Telemóvel</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                <input
                                    type="tel"
                                    placeholder="Ex: 912 345 678"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Seletor de Tipo de Conta */}
                        <div>
                            <label className="block text-slate-400 text-sm font-bold uppercase mb-2">Tipo de Conta</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('player')}
                                    className={`py-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-2 ${role === 'player' ? 'border-green-500 bg-green-500/10 text-white' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500'}`}
                                >
                                    <User size={24} />
                                    <span>Jogador</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('coach')}
                                    className={`py-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-2 ${role === 'coach' ? 'border-green-500 bg-green-500/10 text-white' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500'}`}
                                >
                                    <Shield size={24} />
                                    <span>Treinador</span>
                                </button>
                            </div>
                        </div>

                        {role === 'coach' && (
                            <div className="animate-fade-in bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                <label className="block text-green-400 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                    <Shield size={16} /> Nº Licença FPP
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: 12345"
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none"
                                    value={license}
                                    onChange={(e) => setLicense(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-2">Obrigatório para contas de treinador.</p>
                            </div>
                        )}

                        {/* Botão Gravar */}
                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition ${success ? 'bg-green-600 text-white' : 'bg-green-500 hover:bg-green-400 text-slate-900'}`}
                        >
                            {saving ? <Loader2 className="animate-spin" /> : success ? <Check /> : <Save />}
                            <span>{success ? 'Dados Atualizados!' : 'Gravar Alterações'}</span>
                        </button>

                    </form>
                </div>

            </div>
        </div>
    );
}