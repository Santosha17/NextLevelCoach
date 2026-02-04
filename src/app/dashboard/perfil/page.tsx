'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase';
import {
    User, Shield, Save, Loader2, Check, Phone, ArrowLeft, Lock, CheckCircle, AlertCircle
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
        // --- MARCADOR PARA CONFIRMAR SE O CÓDIGO É O NOVO ---
        console.log(">>> CÓDIGO NOVO CARREGADO: VERSÃO FINAL <<<");

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

        console.log("Iniciando gravação..."); // Log para debug

        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) throw new Error('Sessão perdida.');

            if (role === 'coach' && !license.trim()) {
                alert('A Licença FPP é obrigatória.');
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

            // ATENÇÃO: AQUI SÓ FAZEMOS UPSERT NA BD.
            // NÃO CHAMAMOS auth.updateUser (isso causava o erro PUT)
            const { error: dbError } = await supabase
                .from('profiles')
                .upsert(updates, { onConflict: 'id' });

            if (dbError) throw dbError;

            console.log("Gravação na BD com sucesso!");

            setSuccess(true);
            router.refresh();

            setTimeout(() => {
                setSaving(false);
                setSuccess(false);
            }, 2000);

        } catch (error: any) {
            console.error('Erro Fatal:', error);
            alert('Erro: ' + (error?.message || 'Erro desconhecido'));
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-4">
                    <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition"><ArrowLeft size={20} /></Link>
                    <h1 className="text-3xl font-bold">O Meu Perfil</h1>
                </div>
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
                    <form onSubmit={updateProfile} className="space-y-6">
                        {/* Campos simplificados para brevidade, mantenha o resto do seu layout igual */}
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Nome</label>
                            <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Telemóvel</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
                        </div>
                        {role === 'coach' && (
                            <div>
                                <label className="block text-green-400 text-xs font-bold uppercase mb-2">Licença</label>
                                <input value={license} onChange={e => setLicense(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white" />
                            </div>
                        )}
                        <button type="submit" disabled={saving || success} className="w-full py-4 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-xl flex justify-center gap-2">
                            {saving ? <Loader2 className="animate-spin" /> : success ? <Check /> : <Save />}
                            <span>{success ? 'Guardado!' : saving ? 'A guardar...' : 'Gravar'}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}