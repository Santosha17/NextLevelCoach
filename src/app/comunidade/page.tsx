'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import Link from 'next/link';
import {
    Layout,
    Calendar,
    User,
    Search,
    Globe,
    Loader2,
    Heart,
    Copy,
    CheckCircle2,
    Zap,
    Shield
} from 'lucide-react';

export default function ComunidadePage() {
    const supabase = createClient();
    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [likesMap, setLikesMap] = useState<Record<string, { count: number; isLiked: boolean }>>({});
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [clonedIds, setClonedIds] = useState<string[]>([]);

    useEffect(() => {
        let isMounted = true;

        const getData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted && session?.user) setCurrentUser(session.user);

                const { data, error: drillsError } = await supabase
                    .from('drills')
                    .select('*')
                    .eq('is_public', true)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!isMounted) return;

                if (data) {
                    setDrills(data);
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
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getData();
        return () => { isMounted = false; };
    }, [supabase]);

    const toggleLike = async (drillId: string) => {
        if (!currentUser) return alert("Inicia sessão para interagir.");
        const currentData = likesMap[drillId] || { count: 0, isLiked: false };
        const isLiking = !currentData.isLiked;

        setLikesMap(prev => ({
            ...prev,
            [drillId]: { count: isLiking ? currentData.count + 1 : currentData.count - 1, isLiked: isLiking }
        }));

        try {
            if (isLiking) {
                await supabase.from('drill_likes').insert({ drill_id: drillId, user_id: currentUser.id });
            } else {
                await supabase.from('drill_likes').delete().match({ drill_id: drillId, user_id: currentUser.id });
            }
        } catch (error) { console.error(error); }
    };

    const cloneDrill = async (drill: any) => {
        if (!currentUser) return alert("Inicia sessão para clonar.");
        setCloningId(drill.id);
        try {
            const { id, created_at, user_id, is_public, ...restOfDrill } = drill;
            const newDrill = { ...restOfDrill, title: `${drill.title} (Cópia)`, user_id: currentUser.id, is_public: false };
            const { error } = await supabase.from('drills').insert(newDrill);
            if (error) throw error;
            setClonedIds(prev => [...prev, drill.id]);
            setTimeout(() => setClonedIds(prev => prev.filter(i => i !== drill.id)), 3000);
        } catch (error) { alert("Erro ao clonar."); } finally { setCloningId(null); }
    };

    const filteredDrills = drills.filter((drill) =>
        drill.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Ataque': return 'bg-red-600 text-white border-red-500';
            case 'Defesa': return 'bg-blue-600 text-white border-blue-500';
            case 'Aquecimento': return 'bg-amber-500 text-slate-950 border-amber-400';
            default: return 'bg-slate-800 text-slate-300 border-white/10';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-600 gap-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <span className="font-black uppercase tracking-[0.3em] text-xs text-slate-500 text-center">A carregar rede de elite...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans relative overflow-hidden">
            {/* Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* HEADER */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                        <Globe size={12} fill="currentColor" /> Global Tactical Network
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-4">
                        Elite <span className="text-red-600">Community</span>
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto font-bold uppercase tracking-widest text-xs">
                        Explora exercícios de treinadores certificados e expande o teu arsenal tático.
                    </p>
                </div>

                {/* SEARCH */}
                <div className="max-w-2xl mx-auto mb-20 relative group">
                    <div className="absolute -inset-1 bg-red-600 rounded-full blur opacity-10 group-focus-within:opacity-25 transition"></div>
                    <Search className="absolute left-5 top-4 text-slate-600" size={20} />
                    <input
                        type="text"
                        placeholder="PESQUISAR TÁTICAS NA REDE..."
                        className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-full py-4 pl-14 pr-6 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-red-600/50 transition shadow-2xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredDrills.length === 0 ? (
                    <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border border-white/5 border-dashed">
                        <Zap size={48} className="mx-auto text-slate-800 mb-4" />
                        <h3 className="text-xl text-slate-500 font-black uppercase italic">Rede em silêncio...</h3>
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-2">Partilha a tua primeira tática pública no Dashboard.</p>
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
                                    className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-red-600/30 transition-all duration-300 group flex flex-col shadow-2xl"
                                >
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getCategoryColor(drill.category)}`}>
                                                {drill.category || 'Geral'}
                                            </span>
                                            <span className="text-slate-600 text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                {new Date(drill.created_at).toLocaleDateString('pt-PT')}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6 line-clamp-2 group-hover:text-red-500 transition-colors">
                                            {drill.title}
                                        </h3>

                                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/20">
                                                    <Shield size={18} fill="currentColor" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Criado por</p>
                                                    <p className="text-sm text-white font-black italic uppercase tracking-tight">{drill.author_name || 'Coach'}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => toggleLike(drill.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-90 ${likeData.isLiked ? 'bg-red-600 border-transparent text-white' : 'bg-slate-950 border-white/5 text-slate-500 hover:text-white'}`}
                                            >
                                                <Heart size={16} className={likeData.isLiked ? 'fill-white' : ''} />
                                                <span className="text-xs font-black">{likeData.count}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* FOOTER ACTIONS */}
                                    <div className="flex bg-slate-950/50 border-t border-white/5 p-2 gap-2">
                                        <Link href={`/dashboard/tatica?id=${drill.id}`} className="flex-1">
                                            <button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                                <Layout size={14} /> Ver Tática
                                            </button>
                                        </Link>

                                        {!isMine ? (
                                            <button
                                                onClick={() => cloneDrill(drill)}
                                                disabled={isCloning || isCloned}
                                                className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                    isCloned
                                                        ? 'bg-red-600/10 text-red-500'
                                                        : 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20'
                                                }`}
                                            >
                                                {isCloning ? (
                                                    <><Loader2 size={14} className="animate-spin" /> ...</>
                                                ) : isCloned ? (
                                                    <><CheckCircle2 size={14} /> Guardado</>
                                                ) : (
                                                    <><Copy size={14} /> Clonar</>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="flex-1 h-12 text-[8px] font-black uppercase tracking-widest text-slate-700 flex items-center justify-center bg-slate-950/30 rounded-2xl cursor-not-allowed">
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