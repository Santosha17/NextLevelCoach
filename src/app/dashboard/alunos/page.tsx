'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import {
    User, Plus, Search, Trash2, Phone, Save, X,
    MessageCircle, Edit, Zap, Inbox, Activity
} from 'lucide-react';

// Interface atualizada com todas as skills e campos em Inglês
interface Student {
    id: string;
    name: string;
    level: string;
    notes: string;
    phone: string;
    dominant_hand: string;
    // Baseline Skills (Fundo)
    skill_forehand: number;
    skill_backhand: number;
    skill_defense: number;
    skill_lob: number;
    skill_chiquita: number;
    // Net Skills (Rede)
    skill_volley: number;
    skill_smash: number;
    skill_bandeja: number;
    skill_vibora: number;
}

export default function StudentsPage() {
    const supabase = createClient();

    // --- STATES ---
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');

    // Estado do Formulário (Valores padrão 3/5)
    const [formData, setFormData] = useState<Partial<Student>>({
        name: '', level: 'Beginner', notes: '', phone: '', dominant_hand: 'Right',
        skill_forehand: 3, skill_backhand: 3, skill_defense: 3, skill_lob: 3, skill_chiquita: 3,
        skill_volley: 3, skill_smash: 3, skill_bandeja: 3, skill_vibora: 3
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    // --- FETCH DATA ---
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

    // --- FILTERING ---
    const filtered = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchesLevel = filterLevel === 'All' || s.level.includes(filterLevel);
        return matchesSearch && matchesLevel;
    });

    // --- CRUD OPERATIONS ---

    // Reset form for New Player
    const handleOpenCreate = () => {
        setFormData({
            name: '', level: 'Beginner', notes: '', phone: '', dominant_hand: 'Right',
            skill_forehand: 3, skill_backhand: 3, skill_defense: 3, skill_lob: 3, skill_chiquita: 3,
            skill_volley: 3, skill_smash: 3, skill_bandeja: 3, skill_vibora: 3
        });
        setEditingId(null);
        setShowModal(true);
    };

    // Load data for Editing
    const handleOpenEdit = (student: Student) => {
        setFormData(student);
        setEditingId(student.id);
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (editingId) {
            // Update
            const { error } = await supabase.from('students').update(formData).eq('id', editingId);
            if (error) alert('Error: ' + error.message);
        } else {
            // Insert
            const { error } = await supabase.from('students').insert({ ...formData, user_id: user.id });
            if (error) alert('Error: ' + error.message);
        }
        setShowModal(false);
        fetchStudents();
    };

    const deleteStudent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this player?')) return;
        await supabase.from('students').delete().eq('id', id);
        setStudents(students.filter(s => s.id !== id));
    };

    // Helper Component for Star Display
    const StarRating = ({ value }: { value: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className={`w-1.5 h-1.5 rounded-full ${star <= value ? 'bg-green-500' : 'bg-slate-700'}`} />
            ))}
        </div>
    );

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 animate-pulse">Loading players...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Player Management</h1>
                        <p className="text-slate-400">Manage technical skills and contacts.</p>
                    </div>
                    <button onClick={handleOpenCreate} className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-500/20">
                        <Plus size={20} /> New Player
                    </button>
                </div>

                {/* Filters */}
                <div className="space-y-4 mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 text-slate-500" size={20} />
                        <input type="text" placeholder="Search by name..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 focus:border-green-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['All', 'Beginner', 'M5', 'M4', 'M3', 'M2', 'M1'].map(level => (
                            <button key={level} onClick={() => setFilterLevel(level)} className={`px-4 py-2 rounded-full text-sm font-bold border transition whitespace-nowrap ${filterLevel === level ? 'bg-green-500 text-slate-900 border-green-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed"><Inbox size={48} className="mx-auto text-slate-600 mb-4" /><p className="text-slate-400">No players found.</p></div>
                )}

                {/* Grid de Cartões */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(s => (
                        <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-green-500/50 transition group relative shadow-lg flex flex-col justify-between">

                            {/* Hover Actions */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {s.phone && <a href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="p-1.5 bg-slate-700 text-green-500 rounded hover:bg-slate-600"><MessageCircle size={16} /></a>}
                                <button onClick={() => handleOpenEdit(s)} className="p-1.5 bg-slate-700 text-blue-400 rounded hover:bg-slate-600"><Edit size={16} /></button>
                                <button onClick={() => deleteStudent(s.id)} className="p-1.5 bg-slate-700 text-red-400 rounded hover:bg-slate-600"><Trash2 size={16} /></button>
                            </div>

                            <div>
                                {/* Avatar e Nome */}
                                <div className="flex items-center gap-4 mb-4 pr-16">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-green-500/20">
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight truncate">{s.name}</h3>
                                        <span className="text-[10px] uppercase font-bold text-green-500 tracking-wider">{s.level}</span>
                                    </div>
                                </div>

                                {/* Skills Grid (9 items) */}
                                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 mb-4">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        {[
                                            { l: 'Forehand', v: s.skill_forehand },
                                            { l: 'Backhand', v: s.skill_backhand },
                                            { l: 'Defense', v: s.skill_defense },
                                            { l: 'Lob', v: s.skill_lob },
                                            { l: 'Chiquita', v: s.skill_chiquita },
                                            { l: 'Volley', v: s.skill_volley },
                                            { l: 'Bandeja', v: s.skill_bandeja },
                                            { l: 'Vibora', v: s.skill_vibora },
                                            { l: 'Smash', v: s.skill_smash },
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-[10px] text-slate-400">
                                                <span>{item.l}</span>
                                                <StarRating value={item.v || 0} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="pt-3 border-t border-slate-700/50 flex flex-col gap-1">
                                <div className="text-[10px] text-slate-500 flex justify-between">
                                    {/* Handle displaying 'Direita/Esquerda' or 'Right/Left' gracefully */}
                                    <span>Hand: <span className="text-slate-300">{s.dominant_hand === 'Direita' ? 'Right' : (s.dominant_hand === 'Esquerda' ? 'Left' : s.dominant_hand)}</span></span>
                                    {s.phone && <span>{s.phone}</span>}
                                </div>
                                {s.notes && <p className="text-xs italic text-slate-400 line-clamp-1 mt-1">"{s.notes}"</p>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* MODAL EDIT/CREATE */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-3xl border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                                <h2 className="text-2xl font-bold">{editingId ? 'Edit Player' : 'New Player'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Informação Básica */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Name</label>
                                        <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Level</label>
                                        <select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                                            <option>Beginner</option> <option>M5</option> <option>M4</option> <option>M3</option> <option>M2</option> <option>M1</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Hand</label>
                                        <select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none" value={formData.dominant_hand} onChange={e => setFormData({ ...formData, dominant_hand: e.target.value })}>
                                            <option value="Right">Right</option> <option value="Left">Left</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Phone</label>
                                        <input type="tel" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>

                                {/* SKILLS SECTION - Dividida em 2 Grupos */}
                                <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                        {/* Baseline Game */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-green-500 uppercase flex items-center gap-2"><Activity size={14}/> Baseline Game</h3>
                                            {[
                                                { label: 'Forehand', key: 'skill_forehand' },
                                                { label: 'Backhand', key: 'skill_backhand' },
                                                { label: 'Defense', key: 'skill_defense' },
                                                { label: 'Lob', key: 'skill_lob' },
                                                { label: 'Chiquita', key: 'skill_chiquita' },
                                            ].map((skill) => (
                                                <div key={skill.key}>
                                                    <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{skill.label}</span><span className="text-white font-bold">{(formData as any)[skill.key]}/5</span></div>
                                                    <input type="range" min="1" max="5" className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500" value={(formData as any)[skill.key] || 3} onChange={e => setFormData({ ...formData, [skill.key]: parseInt(e.target.value) })} />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Net & Aerials */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-yellow-500 uppercase flex items-center gap-2"><Zap size={14}/> Net & Aerials</h3>
                                            {[
                                                { label: 'Volley', key: 'skill_volley' },
                                                { label: 'Bandeja', key: 'skill_bandeja' },
                                                { label: 'Vibora', key: 'skill_vibora' },
                                                { label: 'Smash', key: 'skill_smash' }
                                            ].map((skill) => (
                                                <div key={skill.key}>
                                                    <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{skill.label}</span><span className="text-white font-bold">{(formData as any)[skill.key]}/5</span></div>
                                                    <input type="range" min="1" max="5" className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500" value={(formData as any)[skill.key] || 3} onChange={e => setFormData({ ...formData, [skill.key]: parseInt(e.target.value) })} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Notes</label>
                                    <textarea rows={2} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none resize-none" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                </div>

                                <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-green-500/20">
                                    <Save size={18} /> {editingId ? 'Update Player' : 'Save New Player'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}