'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase'; // Confirma se o caminho é este
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus, Calendar, Search, Filter, User, Shield, Users, Layers, LayoutDashboard } from 'lucide-react';

const CATEGORIES = ['Todas', 'Geral', 'Aquecimento', 'Ataque', 'Defesa', 'Saída de Parede', 'Volei', 'Bandeja/Víbora', 'Jogo de Pés'];

export default function Dashboard() {
    const supabase = createClient();
    const router = useRouter();

    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Estado para contagens (KPIs)
    const [stats, setStats] = useState({
        students: 0,
        plans: 0
    });

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

            // 1. Verificar Admin
            const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
            if (profile && profile.is_admin) setIsAdmin(true);

            // 2. Buscar Táticas, Contagem de Alunos e Contagem de Planos (Em paralelo)
            const [drillsRes, studentsRes, plansRes] = await Promise.all([
                // Buscar exercícios (precisamos dos dados todos para a lista)
                supabase
                    .from('drills')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),

                // Contar alunos (apenas o número)
                supabase
                    .from('students')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id),

                // Contar planos (apenas o número)
                supabase
                    .from('plans')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
            ]);

            if (drillsRes.data) setDrills(drillsRes.data);

            setStats({
                students: studentsRes.count || 0,
                plans: plansRes.count || 0
            });

            setLoading(false);
        };
        getData();
    }, []);

    const deleteDrill = async (e: any, id: string) => {
        e.preventDefault(); // Impede que abra a tática ao clicar no lixo
        if (!confirm('Tens a certeza que queres apagar esta tática?')) return;

        const { error } = await supabase.from('drills').delete().eq('id', id);
        if (error) {
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
            case 'Ataque': return 'bg-red-500/90 text-white border-red-500';
            case 'Defesa': return 'bg-blue-500/90 text-white border-blue-500';
            case 'Aquecimento': return 'bg-yellow-500/90 text-slate-900 border-yellow-500';
            default: return 'bg-slate-700/90 text-white border-slate-600';
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
                            <Link href="/dashboard/perfil">
                                <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 text-slate-400 hover:text-white transition" title="Editar Perfil">
                                    <User size={18} />
                                </button>
                            </Link>
                            {isAdmin && (
                                <Link href="/admin">
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider transition">
                                        <Shield size={14} /> Backoffice
                                    </button>
                                </Link>
                            )}
                        </div>
                        <p className="text-slate-400">Tens <span className="text-white font-bold">{drills.length}</span> exercícios criados.</p>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <Link href="/dashboard/alunos">
                            <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition border border-slate-700 shadow-lg">
                                <Users size={20} className="text-blue-400" /> <span className="hidden sm:inline">Alunos</span>
                            </button>
                        </Link>
                        <Link href="/dashboard/planos">
                            <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition border border-slate-700 shadow-lg">
                                <Layers size={20} className="text-purple-400" /> <span className="hidden sm:inline">Planos</span>
                            </button>
                        </Link>
                        <Link href="/dashboard/tatica">
                            <button className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-500/20">
                                <Plus size={20} /> <span className="hidden sm:inline">Nova Tática</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* --- KPIS / RESUMO RÁPIDO (NOVO BLOCO) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 hover:border-blue-500/50 transition">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Meus Alunos</p>
                            <p className="text-2xl font-black text-white">{stats.students}</p>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 hover:border-purple-500/50 transition">
                        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                            <Layers size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Planos de Aula</p>
                            <p className="text-2xl font-black text-white">{stats.plans}</p>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 hover:border-green-500/50 transition">
                        <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                            <LayoutDashboard size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Biblioteca</p>
                            <p className="text-2xl font-black text-white">{drills.length}</p>
                        </div>
                    </div>
                </div>

                {/* SEARCH BAR */}
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-8 space-y-4 sticky top-20 z-10 shadow-xl">
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
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition ${selectedCategory === cat ? 'bg-green-500 text-slate-900 border-green-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GRELHA DE TÁTICAS */}
                {filteredDrills.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                        <Filter size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl text-white font-bold mb-2">Nada encontrado</h3>
                        <p className="text-slate-400">Tenta mudar os filtros ou cria uma nova tática.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDrills.map((drill) => (
                            <Link href={`/dashboard/tatica?id=${drill.id}`} key={drill.id}>
                                <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-green-500/50 transition group flex flex-col hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 h-full">

                                    {/* 1. THUMBNAIL */}
                                    <div className="relative h-52 w-full bg-slate-900 border-b border-slate-700 group-hover:opacity-90 transition p-2">
                                        {drill.image_url ? (
                                            <img
                                                src={drill.image_url}
                                                alt={drill.title}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20">
                                                <LayoutDashboard size={40} className="text-slate-400" />
                                                <span className="text-xs text-slate-500">Sem pré-visualização</span>
                                            </div>
                                        )}

                                        <div className="absolute top-3 left-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-lg ${getCategoryColor(drill.category || 'Geral')}`}>
                                                {drill.category || 'Geral'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. INFO AREA */}
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-green-400 transition-colors">
                                                {drill.title}
                                            </h3>
                                            <button
                                                onClick={(e) => deleteDrill(e, drill.id)}
                                                className="text-slate-600 hover:text-red-400 transition p-1 hover:bg-slate-700 rounded"
                                                title="Apagar Tática"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="mt-auto pt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-700/50">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                {new Date(drill.created_at).toLocaleDateString('pt-PT')}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-green-500/80 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                ABRIR <span>→</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}