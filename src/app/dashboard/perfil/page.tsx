'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase';
import {
    User,
    Shield,
    Save,
    Loader2,
    Check,
    Phone,
    ArrowLeft,
    Lock,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
    // Mantemos o useMemo para garantir estabilidade máxima
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'coach' | 'player'>('player');
    const [license, setLicense] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();

                if (!isMounted) return;

                if (error || !user) {
                    router.push('/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!isMounted) return;

                if (profile) {
                    setFullName(profile.full_name ?? '');
                    setPhone(profile.phone ?? '');
                    setRole((profile.role as 'coach' | 'player') ?? 'player');
                    setLicense(profile.license_number ?? '');
                    setIsVerified(profile.verified_coach ?? false);
                } else {
                    setFullName(user.user_metadata?.full_name ?? '');
                    setPhone(user.user_metadata?.phone ?? '');
                }
            } catch (e) {
                console.error('Erro ao carregar:', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadProfile();

        return () => { isMounted = false; };
    }, [router, supabase]);

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) throw new Error('Sessão perdida. Faz login novamente.');

            if (role === 'coach' && !license.trim()) {
                alert('A Licença FPP é obrigatória para treinadores.');
                setSaving(false);
                return;
            }

            const updates = {
                id: user.id,
                full_name: fullName,
                phone: phone,
                license_number: license,
                role: role, // Mantém o role atual (read-only na UI)
                updated_at: new Date().toISOString(),
            };

            const { error: dbError } = await supabase
                .from('profiles')
                .upsert(updates, { onConflict: 'id' });

            if (dbError) throw dbError;

            setSuccess(true);
            router.refresh();

            setTimeout(() => {
                setSaving(false);
                setSuccess(false);
            }, 2000);

        } catch (error: any) {
            console.error('Erro ao guardar:', error);
            alert('Erro ao guardar: ' + (error?.message || 'Verifica a consola.'));
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
                <Loader2 className="animate-spin" /> A carregar perfil...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-4">
                    <Link
                        href="/dashboard"
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-3xl font-bold">O Meu Perfil</h1>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
                    <form onSubmit={updateProfile} className="space-y-6">

                        {/* 1. SECÇÃO TIPO DE CONTA (Restaurada: Bloqueada/Read-Only) */}
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${role === 'coach' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {role === 'coach' ? <Shield size={24} /> : <User size={24} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500 mb-0.5">Tipo de Conta</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-white capitalize">
                                            {role === 'coach' ? 'Treinador' : 'Jogador'}
                                        </p>

                                        {/* Badge de Verificação */}
                                        {role === 'coach' && (
                                            isVerified ? (
                                                <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                    <CheckCircle size={10} /> Verificado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                    <AlertCircle size={10} /> Pendente
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-slate-500" title="Contacta o suporte para mudar de cargo"><Lock size={18} /></div>
                        </div>

                        {/* 2. NOME COMPLETO */}
                        <div>
                            <label htmlFor="fullName" className="block text-slate-400 text-xs font-bold uppercase mb-2">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                <input
                                    id="fullName"
                                    name="fullName"
                                    autoComplete="name"
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 3. TELEMÓVEL */}
                        <div>
                            <label htmlFor="phone" className="block text-slate-400 text-xs font-bold uppercase mb-2">Telemóvel</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                <input
                                    id="phone"
                                    name="phone"
                                    autoComplete="tel"
                                    type="tel"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="912 345 678"
                                />
                            </div>
                        </div>

                        {/* 4. LICENÇA (Visível apenas se for Treinador) */}
                        {role === 'coach' && (
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                                <label htmlFor="license" className="block text-green-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                    <Shield size={14} /> Nº Licença FPP (Obrigatório)
                                </label>
                                <input
                                    id="license"
                                    name="license"
                                    autoComplete="off"
                                    type="text"
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-3 px-4 text-white focus:border-green-500 outline-none transition"
                                    value={license}
                                    onChange={(e) => setLicense(e.target.value)}
                                    placeholder="Ex: 12345"
                                />
                                <p className="text-[10px] text-slate-500 mt-2">
                                    Necessário para validação da conta de treinador.
                                </p>
                            </div>
                        )}

                        {/* 5. BOTÃO */}
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
                            <span>{success ? 'Dados Atualizados!' : saving ? 'A guardar...' : 'Gravar Alterações'}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}