'use client';

import React, { useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import { ArrowLeft, Mail, Loader2, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
            });
            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Glow Background característico do design Elite Red */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* BOTÃO VOLTAR */}
            <Link
                href="/login"
                className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest z-10"
            >
                <ArrowLeft size={16} /> Voltar ao Login
            </Link>

            {/* CARD PRINCIPAL */}
            <div className="bg-slate-900/50 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/5 animate-in fade-in zoom-in duration-500 relative z-10">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Zap size={10} fill="currentColor" /> Account Recovery
                    </div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                        Recuperar <span className="text-red-600">Acesso</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                        Insere o teu email profissional para resetar a tua credencial.
                    </p>
                </div>

                {success ? (
                    <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="mx-auto w-20 h-20 bg-red-600/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-red-600/20">
                            <CheckCircle className="text-red-500" size={40} />
                        </div>
                        <h3 className="text-white font-black italic uppercase text-xl mb-3 tracking-tight text-white">Email Enviado</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed italic">
                            Verifica a tua caixa de entrada. O link de segurança permitirá criar uma nova password de elite.
                        </p>
                        <Link href="/login">
                            <button className="w-full bg-white text-slate-950 hover:bg-red-600 hover:text-white font-black uppercase italic tracking-widest py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-xs">
                                Autorizar Login
                            </button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-4 top-4 text-slate-600" size={18} />
                            <input
                                type="email"
                                placeholder="EMAIL PROFISSIONAL"
                                required
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold focus:border-red-600 outline-none transition-all placeholder:text-slate-800"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                <>Enviar Código Reset <Zap size={16} fill="currentColor" /></>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* FOOTER DE APOIO */}
            <div className="absolute bottom-8 text-center w-full">
                <p className="text-slate-600 text-[8px] font-black uppercase tracking-[0.3em]">
                    Next Level Coach · Secure Protocol 2.0
                </p>
            </div>
        </div>
    );
}