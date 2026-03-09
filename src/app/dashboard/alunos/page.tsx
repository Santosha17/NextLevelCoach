'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase';
import {
    Plus,
    Search,
    Trash2,
    User,
    Phone,
    MessageCircle,
    Save,
    X,
    FileText,
    Loader2,
    Zap,
    ArrowLeft,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Student {
    id: string;
    name: string;
    level: string;
    contact: string;
    notes: string;
}

export default function StudentsPage() {
    const supabase = useMemo(() => createClient(), []);

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        level: 'M5',
        contact: '',
        notes: '',
    });

    useEffect(() => {
        let isMounted = true;

        const fetchStudents = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (error || !session?.user) {
                    setLoading(false);
                    return;
                }

                const user = session.user;
                const { data, error: studentsError } = await supabase
                    .from('students')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('name', { ascending: true });

                if (!isMounted) return;
                if (data) setStudents(data as Student[]);
            } catch (e) {
                console.error('Erro em StudentsPage:', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStudents();
        return () => { isMounted = false; };
    }, [supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session?.user) return;

            const user = session.user;
            const { error: insertError } = await supabase
                .from('students')
                .insert({ ...formData, user_id: user.id });

            if (insertError) throw insertError;

            setFormData({ name: '', level: 'M5', contact: '', notes: '' });
            setShowModal(false);

            // Recarregar lista
            const { data } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (data) setStudents(data as Student[]);
        } catch (e) {
            alert('Erro ao guardar aluno.');
        }
    };

    const deleteStudent = async (id: string) => {
        if (!confirm('Apagar este aluno permanentemente?')) return;
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (!error) setStudents(students.filter((s) => s.id !== id));
    };

    const filtered = students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const getLevelColor = (level: string) => {
        if (['M1', 'M2'].includes(level)) return 'bg-red-600 text-white shadow-red-900/40';
        if (['M3', 'M4'].includes(level)) return 'bg-blue-600 text-white shadow-blue-900/40';
        return 'bg-slate-700 text-slate-300';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-600 gap-4">
                <Loader2 className="animate-spin w-10 h-10" />
                <span className="font-black uppercase tracking-[0.3em] text-xs text-slate-500 text-center">A recrutar talentos...</span>
            </div>
        );
    }

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
                                GESTÃO DE <span className="text-red-600">ALUNOS</span>
                            </h1>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Roster de Performance</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Plus size={20} /> Novo Aluno
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div className="max-w-2xl mb-10 relative group">
                    <div className="absolute -inset-1 bg-red-600 rounded-full blur opacity-10 group-focus-within:opacity-20 transition"></div>
                    <Search className="absolute left-5 top-4 text-slate-600" size={20} />
                    <input
                        type="text"
                        placeholder="PROCURAR ALUNO NA BASE DE DADOS..."
                        className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-full py-4 pl-14 pr-6 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-red-600/50 transition shadow-2xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border border-white/5 border-dashed">
                        <User size={48} className="mx-auto text-slate-800 mb-4" />
                        <h3 className="text-xl text-slate-500 font-black uppercase italic">Roster Vazio</h3>
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-2">Começa a registar os teus jogadores elite.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filtered.map((student) => (
                            <div
                                key={student.id}
                                className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 hover:border-red-600/30 transition-all duration-300 group relative shadow-2xl flex flex-col justify-between"
                            >
                                <button
                                    onClick={() => deleteStudent(student.id)}
                                    className="absolute top-6 right-6 text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-red-600 font-black italic text-xl border border-white/5 shadow-inner">
                                        {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black italic uppercase text-lg leading-none text-white truncate max-w-[140px]">
                                            {student.name}
                                        </h3>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-2 inline-block shadow-lg ${getLevelColor(student.level)}`}>
                                            Nível {student.level}
                                        </span>
                                    </div>
                                </div>

                                {student.notes && (
                                    <div className="bg-slate-950/50 p-4 rounded-2xl mb-6 border border-white/5">
                                        <p className="text-[10px] text-slate-500 font-bold flex gap-3 italic leading-relaxed">
                                            <FileText size={14} className="shrink-0 text-red-600" />
                                            <span className="line-clamp-2">{student.notes}</span>
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    {student.contact ? (
                                        <>
                                            <a
                                                href={`tel:${student.contact}`}
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition"
                                            >
                                                <Phone size={14} /> Ligar
                                            </a>
                                            <a
                                                href={`https://wa.me/${student.contact.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg shadow-red-900/10"
                                            >
                                                <MessageCircle size={14} /> WhatsApp
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-[9px] text-slate-700 uppercase font-black tracking-widest w-full text-center py-3">
                                            Sem contacto registado
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL DE ADIÇÃO */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                        <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] w-full max-w-lg border border-white/5 shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
                            {/* Modal Decor Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full" />

                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">NOVO <span className="text-red-600">JOGADOR</span></h2>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Registo de Atleta</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 bg-slate-950 text-slate-500 hover:text-white rounded-xl transition-all active:scale-90">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block tracking-widest">Nome Completo</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="EX: JOÃO SILVA"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block tracking-widest">Nível de Jogo</label>
                                        <select
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none appearance-none transition-all cursor-pointer"
                                            value={formData.level}
                                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        >
                                            <option>Iniciado</option>
                                            <option>M5</option>
                                            <option>M4</option>
                                            <option>M3</option>
                                            <option>M2</option>
                                            <option>M1</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block tracking-widest">Telemóvel</label>
                                        <input
                                            type="text"
                                            placeholder="9XX XXX XXX"
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none transition-all"
                                            value={formData.contact}
                                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block tracking-widest">Análise / Histórico Clínico</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none resize-none transition-all placeholder:text-slate-800"
                                        value={formData.notes}
                                        placeholder="LESÕES, PONTOS FORTES, OBJECTIVOS..."
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest py-5 rounded-2xl flex justify-center items-center gap-3 shadow-xl shadow-red-900/20 mt-4 active:scale-[0.98] transition-all"
                                >
                                    <Save size={18} fill="currentColor" /> Guardar Atleta
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}