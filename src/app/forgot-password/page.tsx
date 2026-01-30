'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabase';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
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
            // O redirectTo é para onde o user vai depois de clicar no link do email
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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
            <Link href="/login" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition">
                <ArrowLeft size={20} /> Voltar ao Login
            </Link>

            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">Recuperar Conta</h1>
                    <p className="text-slate-400 text-sm">
                        Insere o teu email para receberes um link de recuperação.
                    </p>
                </div>

                {success ? (
                    <div className="text-center py-6 animate-in fade-in">
                        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                        <h3 className="text-white font-bold mb-2">Email Enviado!</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Verifica a tua caixa de entrada (e o spam). O link vai permitir-te criar uma nova password.
                        </p>
                        <Link href="/login">
                            <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition">
                                Voltar ao Login
                            </button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-4">
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">{error}</div>}

                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-500" size={20} />
                            <input
                                type="email" placeholder="O teu email" required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-lg transition flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Enviar Link de Recuperação'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}