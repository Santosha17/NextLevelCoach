'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import Link from 'next/link';
import { Layout, Calendar, User, Search, Globe, Loader2, Heart, Copy, CheckCircle2 } from 'lucide-react';

export default function ComunidadePage() {
    const supabase = createClient();
    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // NOVOS ESTADOS: Utilizador atual, Likes e Clonagem
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [likesMap, setLikesMap] = useState<Record<string, { count: number; isLiked: boolean }>>({});
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [clonedIds, setClonedIds] = useState<string[]>([]);

    useEffect(() => {
        let isMounted = true;

        const getData = async () => {
            try {
                // 1. Obter Sessão
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.warn('Aviso de sessão:', error.message);
                }

                if (isMounted && session?.user) {
                    setCurrentUser(session.user);
                }

                if (!isMounted) return;

                // 2. Carregar Drills Públicos
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

                if (data) {
                    setDrills(data);

                    // 3. NOVO: Buscar os Likes destas táticas
                    if (data.length > 0) {
                        const drillIds = data.map((d: any) => d.id);
                        const { data: likesData } = await supabase
                            .from('drill_likes')
                            .select('drill_id, user_id')
                            .in('drill_id', drillIds);

                        if (likesData && isMounted) {
                            const newLikesMap: Record<string, { count: number; isLiked: boolean }> = {};

                            drillIds.forEach((id: string) => newLikesMap[id] = { count: 0, isLiked: false });

                            likesData.forEach((like: any) => {
                                if (newLikesMap[like.drill_id]) {
                                    newLikesMap[like.drill_id].count += 1;
                                    if (session?.user && like.user_id === session.user.id) {
                                        newLikesMap[like.drill_id].isLiked = true;
                                    }
                                }
                            });

                            setLikesMap(newLikesMap);
                        }
                    }
                }

            } catch (e) {
                console.error('Erro inesperado em ComunidadePage:', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getData();

        return () => {
            isMounted = false;
        };
    }, []);

    // --- NOVAS FUNÇÕES: LIKES E CLONAR ---

    const toggleLike = async (drillId: string) => {
        if (!currentUser) return alert("Inicia sessão para interagir com a comunidade.");

        const currentData = likesMap[drillId] || { count: 0, isLiked: false };
        const isLiking = !currentData.isLiked;

        // Atualização "Otimista" para parecer instantâneo ao utilizador
        setLikesMap(prev => ({
            ...prev,
            [drillId]: {
                count: isLiking ? currentData.count + 1 : currentData.count - 1,
                isLiked: isLiking
            }
        }));

        try {
            if (isLiking) {
                await supabase.from('drill_likes').insert({ drill_id: drillId, user_id: currentUser.id });
            } else {
                await supabase.from('drill_likes').delete().match({ drill_id: drillId, user_id: currentUser.id });
            }
        } catch (error) {
            console.error("Erro ao processar like:", error);
        }
    };

    const cloneDrill = async (drill: any) => {
        if (!currentUser) return alert("Inicia sessão para guardar na tua biblioteca.");

        setCloningId(drill.id);

        try {
            // Retira dados que não devem ser copiados
            const { id, created_at, user_id, is_public, ...restOfDrill } = drill;

            const newDrill = {
                ...restOfDrill,
                title: `${drill.title} (Cópia)`, // Adiciona a tag de cópia
                user_id: currentUser.id,         // Tu passas a ser o dono
                is_public: false                 // Fica privado na tua conta
            };

            const { error } = await supabase.from('drills').insert(newDrill);
            if (error) throw error;

            setClonedIds(prev => [...prev, drill.id]);

            // Remove o estado de "Guardado!" passados 3 segundos
            setTimeout(() => {
                setClonedIds(prev => prev.filter(i => i !== drill.id));
            }, 3000);

        } catch (error) {
            console.error("Erro ao clonar tática:", error);
            alert("Não foi possível clonar a tática.");
        } finally {
            setCloningId(null);
        }
    };

    // --- RENDERIZAÇÃO ---

    const filteredDrills = drills.filter((drill) =>
        drill.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Ataque': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'Defesa': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Aquecimento': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
                <Loader2 className="animate-spin" /> A carregar a comunidade...
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
                        novas ideias para o teu Dashboard.
                    </p>
                </div>

                <div className="max-w-xl mx-auto mb-12 relative">
                    <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
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
                        {filteredDrills.map((drill) => {
                            const likeData = likesMap[drill.id] || { count: 0, isLiked: false };
                            const isCloned = clonedIds.includes(drill.id);
                            const isCloning = cloningId === drill.id;
                            const isMine = currentUser && drill.user_id === currentUser.id;

                            return (
                                <div
                                    key={drill.id}
                                    className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-green-500/50 transition group hover:shadow-2xl hover:shadow-black/50 flex flex-col justify-between"
                                >
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wider ${getCategoryColor(drill.category)}`}>
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

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-slate-900 font-bold text-xs">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">Criado por</p>
                                                    <p className="text-sm text-white font-medium">{drill.author_name || 'Treinador'}</p>
                                                </div>
                                            </div>

                                            {/* BOTÃO DE LIKE */}
                                            <button
                                                onClick={() => toggleLike(drill.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition ${likeData.isLiked ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                                            >
                                                <Heart size={16} className={likeData.isLiked ? 'fill-red-500 text-red-500' : ''} />
                                                <span className="text-xs font-bold">{likeData.count}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* DIVISÃO DE BOTÕES (VER E CLONAR) */}
                                    <div className="flex border-t border-slate-700 bg-slate-900/50">
                                        <Link href={`/dashboard/tatica?id=${drill.id}`} className="flex-1">
                                            <button className="w-full hover:bg-slate-800 text-slate-300 font-bold py-4 transition flex items-center justify-center gap-2 border-r border-slate-700">
                                                <Layout size={18} /> Ver Tática
                                            </button>
                                        </Link>

                                        {!isMine ? (
                                            <button
                                                onClick={() => cloneDrill(drill)}
                                                disabled={isCloning || isCloned}
                                                className={`flex-1 font-bold py-4 transition flex items-center justify-center gap-2 ${
                                                    isCloned
                                                        ? 'bg-green-500/10 text-green-500'
                                                        : 'text-green-500 hover:bg-green-500 hover:text-slate-900'
                                                }`}
                                            >
                                                {isCloning ? (
                                                    <><Loader2 size={18} className="animate-spin" /> Guardar...</>
                                                ) : isCloned ? (
                                                    <><CheckCircle2 size={18} /> Guardado!</>
                                                ) : (
                                                    <><Copy size={18} /> Clonar</>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="flex-1 py-4 text-xs font-bold uppercase text-slate-600 flex items-center justify-center bg-slate-900/20 cursor-not-allowed">
                                                É a tua tática
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}