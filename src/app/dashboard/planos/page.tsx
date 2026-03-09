'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase';
import {
    Layers, Plus, Trash2, Calendar, CheckSquare, Square, FileDown, Loader2, ArrowUp, ArrowDown, X, Zap, Trophy, ChevronRight,
} from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import Link from 'next/link';

const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
        const data = await fetch(url);
        const blob = await data.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result as string);
        });
    } catch (e) {
        console.error('Erro converter img', e);
        return '';
    }
};

export default function PlansPage() {
    const supabase = useMemo(() => createClient(), []);

    const [plans, setPlans] = useState<any[]>([]);
    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [coachName, setCoachName] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

    const [newPlanTitle, setNewPlanTitle] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [selectedDrills, setSelectedDrills] = useState<string[]>([]);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (error || !session?.user) {
                    setLoading(false);
                    return;
                }

                const user = session.user;
                setCoachName(user.user_metadata?.full_name || 'Treinador');

                const { data: plansData } = await supabase
                    .from('plans')
                    .select('*, plan_items(position, drill:drills(title, category, description, image_url, video_url))')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                const { data: drillsData } = await supabase
                    .from('drills')
                    .select('id, title, category')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (!isMounted) return;

                if (plansData) {
                    plansData.forEach((plan: any) => {
                        if (plan.plan_items) {
                            plan.plan_items.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                        }
                    });
                    setPlans(plansData);
                }
                if (drillsData) setDrills(drillsData);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [supabase]);

    const moveDrill = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...selectedDrills];
        if (direction === 'up' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }
        setSelectedDrills(newOrder);
    };

    const toggleDrillSelection = (id: string) => {
        if (selectedDrills.includes(id)) {
            setSelectedDrills(selectedDrills.filter((d) => d !== id));
        } else {
            setSelectedDrills([...selectedDrills, id]);
        }
    };

    const getDrillTitle = (id: string) => drills.find((d) => d.id === id)?.title || 'Desconhecido';

    const createPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: plan, error: insertError } = await supabase
                .from('plans')
                .insert({ title: newPlanTitle, description: newPlanDesc, user_id: session.user.id })
                .select().single();

            if (insertError) throw insertError;

            if (selectedDrills.length > 0) {
                const itemsToInsert = selectedDrills.map((drillId, index) => ({
                    plan_id: plan.id,
                    drill_id: drillId,
                    position: index,
                }));
                await supabase.from('plan_items').insert(itemsToInsert);
            }

            window.location.reload();
        } catch (e) {
            alert('Erro ao criar plano.');
        }
    };

    const deletePlan = async (id: string) => {
        if (!confirm('Apagar este plano estratégico?')) return;
        const { error } = await supabase.from('plans').delete().eq('id', id);
        if (!error) setPlans(plans.filter((p) => p.id !== id));
    };

    const downloadPlanPDF = async (plan: any) => {
        setIsGeneratingPdf(plan.id);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;

            doc.setFontSize(24);
            doc.setTextColor(185, 28, 28); // Next Level Red
            doc.text(plan.title || 'Plano de Treino', 20, yPos);
            yPos += 8;
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`NEXT LEVEL COACH - ELITE PERFORMANCE • ${coachName}`, 20, yPos);

            if (plan.description) {
                yPos += 12;
                doc.setFontSize(11);
                doc.setTextColor(51, 65, 85);
                doc.text(plan.description, 20, yPos, { maxWidth: 170 });
            }
            yPos += 15;
            doc.setDrawColor(220, 38, 38);
            doc.line(20, yPos, pageWidth - 20, yPos);
            yPos += 15;

            if (plan.plan_items && plan.plan_items.length > 0) {
                for (let i = 0; i < plan.plan_items.length; i++) {
                    const item = plan.plan_items[i];
                    const drill = item.drill;
                    if (yPos > 230) { doc.addPage(); yPos = 20; }

                    doc.setFontSize(14);
                    doc.setTextColor(15, 23, 42);
                    doc.text(`${i + 1}. ${drill.title}`, 20, yPos);
                    doc.setFontSize(9);
                    doc.setTextColor(185, 28, 28);
                    doc.text(drill.category?.toUpperCase() || 'GERAL', 20, yPos + 6);
                    yPos += 12;

                    let textX = 20;
                    let textAreaWidth = 170;

                    if (drill.image_url) {
                        try {
                            const imgData = await getBase64FromUrl(drill.image_url);
                            if (imgData) {
                                doc.addImage(imgData, 'PNG', 20, yPos, 45, 80);
                                textX = 70; textAreaWidth -= 55;
                            }
                        } catch (err) { console.error(err); }
                    }

                    if (drill.video_url) {
                        try {
                            const qrDataUrl = await QRCode.toDataURL(drill.video_url, { margin: 1 });
                            const qrSize = 35;
                            const qrX = pageWidth - 20 - qrSize;
                            doc.addImage(qrDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
                            doc.setFontSize(8); doc.setTextColor(100, 116, 139);
                            doc.text('VIDEO DEMO ▶', qrX + qrSize / 2, yPos + qrSize + 4, { align: 'center' });
                            textAreaWidth -= qrSize + 5;
                        } catch (err) { console.error('Erro QR', err); }
                    }

                    doc.setFontSize(10); doc.setTextColor(71, 85, 105);
                    const lines = doc.splitTextToSize(drill.description || 'Sem notas.', textAreaWidth);
                    doc.text(lines, textX, yPos + 5);
                    const blockHeight = Math.max(lines.length * 5 + 20, drill.image_url ? 90 : 0, drill.video_url ? 50 : 0);
                    yPos += blockHeight;
                }
            }
            doc.save(`Plano_${plan.title.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            alert('Erro ao gerar PDF.');
        } finally {
            setIsGeneratingPdf(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-600 gap-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <span className="font-black uppercase tracking-[0.3em] text-xs text-slate-500">A processar alinhamento...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-white font-sans relative overflow-hidden">
            {/* Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                            PLANOS DE <span className="text-red-600">TREINO</span>
                        </h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Estratégia e Narrativa Técnica</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 active:scale-95">
                        <Plus size={20} /> Criar Plano
                    </button>
                </div>

                {plans.length === 0 ? (
                    <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border border-white/5 border-dashed">
                        <Layers size={48} className="mx-auto text-slate-800 mb-4" />
                        <h3 className="text-xl text-slate-500 font-black uppercase italic">Sem planos ativos</h3>
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-2">Começa a estruturar as tuas sessões elite.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div key={plan.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-red-600/30 transition-all duration-300 group shadow-2xl">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-slate-950 rounded-xl text-red-600 border border-white/5 shadow-inner">
                                            <Calendar size={20} />
                                        </div>
                                        <button onClick={() => deletePlan(plan.id)} className="text-slate-700 hover:text-red-500 p-2 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2 group-hover:text-red-500 transition-colors">{plan.title}</h3>
                                    <p className="text-xs font-bold text-slate-500 mb-6 line-clamp-2 italic leading-relaxed">"{plan.description || 'Sessão sem notas estratégicas.'}"</p>

                                    <div className="bg-slate-950 rounded-2xl p-5 border border-white/5 mb-6">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
                                            <Trophy size={10} className="text-red-600" /> Sequência de Aula ({plan.plan_items?.length})
                                        </p>
                                        <div className="space-y-3">
                                            {plan.plan_items?.slice(0, 4).map((item: any, i: number) => (
                                                <div key={i} className="text-[10px] font-bold text-slate-400 flex items-center gap-3 group/item">
                                                    <span className="text-red-600/50 font-black w-4">{i + 1}.</span>
                                                    <span className="truncate group-hover/item:text-white transition-colors">{item.drill?.title}</span>
                                                </div>
                                            ))}
                                            {plan.plan_items?.length > 4 && <div className="text-[9px] text-slate-600 pl-7 font-black">... +{plan.plan_items.length - 4} EXERCÍCIOS</div>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => downloadPlanPDF(plan)} disabled={isGeneratingPdf === plan.id} className="w-full bg-slate-800 hover:bg-red-600 text-white font-black uppercase italic tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 text-[10px]">
                                    {isGeneratingPdf === plan.id ? <Loader2 size={16} className="animate-spin" /> : <><FileDown size={16} /> Exportar PDF Aula</>}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL CRIAR PLANO */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                        <div className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-[3rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">CRIAR <span className="text-red-600">SESSÃO</span></h2>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Alinhamento Estratégico</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 bg-slate-950 text-slate-500 hover:text-white rounded-xl transition-all"><X size={24} /></button>
                            </div>

                            <form onSubmit={createPlan} className="flex-1 flex overflow-hidden">
                                <div className="w-1/2 p-8 overflow-y-auto no-scrollbar border-r border-white/5 space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Detalhes da Aula</label>
                                        <input required type="text" placeholder="TÍTULO (EX: PADEL ELITE - VOLUME 1)" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none" value={newPlanTitle} onChange={(e) => setNewPlanTitle(e.target.value)} />
                                        <textarea rows={2} placeholder="OBJECTIVOS TÁCTICOS..." className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold focus:border-red-600 outline-none resize-none" value={newPlanDesc} onChange={(e) => setNewPlanDesc(e.target.value)} />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Biblioteca de Exercícios</label>
                                        <div className="space-y-2">
                                            {drills.map((drill) => {
                                                const isSelected = selectedDrills.includes(drill.id);
                                                return (
                                                    <div key={drill.id} onClick={() => toggleDrillSelection(drill.id)} className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${isSelected ? 'bg-red-600/10 border-red-600' : 'bg-slate-950 border-white/5 hover:border-slate-700'}`}>
                                                        <div className="flex items-center gap-4 overflow-hidden">
                                                            {isSelected ? <CheckSquare className="text-red-600 shrink-0" size={20} /> : <Square className="text-slate-800 shrink-0" size={20} />}
                                                            <div className="truncate">
                                                                <p className={`font-black italic uppercase text-xs ${isSelected ? 'text-white' : 'text-slate-500'}`}>{drill.title}</p>
                                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">{drill.category}</p>
                                                            </div>
                                                        </div>
                                                        {isSelected && <Zap size={14} className="text-red-600 fill-red-600" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-1/2 p-8 bg-slate-950/50 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Alinhamento da Sessão</label>
                                        <span className="text-[10px] font-black bg-red-600 text-white px-3 py-1 rounded-lg italic">{selectedDrills.length} EXERCÍCIOS</span>
                                    </div>

                                    {selectedDrills.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-800 border-2 border-dashed border-white/5 rounded-[2rem]">
                                            <Zap size={32} className="mb-3 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Seleciona à esquerda</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                                            {selectedDrills.map((drillId, index) => (
                                                <div key={drillId} className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-white/5 shadow-xl group/drill">
                                                    <div className="flex flex-col gap-1">
                                                        <button type="button" onClick={() => moveDrill(index, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-800 rounded text-slate-600 hover:text-red-500 disabled:opacity-0 transition-all"><ArrowUp size={16} /></button>
                                                        <button type="button" onClick={() => moveDrill(index, 'down')} disabled={index === selectedDrills.length - 1} className="p-1 hover:bg-slate-800 rounded text-slate-600 hover:text-red-500 disabled:opacity-0 transition-all"><ArrowDown size={16} /></button>
                                                    </div>
                                                    <span className="font-black italic text-2xl text-red-600/20 w-8 text-center">{index + 1}</span>
                                                    <div className="flex-1 truncate"><p className="font-black italic uppercase text-xs text-white truncate">{getDrillTitle(drillId)}</p></div>
                                                    <button type="button" onClick={() => toggleDrillSelection(drillId)} className="text-slate-700 hover:text-red-500 transition-colors"><X size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <button type="submit" className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-xl shadow-red-900/20 text-sm flex justify-center items-center gap-3">
                                            <Trophy size={20} /> Finalizar Plano Elite
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}