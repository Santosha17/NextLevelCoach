'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import { Layers, Plus, Trash2, Calendar, CheckSquare, Square, FileDown, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

export default function PlansPage() {
    const supabase = createClient();

    // Estados
    const [plans, setPlans] = useState<any[]>([]);
    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Estado do Novo Plano
    const [newPlanTitle, setNewPlanTitle] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [selectedDrills, setSelectedDrills] = useState<string[]>([]);

    // Carregar Dados
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Buscar Planos (com detalhes dos exercícios: titulo, categoria, descrição)
        const { data: plansData } = await supabase
            .from('plans')
            .select('*, plan_items(drill:drills(title, category, description))')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        // 2. Buscar Táticas para o Seletor
        const { data: drillsData } = await supabase
            .from('drills')
            .select('id, title, category')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (plansData) setPlans(plansData);
        if (drillsData) setDrills(drillsData);
        setLoading(false);
    };

    // --- GERAR PDF DA AULA ---
    const downloadPlanPDF = (plan: any) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20; // Posição vertical inicial

        // 1. Cabeçalho do Plano
        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text(plan.title || 'Plano de Treino', 20, yPos);

        yPos += 10;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Coach Next Level - Ficha de Sessão`, 20, yPos);

        if (plan.description) {
            yPos += 10;
            doc.setFontSize(11);
            doc.setTextColor(60);
            doc.text(plan.description, 20, yPos, { maxWidth: 170 });
        }

        yPos += 15;
        doc.setDrawColor(200);
        doc.line(20, yPos, pageWidth - 20, yPos); // Linha separadora
        yPos += 10;

        // 2. Listar Exercícios
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Estrutura da Sessão:', 20, yPos);
        yPos += 10;

        if (plan.plan_items && plan.plan_items.length > 0) {
            plan.plan_items.forEach((item: any, index: number) => {
                const drill = item.drill;

                // Verificar se cabe na página (se não, cria nova)
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                // Bloco do Exercício
                doc.setFillColor(245, 247, 250);
                doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');

                doc.setFontSize(12);
                doc.setTextColor(0);
                doc.text(`${index + 1}. ${drill.title}`, 20, yPos + 10);

                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text(`Categoria: ${drill.category || 'Geral'}`, 20, yPos + 16);

                // Descrição curta (corta se for muito grande)
                if (drill.description) {
                    const cleanDesc = drill.description.replace(/(\r\n|\n|\r)/gm, " "); // Remove quebras de linha
                    const shortDesc = cleanDesc.length > 120 ? cleanDesc.substring(0, 120) + '...' : cleanDesc;

                    doc.setTextColor(60);
                    doc.text(shortDesc, 20, yPos + 24, { maxWidth: 160 });
                }

                yPos += 40; // Espaço para o próximo
            });
        } else {
            doc.setFontSize(10);
            doc.text('Nenhum exercício selecionado.', 20, yPos);
        }

        // 3. Rodapé
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Gerado por Coach Next Level App', pageWidth / 2, 290, { align: 'center' });

        doc.save(`Plano_${plan.title}.pdf`);
    };

    // --- CRUD (Mantém-se igual) ---
    const createPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: plan, error } = await supabase
            .from('plans')
            .insert({ title: newPlanTitle, description: newPlanDesc, user_id: user.id })
            .select()
            .single();

        if (error) return alert(error.message);

        if (selectedDrills.length > 0) {
            const itemsToInsert = selectedDrills.map(drillId => ({
                plan_id: plan.id,
                drill_id: drillId
            }));
            await supabase.from('plan_items').insert(itemsToInsert);
        }

        setShowModal(false);
        setNewPlanTitle('');
        setNewPlanDesc('');
        setSelectedDrills([]);
        fetchData();
    };

    const deletePlan = async (id: string) => {
        if (!confirm('Apagar este plano de treino?')) return;
        await supabase.from('plans').delete().eq('id', id);
        setPlans(plans.filter(p => p.id !== id));
    };

    const toggleDrillSelection = (id: string) => {
        if (selectedDrills.includes(id)) {
            setSelectedDrills(selectedDrills.filter(d => d !== id));
        } else {
            setSelectedDrills([...selectedDrills, id]);
        }
    };

    if (loading) return <div className="p-10 text-white text-center">A carregar planeador...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-6xl mx-auto">

                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Planos de Treino</h1>
                        <p className="text-slate-400">Organiza as tuas táticas em sessões completas de aula.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition"
                    >
                        <Plus size={20} /> Criar Plano
                    </button>
                </div>

                {/* Lista de Planos */}
                {plans.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                        <Layers size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Sem planos criados</h3>
                        <p className="text-slate-400">Cria o teu primeiro plano de aula para agrupar exercícios.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition group flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Calendar size={24} />
                                        </div>
                                        <button onClick={() => deletePlan(plan.id)} className="text-slate-600 hover:text-red-400 transition">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                                    <p className="text-sm text-slate-400 mb-6 line-clamp-2">{plan.description || 'Sem descrição.'}</p>

                                    {/* Resumo dos exercícios */}
                                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 mb-4">
                                        <p className="text-xs uppercase font-bold text-slate-500 mb-2">Exercícios ({plan.plan_items?.length || 0})</p>
                                        <ul className="space-y-1">
                                            {plan.plan_items?.slice(0, 3).map((item: any, i: number) => (
                                                <li key={i} className="text-sm text-slate-300 flex items-center gap-2 truncate">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                                                    {item.drill?.title || 'Tática Apagada'}
                                                </li>
                                            ))}
                                            {plan.plan_items?.length > 3 && <li className="text-xs text-slate-500 pl-3 italic">e mais...</li>}
                                        </ul>
                                    </div>
                                </div>

                                {/* Botão PDF */}
                                <div className="pt-4 border-t border-slate-700">
                                    <button
                                        onClick={() => downloadPlanPDF(plan)}
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
                                    >
                                        <FileDown size={18} className="text-green-400" />
                                        Descarregar PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL CRIAR PLANO (Mantém-se igual) */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6">Novo Plano de Treino</h2>

                            <form onSubmit={createPlan} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400">Nome da Aula</label>
                                        <input required type="text" placeholder="Ex: Volei de Bloqueio - Nível 3"
                                               className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-green-500 outline-none"
                                               value={newPlanTitle} onChange={e => setNewPlanTitle(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400">Objetivo / Descrição</label>
                                        <textarea rows={2} placeholder="Objetivos da sessão..."
                                                  className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-green-500 outline-none resize-none"
                                                  value={newPlanDesc} onChange={e => setNewPlanDesc(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs uppercase font-bold text-slate-400 mb-2 block">Selecionar Exercícios ({selectedDrills.length})</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 bg-slate-900 rounded border border-slate-700">
                                        {drills.map(drill => (
                                            <div
                                                key={drill.id}
                                                onClick={() => toggleDrillSelection(drill.id)}
                                                className={`p-3 rounded border cursor-pointer flex items-center gap-3 transition ${selectedDrills.includes(drill.id) ? 'bg-green-500/20 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                            >
                                                {selectedDrills.includes(drill.id) ? <CheckSquare className="text-green-500 shrink-0" size={20} /> : <Square className="shrink-0" size={20} />}
                                                <div>
                                                    <p className="font-bold text-sm line-clamp-1">{drill.title}</p>
                                                    <p className="text-xs opacity-70">{drill.category}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold">Cancelar</button>
                                    <button type="submit" className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-slate-900 rounded-lg font-bold">Criar Plano</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}