'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase';
import { Layers, Plus, Trash2, Calendar, CheckSquare, Square, FileDown, Loader2, ArrowUp, ArrowDown, X } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode'; // <--- BIBLIOTECA NOVA

// --- HELPERS ---
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
        console.error("Erro converter img", e);
        return "";
    }
};

export default function PlansPage() {
    const supabase = createClient();

    // Estados
    const [plans, setPlans] = useState<any[]>([]);
    const [drills, setDrills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [coachName, setCoachName] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

    // Estados do Novo Plano
    const [newPlanTitle, setNewPlanTitle] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [selectedDrills, setSelectedDrills] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setCoachName(user.user_metadata?.full_name || 'Treinador');

        // Buscar Planos
        // IMPORTANTE: Adicionei 'video_url' na query dos drills dentro do plano
        const { data: plansData } = await supabase
            .from('plans')
            .select('*, plan_items(position, drill:drills(title, category, description, image_url, video_url))')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        // Buscar Táticas
        const { data: drillsData } = await supabase
            .from('drills')
            .select('id, title, category')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        // ORDENAÇÃO NO FRONTEND
        if (plansData) {
            plansData.forEach(plan => {
                if (plan.plan_items) {
                    plan.plan_items.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                }
            });
            setPlans(plansData);
        }

        if (drillsData) setDrills(drillsData);
        setLoading(false);
    };

    // --- FUNÇÕES DE ORDENAÇÃO ---
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
            setSelectedDrills(selectedDrills.filter(d => d !== id));
        } else {
            setSelectedDrills([...selectedDrills, id]);
        }
    };

    const getDrillTitle = (id: string) => drills.find(d => d.id === id)?.title || 'Desconhecido';

    // --- CRIAR PLANO ---
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
            const itemsToInsert = selectedDrills.map((drillId, index) => ({
                plan_id: plan.id,
                drill_id: drillId,
                position: index
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
        if (!confirm('Apagar este plano?')) return;
        await supabase.from('plans').delete().eq('id', id);
        setPlans(plans.filter(p => p.id !== id));
    };

    // --- GERAR PDF COM QR CODE ---
    const downloadPlanPDF = async (plan: any) => {
        setIsGeneratingPdf(plan.id);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
            let yPos = 20;

            // Cabeçalho
            doc.setFontSize(24); doc.setTextColor(15, 23, 42);
            doc.text(plan.title || 'Plano de Treino', 20, yPos);
            yPos += 8;
            doc.setFontSize(10); doc.setTextColor(100, 116, 139);
            doc.text(`Coach Next Level - Sessão Técnica • ${coachName}`, 20, yPos);

            if (plan.description) {
                yPos += 12; doc.setFontSize(11); doc.setTextColor(51, 65, 85);
                doc.text(plan.description, 20, yPos, { maxWidth: 170 });
            }
            yPos += 15; doc.setDrawColor(203, 213, 225); doc.line(20, yPos, pageWidth - 20, yPos); yPos += 15;

            // Loop pelos Exercícios
            if (plan.plan_items && plan.plan_items.length > 0) {
                for (let i = 0; i < plan.plan_items.length; i++) {
                    const item = plan.plan_items[i];
                    const drill = item.drill;

                    // Nova página se não couber (ajuste de margem de segurança)
                    if (yPos > 230) { doc.addPage(); yPos = 20; }

                    // 1. Título e Categoria
                    doc.setFontSize(14); doc.setTextColor(15, 23, 42);
                    doc.text(`${i + 1}. ${drill.title}`, 20, yPos);
                    doc.setFontSize(9); doc.setTextColor(34, 197, 94);
                    doc.text(drill.category?.toUpperCase() || 'GERAL', 20, yPos + 6);
                    yPos += 12;

                    // 2. Layout (Imagem Esq | Texto Centro | QR Dir)
                    let textX = 20;
                    let textAreaWidth = 170; // Largura total disponível

                    // Se tiver Imagem (Lado Esquerdo)
                    if (drill.image_url) {
                        try {
                            const imgData = await getBase64FromUrl(drill.image_url);
                            if(imgData) {
                                doc.addImage(imgData, 'PNG', 20, yPos, 45, 80); // Imagem maior
                                doc.setDrawColor(226, 232, 240); doc.rect(20, yPos, 45, 80);
                                textX = 70; // Empurra texto para a direita
                                textAreaWidth -= 55;
                            }
                        } catch (err) { console.error(err); }
                    }

                    // Se tiver Vídeo (Lado Direito - QR Code)
                    if (drill.video_url) {
                        try {
                            // Gera QR Code
                            const qrDataUrl = await QRCode.toDataURL(drill.video_url, { margin: 1 });
                            const qrSize = 35;
                            const qrX = pageWidth - 20 - qrSize; // Encostado à direita

                            doc.addImage(qrDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);

                            // Link clicável no PDF (caso seja digital)
                            doc.link(qrX, yPos, qrSize, qrSize, { url: drill.video_url });

                            // Texto "SCAN ME"
                            doc.setFontSize(8); doc.setTextColor(100, 116, 139);
                            doc.text("VER VÍDEO ▶", qrX + (qrSize/2), yPos + qrSize + 4, { align: 'center' });

                            // Ajusta largura do texto para não bater no QR Code
                            textAreaWidth -= (qrSize + 5);

                        } catch (err) { console.error("Erro QR", err); }
                    }

                    // 3. Descrição (Texto)
                    doc.setFontSize(10); doc.setTextColor(71, 85, 105);
                    const desc = drill.description || 'Sem notas técnicas.';
                    const lines = doc.splitTextToSize(desc, textAreaWidth);
                    doc.text(lines, textX, yPos + 5);

                    // 4. Calcular altura do bloco para o próximo item
                    const textHeight = (lines.length * 5) + 20;
                    const imgHeight = drill.image_url ? 90 : 0;
                    const qrHeight = drill.video_url ? 50 : 0;

                    // A altura do bloco é o maior elemento (Texto, Img ou QR)
                    const blockHeight = Math.max(textHeight, imgHeight, qrHeight);

                    // Linha separadora suave
                    doc.setDrawColor(241, 245, 249);
                    doc.line(20, yPos + blockHeight - 5, pageWidth - 20, yPos + blockHeight - 5);

                    yPos += blockHeight;
                }
            } else {
                doc.setFontSize(10); doc.text('Sem exercícios neste plano.', 20, yPos);
            }

            // Rodapé
            const pageCount = doc.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
                doc.text(`Página ${i} de ${pageCount} • Gerado por Coach Next Level`, pageWidth / 2, 290, { align: 'center' });
            }
            doc.save(`Plano_${plan.title.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar PDF. Verifica se tens exercícios com links válidos.');
        }
        finally { setIsGeneratingPdf(null); }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-500 animate-pulse">A carregar...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Planos de Treino</h1>
                        <p className="text-slate-400">Cria a narrativa perfeita para a tua aula.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-500/20">
                        <Plus size={20} /> <span className="hidden sm:inline">Criar Plano</span>
                    </button>
                </div>

                {/* Lista de Planos */}
                {plans.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                        <Layers size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Sem planos criados</h3>
                        <p className="text-slate-400">Começa por criar a tua primeira sessão estruturada.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-between hover:border-green-500/50 transition shadow-lg">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-slate-700 rounded-lg text-slate-300"><Calendar size={20} /></div>
                                        <button onClick={() => deletePlan(plan.id)} className="text-slate-600 hover:text-red-400 p-1 hover:bg-slate-700 rounded"><Trash2 size={18} /></button>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{plan.title}</h3>
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[40px]">{plan.description || 'Sem descrição.'}</p>

                                    {/* Preview Ordenado */}
                                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 mb-4">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Sequência ({plan.plan_items?.length})</p>
                                        <div className="space-y-1">
                                            {plan.plan_items?.slice(0, 4).map((item: any, i: number) => (
                                                <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
                                                    <span className="text-slate-600 font-mono w-4">{i + 1}.</span>
                                                    <span className="truncate">{item.drill?.title}</span>
                                                </div>
                                            ))}
                                            {plan.plan_items?.length > 4 && <div className="text-[10px] text-slate-500 pl-6 italic">...e mais {plan.plan_items.length - 4}</div>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => downloadPlanPDF(plan)} disabled={isGeneratingPdf === plan.id} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition text-sm mt-2">
                                    {isGeneratingPdf === plan.id ? <Loader2 size={18} className="animate-spin" /> : <><FileDown size={18} /> PDF Aula</>}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL MAIOR PARA ORDENAÇÃO */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                            {/* Header Modal */}
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                                <h2 className="text-xl font-bold text-white">Criar Nova Sessão</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                            </div>

                            <form onSubmit={createPlan} className="flex-1 flex overflow-hidden">

                                {/* LADO ESQUERDO: Setup & Escolha */}
                                <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-700 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs uppercase font-bold text-slate-400">Detalhes da Aula</label>
                                        <input required type="text" placeholder="Título (ex: Padel Avançado - Vol. 2)" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none" value={newPlanTitle} onChange={e => setNewPlanTitle(e.target.value)} />
                                        <textarea rows={2} placeholder="Objetivos..." className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none resize-none" value={newPlanDesc} onChange={e => setNewPlanDesc(e.target.value)} />
                                    </div>

                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-400 mb-2 block">Biblioteca de Exercícios</label>
                                        <div className="space-y-2">
                                            {drills.map(drill => {
                                                const isSelected = selectedDrills.includes(drill.id);
                                                return (
                                                    <div key={drill.id} onClick={() => toggleDrillSelection(drill.id)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${isSelected ? 'bg-green-500/10 border-green-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            {isSelected ? <CheckSquare className="text-green-500 shrink-0" size={18} /> : <Square className="text-slate-500 shrink-0" size={18} />}
                                                            <div className="truncate">
                                                                <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-400'}`}>{drill.title}</p>
                                                                <p className="text-[10px] text-slate-500 uppercase">{drill.category}</p>
                                                            </div>
                                                        </div>
                                                        {isSelected && <span className="text-xs font-bold text-green-500 bg-green-500/20 px-2 py-0.5 rounded">Selecionado</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* LADO DIREITO: Ordenação */}
                                <div className="w-1/2 p-6 bg-slate-900/50 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs uppercase font-bold text-slate-400">Alinhamento da Sessão</label>
                                        <span className="text-xs font-bold bg-green-500 text-slate-900 px-2 py-1 rounded-full">{selectedDrills.length} Exercícios</span>
                                    </div>

                                    {selectedDrills.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-700 rounded-xl">
                                            <Layers size={32} className="mb-2 opacity-50" />
                                            <p className="text-sm">Seleciona exercícios à esquerda</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                            {selectedDrills.map((drillId, index) => (
                                                <div key={drillId} className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-600 shadow-sm animate-in slide-in-from-left-2">
                                                    <div className="flex flex-col gap-1">
                                                        <button type="button" onClick={() => moveDrill(index, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-20 transition"><ArrowUp size={14} /></button>
                                                        <button type="button" onClick={() => moveDrill(index, 'down')} disabled={index === selectedDrills.length - 1} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-20 transition"><ArrowDown size={14} /></button>
                                                    </div>
                                                    <span className="font-mono text-xl font-bold text-slate-600 w-6 text-center">{index + 1}</span>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-white text-sm">{getDrillTitle(drillId)}</p>
                                                    </div>
                                                    <button type="button" onClick={() => toggleDrillSelection(drillId)} className="text-slate-500 hover:text-red-400 p-2"><X size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-6 pt-4 border-t border-slate-700">
                                        <button type="submit" className="w-full py-4 bg-green-500 hover:bg-green-400 text-slate-900 rounded-xl font-bold transition shadow-lg shadow-green-500/20 text-lg flex justify-center items-center gap-2">
                                            <CheckSquare size={20} /> Finalizar Plano
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