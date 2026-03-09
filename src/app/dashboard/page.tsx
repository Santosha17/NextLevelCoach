"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Trash2, Plus, Calendar, Search, Filter, User, Shield, Users, Layers, LayoutDashboard, Lock, ArrowRight, Loader2, Zap
} from "lucide-react";

const CATEGORIES = [
    "Todas", "Geral", "Aquecimento", "Ataque", "Defesa", "Saída de Parede", "Volei", "Bandeja/Víbora", "Jogo de Pés",
];

export default function Dashboard() {
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
                const { data: { session }, error: authError } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (authError || !session?.user) {
                    if (isMounted) router.push("/login");
                    return;
                }

                const currentUser = session.user;
                if (isMounted) setUser(currentUser);

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", currentUser.id)
                    .maybeSingle();

                if (isMounted && profile) {
                    setIsAdmin(profile.is_admin === true);
                    setIsCoach(profile.role === 'coach');
                }

                const [drillsRes, studentsRes, plansRes] = await Promise.all([
                    supabase.from("drills").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }),
                    supabase.from("students").select("id", { count: "exact", head: true }).eq("user_id", currentUser.id),
                    supabase.from("plans").select("id", { count: "exact", head: true }).eq("user_id", currentUser.id),
                ]);

                if (!isMounted) return;
                if (drillsRes.data) setDrills(drillsRes.data);

                setStats({
                    students: studentsRes.count || 0,
                    plans: plansRes.count || 0,
                });

            } catch (error) {
                console.error("Erro crítico no Dashboard:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getData();
        return () => { isMounted = false; };
    }, [router, supabase]);

    const deleteDrill = async (e: any, id: string) => {
        e.preventDefault();
        if (!confirm("Apagar esta tática definitiva?")) return;
        const { error } = await supabase.from("drills").delete().eq("id", id);
        if (!error) setDrills(drills.filter((d) => d.id !== id));
    };

    const filteredDrills = drills.filter((drill) => {
        const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "Todas" || (drill.category || "Geral") === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "Ataque": return "bg-red-600 text-white border-red-500";
            case "Defesa": return "bg-blue-600 text-white border-blue-500";
            case "Aquecimento": return "bg-amber-500 text-slate-950 border-amber-400";
            default: return "bg-slate-800 text-slate-300 border-white/10";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-600 gap-4">
                <Loader2 className="animate-spin w-10 h-10" />
                <span className="font-black uppercase tracking-[0.3em] text-xs text-slate-500">Next Level Coach</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* CABEÇALHO DENTRO DO DASHBOARD */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
                                Olá, <span className="text-red-600">{user?.user_metadata?.full_name?.split(" ")[0] || "Coach"}</span>
                            </h1>
                            {isAdmin && (
                                <Link href="/admin">
                                    <span className="px-3 py-1 bg-red-600/10 border border-red-600/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">Admin</span>
                                </Link>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                            Biblioteca: <span className="text-white">{drills.length} Exercícios</span>
                        </p>
                    </div>
                    <Link href="/dashboard/tatica">
                        <button className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 active:scale-95">
                            <Plus size={20} /> Nova Tática
                        </button>
                    </Link>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatsCard
                        href="/dashboard/alunos"
                        label="Meus Alunos"
                        value={stats.students}
                        icon={<Users size={24} />}
                        color="blue"
                        locked={!isCoach}
                    />
                    <StatsCard
                        href="/dashboard/planos"
                        label="Planos de Aula"
                        value={stats.plans}
                        icon={<Layers size={24} />}
                        color="purple"
                        locked={!isCoach}
                    />
                    <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-red-600/10 text-red-500 rounded-2xl">
                                <LayoutDashboard size={24} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Biblioteca</p>
                                <p className="text-3xl font-black text-white italic leading-none mt-1">{drills.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEARCH & FILTERS BAR */}
                <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 mb-10 sticky top-24 z-30 shadow-2xl">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative w-full lg:w-96">
                            <Search className="absolute left-4 top-3.5 text-slate-600" size={18} />
                            <input
                                type="text"
                                placeholder="PROCURAR TÁTICA..."
                                className="w-full bg-slate-950 border border-white/5 rounded-xl py-3.5 pl-12 text-xs font-bold text-white focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto w-full no-scrollbar pb-1">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                        selectedCategory === cat
                                            ? "bg-red-600 border-transparent text-white shadow-lg shadow-red-900/20"
                                            : "bg-slate-950 text-slate-500 border-white/5 hover:border-slate-700"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* DRILLS GRID */}
                {filteredDrills.length === 0 ? (
                    <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border border-white/5 border-dashed">
                        <Filter size={48} className="mx-auto text-slate-800 mb-4" />
                        <h3 className="text-xl text-slate-500 font-black uppercase italic">Sem resultados</h3>
                        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-2">Tenta outros filtros ou cria uma nova estratégia.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredDrills.map((drill) => (
                            <Link href={`/dashboard/tatica?id=${drill.id}`} key={drill.id} className="group">
                                <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-300 group-hover:border-red-600/30 group-hover:shadow-2xl group-hover:shadow-red-900/10 group-hover:-translate-y-2 h-full flex flex-col">

                                    {/* THUMBNAIL */}
                                    <div className="relative h-56 w-full bg-slate-950 flex items-center justify-center p-4 border-b border-white/5 overflow-hidden">
                                        {drill.image_url ? (
                                            <img src={drill.image_url} alt={drill.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 opacity-10">
                                                <Zap size={40} className="text-white" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${getCategoryColor(drill.category || "Geral")}`}>
                                                {drill.category || "Geral"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CONTENT */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <h3 className="text-lg font-black italic uppercase tracking-tight text-white leading-tight line-clamp-2 group-hover:text-red-500 transition-colors">
                                                {drill.title}
                                            </h3>
                                            <button
                                                onClick={(e) => deleteDrill(e, drill.id)}
                                                className="text-slate-700 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="mt-auto pt-6 flex justify-between items-center border-t border-white/5">
                                            <div className="flex items-center gap-2 text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                                                <Calendar size={12} /> {new Date(drill.created_at).toLocaleDateString("pt-PT")}
                                            </div>
                                            <span className="text-red-600 font-black italic text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                Editar →
                                            </span>
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

// SUB-COMPONENTE PARA CARTÕES DE ESTATÍSTICA
function StatsCard({ href, label, value, icon, color, locked }: any) {
    const colorClasses: any = {
        blue: "bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white",
        purple: "bg-indigo-600/10 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white",
    };

    const Container = ({ children }: any) => locked
        ? <div className="bg-slate-900/20 border border-white/5 p-6 rounded-[2rem] opacity-40 cursor-not-allowed">{children}</div>
        : <Link href={href} className="group h-full block">
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between transition-all group-hover:border-white/10 group-hover:bg-slate-900 h-full shadow-lg group-hover:shadow-black/40">
                {children}
            </div>
        </Link>;

    return (
        <Container>
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl transition-all duration-300 ${locked ? "bg-slate-800 text-slate-600" : colorClasses[color]}`}>
                    {locked ? <Lock size={24} /> : icon}
                </div>
                <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
                    <p className="text-3xl font-black text-white italic leading-none mt-1">
                        {locked ? "PRO" : value}
                    </p>
                </div>
            </div>
            {!locked && <ArrowRight className="text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />}
        </Container>
    );
}