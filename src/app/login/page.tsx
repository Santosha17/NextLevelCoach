'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Shield, Loader2, ArrowLeft, Phone, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const supabase = createClient();
    const router = useRouter();

    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'player' | 'coach'>('player');
    const [license, setLicense] = useState('');

    // 1. MANTÉM A TUA VERIFICAÇÃO DE SEGURANÇA
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    router.replace('/dashboard');
                } else {
                    setCheckingSession(false);
                }
            } catch (error) {
                setCheckingSession(false);
            }
        };
        checkSession();
    }, [router, supabase]);

    // 2. MANTÉM A TUA LÓGICA DE AUTENTICAÇÃO ORIGINAL
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (!fullName.trim() || !phone.trim()) {
                    alert('Todos os campos são obrigatórios, incluindo o telemóvel.');
                    setLoading(false);
                    return;
                }

                if (role === 'coach' && !license.trim()) {
                    alert('Treinadores certificados têm de inserir o nº de licença FPP.');
                    setLoading(false);
                    return;
                }

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                        data: {
                            full_name: fullName,
                            phone,
                            role,
                            license_number: role === 'coach' ? license : null,
                            verified_coach: false,
                        },
                    },
                });

                if (error) throw error;
                alert('Conta criada! Vai ao teu email e clica no link para confirmar.');
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.refresh();
                router.push('/dashboard');
            }
        } catch (error: any) {
            alert('Erro: ' + (error?.message || 'Ocorreu um erro na autenticação.'));
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-600">
                <Loader2 className="animate-spin w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Glow Background da Identidade Next Level Coach */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* VOLTAR */}
            <Link
                href="/"
                className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest z-10"
            >
                <ArrowLeft size={16} /> Voltar
            </Link>

            {/* CARD PRINCIPAL */}
            <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/5 animate-in fade-in zoom-in duration-500 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Zap size={10} fill="currentColor" /> {isSignUp ? 'Performance Registration' : 'Coach Access'}
                    </div>

                    {/* NOME DO PROJETO ATUALIZADO */}
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                        Next Level <span className="text-red-600">Coach</span>
                    </h1>

                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                        {isSignUp ? 'Cria a tua conta profissional' : 'Bem-vindo ao teu centro tático'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                            {/* NOME COMPLETO */}
                            <div className="relative">
                                <User className="absolute left-4 top-4 text-slate-600" size={18} />
                                <input
                                    type="text"
                                    placeholder="Nome Completo"
                                    required={isSignUp}
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 text-sm text-white focus:border-red-600 outline-none transition-all placeholder:text-slate-700 font-medium"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            {/* TELEMÓVEL */}
                            <div className="relative">
                                <Phone className="absolute left-4 top-4 text-slate-600" size={18} />
                                <input
                                    type="tel"
                                    placeholder="Telemóvel"
                                    required={isSignUp}
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 text-sm text-white focus:border-red-600 outline-none transition-all placeholder:text-slate-700 font-medium"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            {/* SELETOR DE ROLE */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setRole('player')}
                                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        role === 'player'
                                            ? 'bg-slate-800 text-white shadow-xl'
                                            : 'text-slate-600 hover:text-slate-400'
                                    }`}
                                >
                                    Jogador
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('coach')}
                                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        role === 'coach'
                                            ? 'bg-red-600 text-white shadow-xl'
                                            : 'text-slate-600 hover:text-slate-400'
                                    }`}
                                >
                                    Treinador
                                </button>
                            </div>

                            {/* LICENÇA FPP (MANTIDO) */}
                            {role === 'coach' && (
                                <div className="relative animate-in fade-in duration-300">
                                    <Shield className="absolute left-4 top-4 text-red-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Nº Licença FPP (Obrigatório)"
                                        required={role === 'coach'}
                                        className="w-full bg-slate-950 border border-red-600/30 rounded-2xl py-4 pl-12 text-sm text-white focus:border-red-600 outline-none transition-all font-medium"
                                        value={license}
                                        onChange={(e) => setLicense(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-600 mt-2 ml-1 font-bold italic uppercase tracking-wider">
                                        * Necessário para comprovar certificação.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* EMAIL */}
                    <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-600" size={18} />
                        <input
                            type="email"
                            placeholder="Email Profissional"
                            required
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 text-sm text-white focus:border-red-600 outline-none transition-all placeholder:text-slate-700 font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* PASSWORD */}
                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-600" size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            minLength={6}
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 text-sm text-white focus:border-red-600 outline-none transition-all placeholder:text-slate-700 font-medium"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {!isSignUp && (
                        <div className="flex justify-end px-1">
                            <Link
                                href="/forgot-password"
                                className="text-[10px] text-red-500 hover:text-red-400 font-black uppercase tracking-widest transition-all"
                            >
                                Esqueceste-te da password?
                            </Link>
                        </div>
                    )}

                    {/* BOTÃO DE SUBMIT */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-red-900/20 disabled:opacity-50 active:scale-[0.98] flex justify-center items-center gap-3"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : isSignUp ? (
                            'Registar no Next Level Coach'
                        ) : (
                            'Autorizar Acesso'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.1em]">
                        {isSignUp ? 'Já tens conta?' : 'Ainda não tens conta?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-red-500 hover:text-red-400 underline transition-all font-black"
                        >
                            {isSignUp ? 'Faz Login' : 'Cria conta agora'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}