'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

interface Student {
    id: string;
    name: string;
    level: string;
    contact: string;
    notes: string;
}

export default function StudentsPage() {
    const supabase = createClient();

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
                // CORREÇÃO: Usar getSession() em vez de getUser()
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error || !session?.user) {
                    console.error('Sem sessão em StudentsPage:', error);
                    // Se quiseres obrigar login:
                    // router.push('/login');
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

                if (studentsError) {
                    console.error('Erro a carregar alunos:', studentsError);
                }

                if (data) setStudents(data as Student[]);
            } catch (e) {
                console.error('Erro inesperado em StudentsPage:', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStudents();

        return () => {
            isMounted = false;
        };
    }, [supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // CORREÇÃO: Usar getSession() aqui também para garantir que não falha ao gravar
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error || !session?.user) {
                alert('Sessão inválida. Faz login novamente.');
                return;
            }

            const user = session.user;

            const { error: insertError } = await supabase
                .from('students')
                .insert({ ...formData, user_id: user.id });

            if (insertError) {
                alert('Erro: ' + insertError.message);
                return;
            }

            setFormData({ name: '', level: 'M5', contact: '', notes: '' });
            setShowModal(false);

            // Atualizar lista sem reload total da página
            setLoading(true);
            const { data, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (studentsError) {
                console.error('Erro a recarregar alunos:', studentsError);
            }
            if (data) setStudents(data as Student[]);
        } catch (e) {
            console.error('Erro ao guardar aluno:', e);
            alert('Erro ao guardar aluno.');
        } finally {
            setLoading(false);
        }
    };

    const deleteStudent = async (id: string) => {
        if (!confirm('Apagar este aluno?')) return;
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) {
            alert('Erro ao apagar aluno.');
            return;
        }
        setStudents(students.filter((s) => s.id !== id));
    };

    const filtered = students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 gap-2">
                <Loader2 className="animate-spin" /> A carregar alunos...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Os Meus Alunos</h1>
                        <p className="text-slate-400">Gere contactos e níveis de jogo.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-500/20"
                    >
                        <Plus size={20} /> Novo Aluno
                    </button>
                </div>

                <div className="relative mb-8">
                    <Search
                        className="absolute left-3 top-3.5 text-slate-500"
                        size={20}
                    />
                    <input
                        type="text"
                        placeholder="Procurar aluno..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 focus:border-green-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        <User size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-400">
                            Ainda não tens alunos registados.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((student) => (
                            <div
                                key={student.id}
                                className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition group relative shadow-lg"
                            >
                                <button
                                    onClick={() => deleteStudent(student.id)}
                                    className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-700 rounded"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-green-500 font-bold text-lg border border-slate-600">
                                        {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">
                                            {student.name}
                                        </h3>
                                        <span className="text-[10px] uppercase font-bold text-slate-900 bg-green-500 px-2 py-0.5 rounded inline-block mt-1">
                      {student.level}
                    </span>
                                    </div>
                                </div>

                                {student.notes && (
                                    <div className="bg-slate-900/50 p-3 rounded-lg mb-4 border border-slate-700/50">
                                        <p className="text-xs text-slate-400 flex gap-2">
                                            <FileText size={14} className="shrink-0" />
                                            <span className="line-clamp-2">{student.notes}</span>
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                                    {student.contact ? (
                                        <>
                                            <a
                                                href={`tel:${student.contact}`}
                                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                                            >
                                                <Phone size={16} /> Ligar
                                            </a>
                                            <a
                                                href={`https://wa.me/${student.contact.replace(
                                                    /[^0-9]/g,
                                                    ''
                                                )}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                                            >
                                                <MessageCircle size={16} /> WhatsApp
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-xs text-slate-500 w-full text-center py-2">
                                            Sem contacto
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                                <h2 className="text-xl font-bold">Novo Aluno</h2>
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
                                        Nome Completo
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
                                            Nível
                                        </label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                                            value={formData.level}
                                            onChange={(e) =>
                                                setFormData({ ...formData, level: e.target.value })
                                            }
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
                                        <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                                            Telemóvel
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="912 345 678"
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                                            value={formData.contact}
                                            onChange={(e) =>
                                                setFormData({ ...formData, contact: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                                        Notas / Lesões
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none resize-none"
                                        value={formData.notes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, notes: e.target.value })
                                        }
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-green-500/20 mt-2"
                                >
                                    <Save size={18} /> Guardar Aluno
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}