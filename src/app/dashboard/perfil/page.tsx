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
    Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
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
                role: role,
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
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-600 gap-4">
                <Loader2 className="animate-spin w-10 h-10" />
                <span className="font-black uppercase tracking-[0.3em] text-xs text-slate-500">Next Level Coach</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-white font-sans relative overflow-hidden">
            {/* Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="p-3 bg-slate-900 hover:bg-red-600/10 border border-white/5 text-slate-400 hover:text-red-500 rounded-2xl transition-all active:scale-90"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                                O MEU <span className="text-red-600">PERFIL</span>
                            </h1>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Configurações de conta</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 md:p-10 shadow-2xl">
                    <form onSubmit={updateProfile} className="space-y-8">

                        {/* 1. SECÇÃO TIPO DE CONTA (Elite Card) */}
                        <div className="bg-slate-950 border border-white/5 p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-inner">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl shadow-lg ${role === 'coach' ? 'bg-red-600/10 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                                    {role === 'coach' ? <Shield size={28} fill="currentColor" /> : <User size={28} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-600 mb-1 tracking-widest">Acreditação de Conta</p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <p className="text-2xl font-black italic uppercase text-white tracking-tight">
                                            {role === 'coach' ? 'Treinador Elite' : 'Jogador'}
                                        </p>

                                        {role === 'coach' && (
                                            isVerified ? (
                                                <span className="flex items-center gap-1.5 text-[9px] bg-red-600 text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest italic shadow-lg shadow-red-900/20">
                                                    <CheckCircle size={12} /> Verificado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-[9px] bg-slate-800 text-slate-400 border border-white/5 px-3 py-1 rounded-lg font-black uppercase tracking-widest">
                                                    <AlertCircle size={12} /> Validação Pendente
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-xl text-slate-700" title="Contacta o suporte para mudar de cargo">
                                <Lock size={20} />
                            </div>
                        </div>

                        {/* GRID DE INPUTS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* NOME COMPLETO */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-4 text-slate-600" size={18} />
                                    <input
                                        id="fullName"
                                        type="text"
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold focus:border-red-600 outline-none transition-all placeholder:text-slate-800"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="O teu nome"
                                    />
                                </div>
                            </div>

                            {/* TELEMÓVEL */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Contacto Directo</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-4 text-slate-600" size={18} />
                                    <input
                                        id="phone"
                                        type="tel"
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold focus:border-red-600 outline-none transition-all placeholder:text-slate-800"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="9xx xxx xxx"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LICENÇA (Visível apenas se for Treinador) */}
                        {role === 'coach' && (
                            <div className="bg-red-600/5 p-6 rounded-[2rem] border border-red-600/10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="text-[10px] font-black uppercase text-red-500 ml-1 mb-3 flex items-center gap-2 tracking-[0.2em]">
                                    <Shield size={14} /> Credencial FPP (Obrigatório)
                                </label>
                                <input
                                    id="license"
                                    type="text"
                                    className="w-full bg-slate-950 border border-red-600/20 rounded-2xl py-4 px-6 text-sm text-white font-black italic tracking-widest focus:border-red-600 outline-none transition-all"
                                    value={license}
                                    onChange={(e) => setLicense(e.target.value)}
                                    placeholder="Nº DE LICENÇA"
                                />
                                <p className="text-[9px] text-slate-600 mt-4 font-bold uppercase tracking-widest italic leading-relaxed">
                                    * Esta informação é crucial para a validação do teu estatuto de treinador elite na nossa rede global.
                                </p>
                            </div>
                        )}

                        {/* BOTÃO DE ACÇÃO */}
                        <div className="pt-4 border-t border-white/5">
                            <button
                                type="submit"
                                disabled={saving || success}
                                className={`w-full py-5 rounded-[1.5rem] font-black uppercase italic tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 ${
                                    success
                                        ? 'bg-red-600 text-white shadow-red-900/40 cursor-default'
                                        : 'bg-white text-slate-950 hover:bg-red-600 hover:text-white shadow-white/5'
                                } ${saving ? 'opacity-80 cursor-wait' : ''}`}
                            >
                                {saving ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : success ? (
                                    <CheckCircle size={24} />
                                ) : (
                                    <Zap size={18} fill="currentColor" />
                                )}
                                <span>{success ? 'Dados Actualizados' : saving ? 'A Processar...' : 'Gravar Alterações'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}