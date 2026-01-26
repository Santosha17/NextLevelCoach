'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, Lock, User, BadgeCheck } from 'lucide-react'; // Adicionei BadgeCheck

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    // Estados
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // 1. Estado para a Role e Licença
    const [role, setRole] = useState<'coach' | 'player'>('coach');
    const [licenseNumber, setLicenseNumber] = useState('');

    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                // === REGISTO ===

                // Preparar os dados extras
                const metaData: any = {
                    full_name: fullName,
                    role: role,
                };

                // Se for treinador, adiciona a licença
                if (role === 'coach') {
                    if (!licenseNumber) throw new Error('O nº da licença é obrigatório para treinadores.');
                    metaData.license_number = licenseNumber;
                }

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: metaData,
                    },
                });
                if (error) throw error;
                setMessage('Conta criada! Verifica o teu email para confirmar.');
            } else {
                // === LOGIN ===
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">

            <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition">
                <ArrowLeft size={20} /> Voltar
            </Link>

            <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {isSignUp ? 'Criar Conta' : 'Bem-vindo'}
                    </h1>
                    <p className="text-slate-400">
                        {isSignUp ? 'Junta-te à comunidade.' : 'Entra na tua conta.'}
                    </p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">{error}</div>}
                {message && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-sm text-center">{message}</div>}

                <form onSubmit={handleAuth} className="space-y-4">

                    {isSignUp && (
                        <>
                            {/* SELETOR DE ROLE */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('coach')}
                                    className={`py-3 rounded-xl border font-bold transition flex items-center justify-center gap-2 ${
                                        role === 'coach'
                                            ? 'bg-green-500 text-slate-900 border-green-500 shadow-lg shadow-green-500/20'
                                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    <span>📋 Treinador</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('player')}
                                    className={`py-3 rounded-xl border font-bold transition flex items-center justify-center gap-2 ${
                                        role === 'player'
                                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    <span>🎾 Jogador</span>
                                </button>
                            </div>

                            {/* CAMPOS ESPECÍFICOS DE REGISTO */}
                            <div>
                                <label className="block text-slate-400 text-sm mb-1 ml-1">Nome Completo</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Ex: João Silva"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-green-500 transition"
                                        required
                                    />
                                    <div className="absolute left-3 top-3.5 text-slate-500"><User size={18} /></div>
                                </div>
                            </div>

                            {/* CAMPO CONDICIONAL: Nº DA LICENÇA (Só para Coach) */}
                            {role === 'coach' && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <label className="block text-slate-400 text-sm mb-1 ml-1 flex justify-between">
                                        Nº Licença FPP
                                        <span className="text-xs text-green-500 font-bold uppercase">Obrigatório</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Ex: 12345"
                                            value={licenseNumber}
                                            onChange={(e) => setLicenseNumber(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-green-500 transition"
                                            required
                                        />
                                        <div className="absolute left-3 top-3.5 text-slate-500"><BadgeCheck size={18} /></div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* CAMPOS COMUNS (EMAIL/PASS) */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-1 ml-1">Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-green-500 transition"
                                required
                            />
                            <div className="absolute left-3 top-3.5 text-slate-500"><Mail size={18} /></div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-green-500 transition"
                                required
                            />
                            <div className="absolute left-3 top-3.5 text-slate-500"><Lock size={18} /></div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-lg transition flex justify-center items-center gap-2 mt-6 shadow-lg shadow-green-500/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    {isSignUp ? 'Já tens conta?' : 'Ainda não tens conta?'}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="ml-2 text-green-400 hover:underline font-bold"
                    >
                        {isSignUp ? 'Faz Login' : 'Regista-te'}
                    </button>
                </div>
            </div>
        </div>
    );
}