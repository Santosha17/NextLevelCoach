'use client';

import React, { useState, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Zap, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function UpdatePassword() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Verificar se existe uma sessão ativa (vinda do link de recuperação)
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('Sessão expirada ou inválida. Por favor, solicita um novo link de recuperação.');
                router.push('/forgot-password');
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirecionar após 2 segundos para o dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (err: any) {
            alert(err.message || 'Erro ao atualizar a password. Tenta novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Glow Background característico do design Elite Red */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* CARD PRINCIPAL */}
            <div className="bg-slate-900/50 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/5 animate-in fade-in zoom-in duration-500 relative z-10">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Shield size={10} fill="currentColor" /> Security Protocol
                    </div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                        Nova <span className="text-red-600">Password</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                        Define a tua nova credencial de acesso elite.
                    </p>
                </div>

                {success ? (
                    <div className="text-center py-10 animate-in fade-in zoom-in">
                        <div className="mx-auto w-20 h-20 bg-red-600/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-red-600/20">
                            <CheckCircle className="text-red-500" size={40} />
                        </div>
                        <h3 className="text-white font-black italic uppercase text-xl mb-2">Atualizada!</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            A redirecionar para o Dashboard...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 text-slate-600" size={18} />
                            <input
                                type="password"
                                placeholder="NOVA PASSWORD (MIN. 6 CARACTERES)"
                                required
                                minLength={6}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold focus:border-red-600 outline-none transition-all placeholder:text-slate-800"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-red-900/40 disabled:opacity-50 active:scale-[0.98] flex justify-center items-center gap-3 text-sm"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>Confirmar Alteração <Zap size={16} fill="currentColor" /></>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* FOOTER DE APOIO */}
            <div className="absolute bottom-8 text-center w-full">
                <p className="text-slate-600 text-[8px] font-black uppercase tracking-[0.3em]">
                    Next Level Coach · Secure Data Encryption
                </p>
            </div>
        </div>
    );
}