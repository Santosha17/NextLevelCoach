'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus, Calendar, Search, Filter, User, Shield, Users, Layers } from 'lucide-react'; // <--- Adicionei Layers

const CATEGORIES = ['Todas', 'Geral', 'Aquecimento', 'Ataque', 'Defesa', 'Saída de Parede', 'Volei', 'Bandeja/Víbora', 'Jogo de Pés'];

export default function Dashboard() {
    const supabase = createClient();
    const router = useRouter();

    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Novo estado para saber se é Admin
    const [isAdmin, setIsAdmin] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            // 1. Verificar se é Admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (profile && profile.is_admin) {
                setIsAdmin(true);
            }

            // 2. Buscar Táticas
            const { data } = await supabase
                .from('drills')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setDrills(data);
            setLoading(false);
        };

        getData();
    }, []);

    const deleteDrill = async (id: string) => {
        if (!confirm('Tens a certeza que queres apagar esta tática?')) return;
        const { error } = await supabase.from('drills').delete().eq('id', id);
        if (error) {
            console.error('Erro ao apagar:', error);
            alert('Erro: ' + error.message);
        } else {
            setDrills(drills.filter(drill => drill.id !== id));
        }
    };

    const filteredDrills = drills.filter(drill => {
        const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todas' || (drill.category || 'Geral') === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (cat: string) => {
        switch(cat) {
            case 'Ataque': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'Defesa': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Aquecimento': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 animate-pulse">A carregar biblioteca...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">

                {/* CABEÇALHO */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white">Olá, {user?.user_metadata?.full_name || 'Treinador'}</h1>

                            {/* Link Perfil */}
                            <Link href="/dashboard/perfil">
                                <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 text-slate-400 hover:text-white transition" title="Editar Perfil">
                                    <User size={18} />
                                </button>
                            </Link>

                            {/* --- BOTÃO ADMIN (Só aparece se for Admin) --- */}
                            {isAdmin && (
                                <Link href="/admin">
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider transition">
                                        <Shield size={14} />
                                        <span>Backoffice</span>
                                    </button>
                                </Link>
                            )}

                            {/* Badge de Licença (Coach) */}
                            {user?.user_metadata?.role === 'coach' && (
                                <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    Licença: {user?.user_metadata?.license_number}
                                </div>
                            )}
                        </div>
                        <p className="text-slate-400">
                            Tens <span className="text-white font-bold">{drills.length}</span> exercícios criados.
                        </p>
                    </div>

                    {/* GRUPO DE BOTÕES DE AÇÃO */}
                    <div className="flex gap-3">

                        {/* 1. Botão Alunos */}
                        <Link href="/dashboard/alunos">
                            <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition border border-slate-700 shadow-lg">
                                <Users size={20} className="text-blue-400" />
                                <span>Alunos</span>
                            </button>
                        </Link>

                        {/* 2. Botão Planos (NOVO) */}
                        <Link href="/dashboard/planos">
                            <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition border border-slate-700 shadow-lg">
                                <Layers size={20} className="text-purple-400" />
                                <span>Planos</span>
                            </button>
                        </Link>

                        {/* 3. Botão Nova Tática */}
                        <Link href="/dashboard/tatica">
                            <button className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-500/20">
                                <Plus size={20} />
                                <span>Nova Tática</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* BARRA DE FERRAMENTAS */}
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-8 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 text-white focus:outline-none focus:border-green-500 transition"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                                    selectedCategory === cat
                                        ? 'bg-green-500 text-slate-900 border-green-500'
                                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GRELHA */}
                {filteredDrills.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                        <Filter size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl text-white font-bold mb-2">Nada encontrado</h3>
                        <p className="text-slate-400">Tenta mudar os filtros ou cria uma nova tática.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDrills.map((drill) => (
                            <div key={drill.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-green-500/50 transition group flex flex-col justify-between hover:shadow-xl hover:shadow-black/50">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getCategoryColor(drill.category || 'Geral')}`}>
                                            {drill.category || 'Geral'}
                                        </span>
                                        <button onClick={() => deleteDrill(drill.id)} className="text-slate-600 hover:text-red-400 transition p-1 opacity-0 group-hover:opacity-100">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{drill.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar size={12} />
                                        {new Date(drill.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 p-4 border-t border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs text-slate-400 font-mono">Pronto</span>
                                    </div>
                                    <Link href={`/dashboard/tatica?id=${drill.id}`}>
                                        <button className="text-sm font-bold text-green-400 hover:text-green-300 flex items-center gap-1">
                                            Abrir <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}