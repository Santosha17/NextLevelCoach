'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

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
    const supabase = createClient();

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
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error || !session?.user) {
                    console.error('Sem sessão em DrillsPage:', error);
                    setLoading(false);
                    return;
                }

                const user = session.user;

                const { data, error: drillsError } = await supabase
                    .from('drills')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('name', { ascending: true });

                if (!isMounted) return;

                if (drillsError) {
                    console.error('Erro a carregar drills:', drillsError);
                }

                if (data) setDrills(data as Drill[]);
            } catch (e) {
                console.error('Erro inesperado em DrillsPage:', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDrills();

        return () => {
            isMounted = false;
        };
    }, [supabase]);

    const filtered = drills.filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
            filterCategory === 'Todas' || d.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);

        try {
            const { error: uploadError } = await supabase.storage
                .from('drill-videos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('drill-videos')
                .getPublicUrl(filePath);

            setFormData((prev) => ({ ...prev, video_url: data.publicUrl }));
            alert('Vídeo carregado com sucesso!');
        } catch (error: any) {
            console.error('Erro no upload:', error);
            alert('Erro no upload: ' + (error.message || 'Ocorreu um erro.'));
        } finally {
            setUploading(false);
        }
    };

    const handleOpenCreate = () => {
        setFormData({
            name: '',
            category: 'Técnica',
            difficulty: 'Iniciado',
            description: '',
            video_url: '',
        });
        setEditingId(null);
        setVideoSource('link');
        setShowModal(true);
    };

    const handleOpenEdit = (drill: Drill) => {
        setFormData(drill);
        setEditingId(drill.id);
        if (drill.video_url?.includes('supabase')) {
            setVideoSource('upload');
        } else {
            setVideoSource('link');
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error || !session?.user) {
                alert('Sessão inválida. Faz login novamente.');
                return;
            }

            const user = session.user;

            let cleanVideoUrl = formData.video_url?.trim() || '';
            if (cleanVideoUrl && !cleanVideoUrl.startsWith('http')) {
                cleanVideoUrl = `https://${cleanVideoUrl}`;
            }

            const payload = {
                ...formData,
                video_url: cleanVideoUrl,
                user_id: user.id,
            };

            if (editingId) {
                const { error: updateError } = await supabase
                    .from('drills')
                    .update(payload)
                    .eq('id', editingId);
                if (updateError) {
                    alert('Erro: ' + updateError.message);
                    return;
                }
            } else {
                const { error: insertError } = await supabase
                    .from('drills')
                    .insert(payload);
                if (insertError) {
                    alert('Erro: ' + insertError.message);
                    return;
                }
            }

            setShowModal(false);

            // Recarregar lista
            setLoading(true);
            const { data, error: drillsError } = await supabase
                .from('drills')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (drillsError) {
                console.error('Erro a recarregar drills:', drillsError);
            }
            if (data) setDrills(data as Drill[]);
        } catch (e) {
            console.error('Erro ao guardar exercício:', e);
            alert('Erro ao guardar exercício.');
        } finally {
            setLoading(false);
        }
    };

    const deleteDrill = async (id: string) => {
        if (!confirm('Apagar este exercício?')) return;
        const { error } = await supabase.from('drills').delete().eq('id', id);
        if (error) {
            alert('Erro ao apagar exercício.');
            return;
        }
        setDrills(drills.filter((d) => d.id !== id));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
                <Loader2 className="animate-spin" /> A carregar exercícios...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Biblioteca de Exercícios</h1>
                        <p className="text-slate-400">
                            Cria a tua base de dados de treinos com vídeo.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-500/20"
                    >
                        <Plus size={20} /> Novo Exercício
                    </button>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-3.5 text-slate-500"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Pesquisar exercício..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 focus:border-green-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['Todas', 'Técnica', 'Tática', 'Físico', 'Jogos'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition whitespace-nowrap ${
                                    filterCategory === cat
                                        ? 'bg-green-500 text-slate-900 border-green-500'
                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((drill) => (
                        <div
                            key={drill.id}
                            className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition group relative shadow-lg flex flex-col h-full"
                        >
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenEdit(drill)}
                                    className="p-1.5 bg-slate-700 text-blue-400 rounded hover:bg-slate-600"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => deleteDrill(drill.id)}
                                    className="p-1.5 bg-slate-700 text-red-400 rounded hover:bg-slate-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-slate-700/50 rounded-lg text-green-500">
                                        <Dumbbell size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">
                                            {drill.name}
                                        </h3>
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider border border-slate-700 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {drill.category} • {drill.difficulty}
                    </span>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                                    {drill.description}
                                </p>
                            </div>

                            {drill.video_url && (
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <a
                                        href={drill.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-bold transition"
                                    >
                                        <PlayCircle size={16} className="text-green-500" />
                                        Ver Demonstração
                                        <ExternalLink size={12} className="opacity-50" />
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                                <h2 className="text-2xl font-bold">
                                    {editingId ? 'Editar Exercício' : 'Novo Exercício'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                                        Nome
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                                            Categoria
                                        </label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                                            value={formData.category}
                                            onChange={(e) =>
                                                setFormData({ ...formData, category: e.target.value })
                                            }
                                        >
                                            <option>Técnica</option>
                                            <option>Tática</option>
                                            <option>Físico</option>
                                            <option>Jogos</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                                            Dificuldade
                                        </label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                                            value={formData.difficulty}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    difficulty: e.target.value,
                                                })
                                            }
                                        >
                                            <option>Iniciado</option>
                                            <option>Intermédio</option>
                                            <option>Avançado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                    <div className="flex gap-4 mb-4 border-b border-slate-700 pb-2">
                                        <button
                                            type="button"
                                            onClick={() => setVideoSource('link')}
                                            className={`text-sm font-bold pb-2 transition ${
                                                videoSource === 'link'
                                                    ? 'text-green-500 border-b-2 border-green-500'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Link Externo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVideoSource('upload')}
                                            className={`text-sm font-bold pb-2 transition ${
                                                videoSource === 'upload'
                                                    ? 'text-green-500 border-b-2 border-green-500'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Upload Vídeo
                                        </button>
                                    </div>

                                    {videoSource === 'link' ? (
                                        <div>
                                            <label className="text-xs uppercase font-bold text-slate-400 block mb-1 flex items-center gap-2">
                                                <Video
                                                    size={14}
                                                    className="text-green-500"
                                                />{' '}
                                                Link YouTube / Vimeo
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://youtube.com/..."
                                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                                                value={formData.video_url}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        video_url: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-xs uppercase font-bold text-slate-400 block mb-1 flex items-center gap-2">
                                                <Upload
                                                    size={14}
                                                    className="text-green-500"
                                                />{' '}
                                                Carregar da Galeria
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading}
                                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                                                />
                                                {uploading && (
                                                    <div className="absolute right-3 top-3">
                                                        <Loader2 className="animate-spin text-green-500" />
                                                    </div>
                                                )}
                                            </div>
                                            {formData.video_url &&
                                                formData.video_url.includes('supabase') && (
                                                    <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                                                        <FileVideo size={12} /> Vídeo carregado com sucesso!
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        rows={4}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none resize-none"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50"
                                >
                                    <Save size={18} />{' '}
                                    {uploading ? 'A carregar vídeo...' : 'Guardar Exercício'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
