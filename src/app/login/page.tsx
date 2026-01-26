'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Shield, CreditCard, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const supabase = createClient();
    const router = useRouter();

    // Estados
    const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login e Registo
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Estados Novos para Registo
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('player'); // 'player' ou 'coach'
    const [license, setLicense] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                // === MODO CRIAR CONTA ===

                // Validação extra para treinadores
                if (role === 'coach' && !license) {
                    alert('Treinadores certificados têm de inserir o nº de licença FPP.');
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // Guardamos estes dados extras nos metadados do utilizador
                        data: {
                            full_name: fullName,
                            role: role,
                            license_number: role === 'coach' ? license : null,
                            verified_coach: false // Começa como falso até um admin validar (futuro)
                        }
                    }
                });

                if (error) throw error;
                alert('Conta criada com sucesso! Podes entrar.');
                setIsSignUp(false); // Volta para o login

            } else {
                // === MODO LOGIN ===
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/dashboard');
            }
        } catch (error: any) {
            alert('Erro: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">

                {/* Cabeçalho */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2">Coach Next Level</h1>
                    <p className="text-slate-400">
                        {isSignUp ? 'Cria a tua conta profissional' : 'Bem-vindo de volta, treinador'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">

                    {/* Campos Só para Registo */}
                    {isSignUp && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Nome */}
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                <input
                                    type="text" placeholder="Nome Completo" required={isSignUp}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none"
                                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            {/* Selector Coach/Player */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setRole('player')}
                                    className={`py-2 rounded-md text-sm font-bold transition ${role === 'player' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Jogador
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('coach')}
                                    className={`py-2 rounded-md text-sm font-bold transition ${role === 'coach' ? 'bg-green-500 text-slate-900' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Treinador
                                </button>
                            </div>

                            {/* Campo Licença (Só aparece se for Coach) */}
                            {role === 'coach' && (
                                <div className="relative animate-pulse-once">
                                    <Shield className="absolute left-3 top-3.5 text-green-500" size={20} />
                                    <input
                                        type="text" placeholder="Nº Licença FPP (Obrigatório)" required={role === 'coach'}
                                        className="w-full bg-slate-900 border border-green-500/50 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none"
                                        value={license} onChange={(e) => setLicense(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">*Necessário para comprovar certificação.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Campos Comuns (Email/Pass) */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-slate-500" size={20} />
                        <input
                            type="email" placeholder="Email" required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-slate-500" size={20} />
                        <input
                            type="password" placeholder="Password" required minLength={6}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-lg transition flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
                    </button>

                </form>

                {/* Toggle Login/Registo */}
                <div className="mt-6 text-center text-sm">
                    <p className="text-slate-400">
                        {isSignUp ? 'Já tens conta?' : 'Ainda não tens conta?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-green-400 hover:text-green-300 font-bold underline"
                        >
                            {isSignUp ? 'Faz Login' : 'Regista-te grátis'}
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
}