'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase';
import {
    Plus,
    Search,
    Trash2,
    Edit,
    Save,
    X,
    Dumbbell,
    PlayCircle,
    ExternalLink,
    Video,
    Upload,
    FileVideo,
    Loader2,
    ArrowLeft,
    Zap,
    Trophy,
} from 'lucide-react';
import Link from 'next/link';

interface Drill {
    id: string;
    name: string;
    category: string;
    difficulty: string;
    description: string;
    video_url?: string;
    user_id: string;
}

export default function DrillsPage() {
    const supabase = useMemo(() => createClient(), []);

    const [drills, setDrills] = useState<Drill[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');

    const [formData, setFormData] = useState<Partial<Drill>>({
        name: '',
        category: 'Técnica',
        difficulty: 'Iniciado',
        description: '',
        video_url: '',
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [videoSource, setVideoSource] = useState<'link' | 'upload'>('link');

    useEffect(() => {
        let isMounted = true;

        const fetchDrills = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (error || !session?.user) {
                    setLoading(false);
                    return;
                }

                const user = session.user;
                const { data, error: drillsError } = await supabase
                    .from('drills')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('name', { ascending: true });

                if (isMounted && data) setDrills(data as Drill[]);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDrills();
        return () => { isMounted = false; };
    }, [supabase]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
        setUploading(true);

        try {
            const { error: uploadError } = await supabase.storage
                .from('drill-videos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('drill-videos').getPublicUrl(fileName);
            setFormData((prev) => ({ ...prev, video_url: data.publicUrl }));
        } catch (error: any) {
            alert('Erro no upload de vídeo.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            let cleanUrl = formData.video_url?.trim() || '';
            if (cleanUrl && !cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

            const payload = { ...formData, video_url: cleanUrl, user_id: session.user.id };

            if (editingId) {
                await supabase.from('drills').update(payload).eq('id', editingId);
            } else {
                await supabase.from('drills').insert(payload);
            }

            setShowModal(false);
            const { data } = await supabase.from('drills').select('*').eq('user_id', session.user.id).order('name', { ascending: true });
            if (data) setDrills(data as Drill[]);
        } catch (e) {
            alert('Erro ao guardar alteração.');
        }
    };

    const deleteDrill = async (id: string) => {
        if (!confirm('Eliminar este exercício do teu arsenal tático?')) return;
        const { error } = await supabase.from('drills').delete().eq('id', id);
        if (!error) setDrills(drills.filter((d) => d.id !== id));
    };

    const filtered = drills.filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'Todas' || d.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getDifficultyColor = (diff: string) => {
        if (diff === 'Avançado') return 'bg-red-600 text-white';
        if (diff === 'Intermédio') return 'bg-amber-500 text-slate-950';
        return 'bg-slate-800 text-slate-400';
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-600 gap-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <span className="font-black uppercase tracking-[0.3em] text-xs text-slate-500">Acedendo à Base de Dados Elite...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-white font-sans relative overflow-hidden">
            {/* Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="p-3 bg-slate-900 border border-white/5 text-slate-400 hover:text-red-500 rounded-2xl transition-all active:scale-90">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                                ARSENAL <span className="text-red-600">TÁTICO</span>
                            </h1>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Biblioteca de Exercícios de Performance</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setEditingId(null); setFormData({ name: '', category: 'Técnica', difficulty: 'Iniciado', description: '', video_url: '' }); setShowModal(true); }}
                        className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Plus size={20} /> Novo Exercício
                    </button>
                </div>

                {/* FILTERS BAR */}
                <div className="space-y-6 mb-12">
                    <div className="max-w-2xl relative group">
                        <div className="absolute -inset-1 bg-red-600 rounded-full blur opacity-10 group-focus-within:opacity-25 transition"></div>
                        <Search className="absolute left-5 top-4 text-slate-600" size={20} />
                        <input
                            type="text"
                            placeholder="PROCURAR NO TEU ARSENAL..."
                            className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-full py-4 pl-14 pr-6 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-red-600/50 transition shadow-2xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {['Todas', 'Técnica', 'Tática', 'Físico', 'Jogos'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                    filterCategory === cat
                                        ? 'bg-red-600 border-transparent text-white shadow-lg shadow-red-900/20'
                                        : 'bg-slate-900 text-slate-500 border-white/5 hover:border-slate-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DRILLS GRID */}
                {filtered.length === 0 ? (
                    <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border border-white/5 border-dashed">
                        <Dumbbell size={48} className="mx-auto text-slate-800 mb-4" />
                        <h3 className="text-xl text-slate-500 font-black uppercase italic">Arsenal Vazio</h3>
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-2">Adiciona exercícios com vídeo para estruturar as tuas aulas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((drill) => (
                            <div
                                key={drill.id}
                                className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 hover:border-red-600/30 transition-all duration-300 group relative shadow-2xl flex flex-col"
                            >
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setFormData(drill); setEditingId(drill.id); setShowModal(true); }} className="p-2 bg-slate-950 text-blue-400 rounded-lg border border-white/5 hover:bg-blue-600 hover:text-white transition">
                                        <Edit size={14} />
                                    </button>
                                    <button onClick={() => deleteDrill(drill.id)} className="p-2 bg-slate-950 text-red-500 rounded-lg border border-white/5 hover:bg-red-600 hover:text-white transition">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-4 bg-slate-950 rounded-2xl text-red-600 border border-white/5 shadow-inner">
                                            <Trophy size={24} fill="currentColor" className="opacity-20" />
                                        </div>
                                        <div>
                                            <h3 className="font-black italic uppercase text-lg leading-tight text-white group-hover:text-red-500 transition-colors">
                                                {drill.name}
                                            </h3>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 border border-white/5 px-2 py-0.5 rounded-md">
                                                    {drill.category}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm ${getDifficultyColor(drill.difficulty)}`}>
                                                    {drill.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-xs font-bold leading-relaxed line-clamp-3 mb-6 italic">
                                        "{drill.description || 'Sem análise técnica disponível.'}"
                                    </p>
                                </div>

                                {drill.video_url && (
                                    <div className="mt-4 pt-6 border-t border-white/5">
                                        <a
                                            href={drill.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                        >
                                            <PlayCircle size={16} /> Ver Demonstração Vídeo
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL ELITE */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                        <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] w-full max-w-xl border border-white/5 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                                    {editingId ? 'EDITAR' : 'NOVO'} <span className="text-red-600">INPUT</span>
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 bg-slate-950 text-slate-500 hover:text-white rounded-xl transition-all active:scale-90">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block tracking-widest">Nome da Sequência</label>
                                    <input required type="text" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="EX: VOLEI DE ATAQUE - PARALELA" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block tracking-widest">Categoria Técnica</label>
                                        <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none appearance-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                            <option>Técnica</option><option>Tática</option><option>Físico</option><option>Jogos</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block tracking-widest">Grau de Exigência</label>
                                        <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none appearance-none cursor-pointer" value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}>
                                            <option>Iniciado</option><option>Intermédio</option><option>Avançado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-950 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-inner">
                                    <div className="flex gap-4 border-b border-white/5 pb-4">
                                        <button type="button" onClick={() => setVideoSource('link')} className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${videoSource === 'link' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-600 hover:text-slate-400'}`}>Link Externo</button>
                                        <button type="button" onClick={() => setVideoSource('upload')} className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${videoSource === 'upload' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-600 hover:text-slate-400'}`}>Upload MP4</button>
                                    </div>

                                    {videoSource === 'link' ? (
                                        <input type="url" placeholder="URL VÍDEO (YOUTUBE / INSTAGRAM)" className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-xs text-white font-bold focus:border-red-600 outline-none" value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} />
                                    ) : (
                                        <div className="relative">
                                            <input type="file" accept="video/*" onChange={handleFileUpload} disabled={uploading} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-[10px] text-slate-500 file:bg-red-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-1 file:mr-4 file:font-black transition-all" />
                                            {uploading && <Loader2 className="absolute right-4 top-4 animate-spin text-red-600" size={18} />}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block tracking-widest">Análise Técnica do Exercício</label>
                                    <textarea rows={4} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none resize-none placeholder:text-slate-800" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="DESCREVE A EXECUÇÃO TÁCTICA E OBJECTIVOS..." />
                                </div>

                                <button type="submit" disabled={uploading} className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest py-5 rounded-2xl flex justify-center items-center gap-3 shadow-xl shadow-red-900/20 active:scale-[0.98] transition-all">
                                    <Save size={18} fill="currentColor" /> {uploading ? 'A PROCESSAR DADOS...' : 'GUARDAR NO ARSENAL'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}