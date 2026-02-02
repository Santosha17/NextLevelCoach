'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import Link from 'next/link';
import { Layout, Calendar, User, Search, Globe, Loader2 } from 'lucide-react';

export default function ComunidadePage() {
    const supabase = createClient();
    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sessionError, setSessionError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const getData = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error || !session?.user) {
                    console.error('Sessão (opcional) em ComunidadePage:', error);
                    // Aqui podes decidir se obrigas login ou não; neste exemplo NÃO obrigo.
                }

                const { data, error: drillsError } = await supabase
                    .from('drills')
                    .select('*')
                    .eq('is_public', true)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!isMounted) return;

                if (drillsError) {
                    console.error('Erro a carregar drills públicos:', drillsError);
                }

                if (data) setDrills(data);
            } catch (e) {
                console.error('Erro inesperado em ComunidadePage:', e);
                setSessionError('Ocorreu um erro ao carregar a comunidade.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getData();

        return () => {
            isMounted = false;
        };
    }, [supabase]);

    const filteredDrills = drills.filter((drill) =>
        drill.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Ataque':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'Defesa':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Aquecimento':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default:
                return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
                <Loader2 className="animate-spin" /> A carregar a comunidade...
            </div>
        );
    }

    if (sessionError) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-red-400">
                <p className="mb-2 font-bold">{sessionError}</p>
                <p className="text-sm text-slate-400">
                    Tenta recarregar a página ou voltar a entrar mais tarde.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tight flex justify-center items-center gap-3">
                        <Globe className="text-green-500" size={40} />
                        COMUNIDADE <span className="text-green-500">CNL</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Explora exercícios criados por treinadores de elite. Inspira-te e leva
                        novas ideias para o campo.
                    </p>
                </div>

                <div className="max-w-xl mx-auto mb-12 relative">
                    <Search
                        className="absolute left-4 top-3.5 text-slate-500"
                        size={20}
                    />
                    <input
                        type="text"
                        placeholder="Pesquisar táticas na comunidade..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-full py-3 pl-12 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition shadow-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredDrills.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                        <Globe size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl text-white font-bold mb-2">
                            A comunidade está silenciosa...
                        </h3>
                        <p className="text-slate-400">
                            Sê o primeiro a partilhar uma tática pública!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDrills.map((drill) => (
                            <div
                                key={drill.id}
                                className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-green-500/50 transition group hover:shadow-2xl hover:shadow-black/50 flex flex-col justify-between"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                    <span
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wider ${getCategoryColor(
                            drill.category
                        )}`}
                    >
                      {drill.category || 'Geral'}
                    </span>
                                        <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Calendar size={12} />
                                            {new Date(drill.created_at).toLocaleDateString('pt-PT')}
                    </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                        {drill.title}
                                    </h3>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-slate-900 font-bold text-xs">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">
                                                Criado por
                                            </p>
                                            <p className="text-sm text-white font-medium">
                                                {drill.author_name || 'Treinador'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Link href={`/dashboard/tatica?id=${drill.id}`} className="block">
                                    <button className="w-full bg-slate-900/50 hover:bg-green-500 hover:text-slate-900 text-green-400 font-bold py-4 transition border-t border-slate-700 flex items-center justify-center gap-2">
                                        <Layout size={18} /> Ver Tática
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
