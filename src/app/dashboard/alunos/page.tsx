'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import { User, Plus, Search, Trash2, Phone, Save, X } from 'lucide-react';

export default function StudentsPage() {
    const supabase = createClient();

    // Estados
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');

    // Form para novo aluno
    const [newStudent, setNewStudent] = useState({
        name: '', level: 'Iniciado', notes: '', phone: '', dominant_hand: 'Direita'
    });

    // Carregar Alunos
    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true });

        if (data) setStudents(data);
        setLoading(false);
    };

    const addStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('students').insert({
            ...newStudent,
            user_id: user.id
        });

        if (error) alert(error.message);
        else {
            setShowModal(false);
            setNewStudent({ name: '', level: 'Iniciado', notes: '', phone: '', dominant_hand: 'Direita' });
            fetchStudents(); // Recarregar lista
        }
    };

    const deleteStudent = async (id: string) => {
        if(!confirm('Apagar este aluno?')) return;
        await supabase.from('students').delete().eq('id', id);
        setStudents(students.filter(s => s.id !== id));
    };

    // Filtragem
    const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="p-10 text-white text-center">A carregar carteira de alunos...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-6xl mx-auto">

                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Os Meus Alunos</h1>
                        <p className="text-slate-400">Gere níveis, notas e contactos dos teus atletas.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition"
                    >
                        <Plus size={20} /> Novo Aluno
                    </button>
                </div>

                {/* Pesquisa */}
                <div className="relative mb-8">
                    <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                    <input
                        type="text" placeholder="Pesquisar aluno..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 focus:border-green-500 outline-none"
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Lista de Cartões */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(s => (
                        <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition group relative">
                            <button
                                onClick={() => deleteStudent(s.id)}
                                className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{s.name}</h3>
                                    <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300 border border-slate-600">
                    Nível: {s.level}
                  </span>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                    Mão: <span className="text-white">{s.dominant_hand}</span>
                                </div>
                                {s.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} />
                                        <span>{s.phone}</span>
                                    </div>
                                )}
                            </div>

                            {s.notes && (
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Notas:</p>
                                    <p className="text-sm italic text-slate-300 line-clamp-2">"{s.notes}"</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* MODAL ADICIONAR ALUNO */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Adicionar Aluno</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X /></button>
                            </div>

                            <form onSubmit={addStudent} className="space-y-4">
                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-400">Nome</label>
                                    <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                           value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400">Nível</label>
                                        <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                                value={newStudent.level} onChange={e => setNewStudent({...newStudent, level: e.target.value})}>
                                            <option>Iniciado</option>
                                            <option>Intermédio (M4)</option>
                                            <option>Avançado (M3)</option>
                                            <option>Competição (M2/M1)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400">Mão Dominante</label>
                                        <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                                value={newStudent.dominant_hand} onChange={e => setNewStudent({...newStudent, dominant_hand: e.target.value})}>
                                            <option>Direita</option>
                                            <option>Esquerda</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-400">Telemóvel (Opcional)</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                           value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                                </div>

                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-400">Notas Privadas</label>
                                    <textarea rows={3} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white resize-none"
                                              placeholder="Ex: Lesão no joelho, precisa melhorar volei..."
                                              value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} />
                                </div>

                                <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-lg flex justify-center items-center gap-2 mt-2">
                                    <Save size={18} /> Guardar Ficha
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}