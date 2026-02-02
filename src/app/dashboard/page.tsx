"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Trash2,
    Plus,
    Calendar,
    Search,
    Filter,
    User,
    Shield,
    Users,
    Layers,
    LayoutDashboard,
    Lock,
    ArrowRight,
    Loader2,
} from "lucide-react";

const CATEGORIES = [
    "Todas",
    "Geral",
    "Aquecimento",
    "Ataque",
    "Defesa",
    "Saída de Parede",
    "Volei",
    "Bandeja/Víbora",
    "Jogo de Pés",
];

export default function Dashboard() {
    // A chamada createClient() agora retorna a instância singleton estável
    const supabase = createClient();
    const router = useRouter();

    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCoach, setIsCoach] = useState(false);
    const [stats, setStats] = useState({ students: 0, plans: 0 });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todas");

    useEffect(() => {
        let isMounted = true;

        const getData = async () => {
            try {
                // 1. Verificar Sessão
                const {
                    data: { session },
                    error: authError,
                } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (authError || !session?.user) {
                    console.error("Sem sessão no Dashboard ou erro:", authError);
                    // Redirecionar e parar a execução aqui
                    if (isMounted) router.push("/login");
                    return;
                }

                const currentUser = session.user;
                if (isMounted) setUser(currentUser);

                // 2. Carregar Perfil para Permissões
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("is_admin, role")
                    .eq("id", currentUser.id)
                    .maybeSingle();

                if (profileError) {
                    console.error("Erro a carregar perfil:", profileError);
                }

                if (isMounted && profile) {
                    setIsAdmin(profile.is_admin === true);
                    setIsCoach(profile.role === "coach");
                }

                // 3. Carregar Dados em Paralelo (Drills, Alunos, Planos)
                const [drillsRes, studentsRes, plansRes] = await Promise.all([
                    supabase
                        .from("drills")
                        .select("*")
                        .eq("user_id", currentUser.id)
                        .order("created_at", { ascending: false }),
                    supabase
                        .from("students")
                        .select("id", { count: "exact", head: true })
                        .eq("user_id", currentUser.id),
                    supabase
                        .from("plans")
                        .select("id", { count: "exact", head: true })
                        .eq("user_id", currentUser.id),
                ]);

                if (!isMounted) return;

                // Processar resultados
                if (drillsRes.error) {
                    console.error("Erro a carregar drills:", drillsRes.error);
                } else if (drillsRes.data) {
                    setDrills(drillsRes.data);
                }

                if (studentsRes.error) console.error("Erro a carregar students:", studentsRes.error);
                if (plansRes.error) console.error("Erro a carregar plans:", plansRes.error);

                setStats({
                    students: studentsRes.count || 0,
                    plans: plansRes.count || 0,
                });

            } catch (error) {
                console.error("Erro crítico no Dashboard:", error);
            } finally {
                // Garante que o loading pára sempre, exceto se o componente desmontou
                if (isMounted) setLoading(false);
            }
        };

        getData();

        return () => {
            isMounted = false;
        };
    }, []); // Array vazio: corre apenas uma vez ao montar (ideal com singleton)

    // --- AÇÕES ---

    const deleteDrill = async (e: any, id: string) => {
        e.preventDefault();
        if (!confirm("Apagar esta tática?")) return;

        try {
            const { error } = await supabase.from("drills").delete().eq("id", id);
            if (error) {
                console.error("Erro ao apagar:", error);
                alert("Erro ao apagar tática.");
            } else {
                setDrills(drills.filter((d) => d.id !== id));
            }
        } catch (err) {
            console.error("Erro ao apagar:", err);
        }
    };

    // --- FILTROS E RENDERIZAÇÃO ---

    const filteredDrills = drills.filter((drill) => {
        const matchesSearch = drill.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "Todas" ||
            (drill.category || "Geral") === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "Ataque": return "bg-red-500/90 text-white border-red-500";
            case "Defesa": return "bg-blue-500/90 text-white border-blue-500";
            case "Aquecimento": return "bg-yellow-500/90 text-slate-900 border-yellow-500";
            default: return "bg-slate-700/90 text-white border-slate-600";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-green-500 gap-4">
                <Loader2 className="animate-spin w-10 h-10" />
                <p>A carregar...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white">
                                Olá, {user?.user_metadata?.full_name?.split(" ")[0] || "Treinador"}
                            </h1>
                            <Link href="/dashboard/perfil">
                                <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 text-slate-400 hover:text-white transition">
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
                        <p className="text-slate-400">
                            Tens <span className="text-white font-bold">{drills.length}</span>{" "}
                            exercícios na tua biblioteca.
                        </p>
                    </div>
                    <Link href="/dashboard/tatica">
                        <button className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-500/20 hover:-translate-y-1">
                            <Plus size={20} />{" "}
                            <span className="hidden sm:inline">Nova Tática</span>
                        </button>
                    </Link>
                </div>

                {/* Cartões */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Cartão de Alunos */}
                    {isCoach ? (
                        <Link href="/dashboard/alunos">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center justify-between hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition group cursor-pointer h-full">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition">
                                        <Users size={28} />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                                            Meus Alunos
                                        </p>
                                        <p className="text-3xl font-black text-white">
                                            {stats.students}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                            </div>
                        </Link>
                    ) : (
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4 opacity-60 cursor-not-allowed">
                            <div className="p-3 bg-slate-700 text-slate-500 rounded-xl">
                                <Lock size={28} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold">
                                    Alunos
                                </p>
                                <p className="text-sm text-slate-400 font-medium">
                                    Conta de Treinador
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Cartão de Planos */}
                    {isCoach ? (
                        <Link href="/dashboard/planos">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center justify-between hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition group cursor-pointer h-full">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl group-hover:scale-110 transition">
                                        <Layers size={28} />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                                            Planos de Aula
                                        </p>
                                        <p className="text-3xl font-black text-white">
                                            {stats.plans}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-600 group-hover:text-purple-500 group-hover:translate-x-1 transition" />
                            </div>
                        </Link>
                    ) : (
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4 opacity-60 cursor-not-allowed">
                            <div className="p-3 bg-slate-700 text-slate-500 rounded-xl">
                                <Lock size={28} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold">
                                    Planos
                                </p>
                                <p className="text-sm text-slate-400 font-medium">
                                    Conta de Treinador
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Cartão de Biblioteca */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center justify-between hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition group h-full">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:scale-110 transition">
                                <LayoutDashboard size={28} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                                    Biblioteca
                                </p>
                                <p className="text-3xl font-black text-white">
                                    {drills.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search e Filtros */}
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-8 space-y-4 sticky top-4 z-30 shadow-2xl shadow-black/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 text-white focus:outline-none focus:border-green-500 transition"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition ${
                                    selectedCategory === cat
                                        ? "bg-green-500 text-slate-900 border-green-500"
                                        : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de Drills */}
                {filteredDrills.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                        <Filter size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl text-white font-bold mb-2">
                            Nada encontrado
                        </h3>
                        <p className="text-slate-400">
                            Tenta mudar os filtros ou cria uma nova tática.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDrills.map((drill) => (
                            <Link href={`/dashboard/tatica?id=${drill.id}`} key={drill.id}>
                                <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-green-500/50 transition group flex flex-col hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 h-full">
                                    <div className="relative h-52 w-full bg-slate-900 border-b border-slate-700 group-hover:opacity-90 transition p-2">
                                        {drill.image_url ? (
                                            <img
                                                src={drill.image_url}
                                                alt={drill.title}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20">
                                                <LayoutDashboard
                                                    size={40}
                                                    className="text-slate-400"
                                                />
                                                <span className="text-xs text-slate-500">
                                                    Sem pré-visualização
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-lg ${getCategoryColor(drill.category || "Geral")}`}>
                                                {drill.category || "Geral"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-green-400 transition-colors">
                                                {drill.title}
                                            </h3>
                                            <button
                                                onClick={(e) => deleteDrill(e, drill.id)}
                                                className="text-slate-600 hover:text-red-400 transition p-1 hover:bg-slate-700 rounded"
                                                title="Apagar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="mt-auto pt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-700/50">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} />{" "}
                                                {new Date(drill.created_at).toLocaleDateString("pt-PT")}
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