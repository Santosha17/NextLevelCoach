'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import { User, Shield, Save, Loader2, Check, Phone, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Importei Link para o botão de voltar

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Dados do Formulário
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('player'); // Valor por defeito
    const [license, setLicense] = useState('');

    // 1. Carregar dados atuais
    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Tenta carregar primeiro da tabela 'profiles' (dados mais fiáveis e persistentes)
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFullName(profile.full_name || '');
                setPhone(profile.phone || '');
                setRole(profile.role || 'player');
                setLicense(profile.license_number || '');
            } else {
                // Fallback para metadata se não houver perfil na tabela (ex: primeiro login)
                setFullName(user.user_metadata?.full_name || '');
                setPhone(user.user_metadata?.phone || '');
                setRole(user.user_metadata?.role || 'player');
                setLicense(user.user_metadata?.license_number || '');
            }

            setLoading(false);
        };

        loadProfile();
    }, [router, supabase]); // Adicionei dependências ao useEffect

    // 2. Gravar Alterações
    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false); // Reseta o estado de sucesso antes de começar

        try {
            // Validação: Treinador precisa de licença
            if (role === 'coach' && !license.trim()) {
                alert('Para o perfil de Treinador, a Licença FPP é obrigatória.');
                setSaving(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utilizador não encontrado');

            // Atualizar METADADOS (Auth) - Útil para acesso rápido na sessão
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    phone: phone,
                    role: role,
                    license_number: license
                }
            });
            if (authError) throw authError;

            // Atualizar TABELA PROFILES (Base de Dados) - A fonte de verdade
            const updates = {
                id: user.id,
                full_name: fullName,
                phone: phone,
                role: role,
                license_number: license,
                updated_at: new Date().toISOString(),
            };

            const { error: dbError } = await supabase
                .from('profiles')
                .upsert(updates); // Usa upsert para criar se não existir

            if (dbError) throw dbError;

            setSuccess(true);

            // Feedback visual temporário
            setTimeout(() => {
                setSuccess(false);
                setSaving(false); // Volta ao estado normal do botão
                router.refresh(); // Atualiza a página para refletir dados (ex: Navbar)
            }, 2000);

        } catch (error: any) {
            alert('Erro ao atualizar: ' + error.message);
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 animate-pulse">A carregar perfil...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-2xl mx-auto">

                {/* Header com Botão Voltar */}
                <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-4">
                    <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-3xl font-bold">Definições de Perfil</h1>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
                    <form onSubmit={updateProfile} className="space-y-6">

                        {/* Campo Nome */}
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="O teu nome"
                                />
                            </div>
                        </div>

                        {/* Campo Telemóvel */}
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Telemóvel</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                <input
                                    type="tel"
                                    placeholder="Ex: 912 345 678"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Seletor de Tipo de Conta */}
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Tipo de Conta</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('player')}
                                    className={`py-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-2 ${role === 'player' ? 'border-green-500 bg-green-500/10 text-white' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500 hover:bg-slate-800'}`}
                                >
                                    <User size={24} />
                                    <span>Jogador</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('coach')}
                                    className={`py-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-2 ${role === 'coach' ? 'border-green-500 bg-green-500/10 text-white' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500 hover:bg-slate-800'}`}
                                >
                                    <Shield size={24} />
                                    <span>Treinador</span>
                                </button>
                            </div>
                        </div>

                        {/* Campo Licença (Condicional) */}
                        {role === 'coach' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                <label className="block text-green-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                    <Shield size={14} /> Nº Licença FPP
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: 12345"
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none transition"
                                    value={license}
                                    onChange={(e) => setLicense(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-500 mt-2">Obrigatório para contas de treinador.</p>
                            </div>
                        )}

                        {/* Botão Gravar */}
                        <button
                            type="submit"
                            disabled={saving || success}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                                success
                                    ? 'bg-green-600 text-white shadow-green-600/20 cursor-default'
                                    : 'bg-green-500 hover:bg-green-400 text-slate-900 shadow-green-500/20'
                            } ${saving ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {saving ? <Loader2 className="animate-spin" /> : success ? <Check size={24} /> : <Save size={20} />}
                            <span>{success ? 'Dados Atualizados!' : (saving ? 'A guardar...' : 'Gravar Alterações')}</span>
                        </button>

                    </form>
                </div>

            </div>
        </div>
    );
}