'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Shield, Loader2, ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const supabase = createClient();
    const router = useRouter();

    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'player' | 'coach'>('player');
    const [license, setLicense] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (!fullName.trim() || !phone.trim()) {
                    alert('Todos os campos são obrigatórios, incluindo o telemóvel.');
                    return;
                }

                if (role === 'coach' && !license.trim()) {
                    alert('Treinadores certificados têm de inserir o nº de licença FPP.');
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
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                if (!data.session) {
                    alert('Login falhou. Tenta novamente.');
                    return;
                }

                router.push('/dashboard');
                router.refresh();
            }
        } catch (error: any) {
            alert('Erro: ' + (error?.message || 'Ocorreu um erro na autenticação.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
            <Link
                href="/"
                className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition"
            >
                <ArrowLeft size={20} /> Voltar
            </Link>

            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2">Coach Next Level</h1>
                    <p className="text-slate-400">
                        {isSignUp ? 'Cria a tua conta profissional' : 'Bem-vindo de volta'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-4">
                            <div className="relative">
                                <User
                                    className="absolute left-3 top-3.5 text-slate-500"
                                    size={20}
                                />
                                <input
                                    type="text"
                                    placeholder="Nome Completo"
                                    required={isSignUp}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            <div className="relative">
                                <Phone
                                    className="absolute left-3 top-3.5 text-slate-500"
                                    size={20}
                                />
                                <input
                                    type="tel"
                                    placeholder="Telemóvel"
                                    required={isSignUp}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setRole('player')}
                                    className={`py-2 rounded-md text-sm font-bold transition ${
                                        role === 'player'
                                            ? 'bg-slate-700 text-white shadow'
                                            : 'text-slate-500 hover:text-white'
                                    }`}
                                >
                                    Jogador
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('coach')}
                                    className={`py-2 rounded-md text-sm font-bold transition ${
                                        role === 'coach'
                                            ? 'bg-green-500 text-slate-900 shadow'
                                            : 'text-slate-500 hover:text-white'
                                    }`}
                                >
                                    Treinador
                                </button>
                            </div>

                            {role === 'coach' && (
                                <div className="relative">
                                    <Shield
                                        className="absolute left-3 top-3.5 text-green-500"
                                        size={20}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Nº Licença FPP (Obrigatório)"
                                        required={role === 'coach'}
                                        className="w-full bg-slate-900 border border-green-500/50 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                                        value={license}
                                        onChange={(e) => setLicense(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                        *Necessário para comprovar certificação.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <Mail
                            className="absolute left-3 top-3.5 text-slate-500"
                            size={20}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Lock
                            className="absolute left-3 top-3.5 text-slate-500"
                            size={20}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            minLength={6}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {!isSignUp && (
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-xs text-green-500 hover:text-green-400 font-bold hover:underline transition"
                            >
                                Esqueceste-te da password?
                            </Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-lg transition flex justify-center items-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-70"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : isSignUp ? (
                            'Criar Conta'
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-slate-400">
                        {isSignUp ? 'Já tens conta?' : 'Ainda não tens conta?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-green-400 hover:text-green-300 font-bold underline transition"
                        >
                            {isSignUp ? 'Faz Login' : 'Regista-te grátis'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
