'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';

export default function UpdatePassword() {
    const supabase = createClient();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session) {
                alert('Sessão inválida. Abre novamente o link de recuperação.');
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) throw updateError;

            alert('Password atualizada com sucesso!');
            router.push('/dashboard');
        } catch {
            alert('Não foi possível atualizar a password. Tenta novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">Nova Password</h1>
                    <p className="text-slate-400 text-sm">
                        Escolhe uma nova password segura.
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="relative">
                        <Lock
                            className="absolute left-3 top-3.5 text-slate-500"
                            size={20}
                        />
                        <input
                            type="password"
                            placeholder="Nova Password (mín. 6 caracteres)"
                            required
                            minLength={6}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-green-500 outline-none transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-lg transition flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            'Atualizar Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
