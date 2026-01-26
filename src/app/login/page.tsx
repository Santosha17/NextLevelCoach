'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login e Registo
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
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName, // Guarda o nome no perfil
                        },
                    },
                });
                if (error) throw error;
                setMessage('Conta criada! Verifica o teu email para confirmar (ou entra se desligaste a confirmação).');
            } else {
                // === LOGIN ===
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/'); // Redireciona para a página principal
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

            {/* Botão Voltar */}
            <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition">
                <ArrowLeft size={20} /> Voltar
            </Link>

            <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {isSignUp ? 'Criar Conta' : 'Bem-vindo'}
                    </h1>
                    <p className="text-slate-400">
                        {isSignUp ? 'Junta-te à elite dos treinadores.' : 'Entra para gerir as tuas táticas.'}
                    </p>
                </div>

                {/* Mensagens de Erro/Sucesso */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-sm text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">

                    {/* Nome (Só aparece no Registo) */}
                    {isSignUp && (
                        <div>
                            <label className="block text-slate-400 text-sm mb-1 ml-1">Nome Completo</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ex: Treinador Nuno"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-green-500 transition"
                                    required
                                />
                                <div className="absolute left-3 top-3.5 text-slate-500">
                                    <Mail size={18} className="opacity-0" /> {/* Espaçador invisível ou ícone de User */}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email */}
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
                            <div className="absolute left-3 top-3.5 text-slate-500">
                                <Mail size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Password */}
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
                            <div className="absolute left-3 top-3.5 text-slate-500">
                                <Lock size={18} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-lg transition flex justify-center items-center gap-2 mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta Grátis' : 'Entrar')}
                    </button>
                </form>

                {/* Alternar entre Login/Registo */}
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