'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Circle, Arrow } from 'react-konva';
import {
    Undo,
    Trash2,
    Download,
    CloudUpload,
    Loader2,
    Check,
    Globe,
    Lock,
    Copy,
    PenTool,
    MoveRight,
    CircleDashed,
    FileText,
    AlertCircle,
    Share2
} from 'lucide-react';
import { createClient } from '@/src/lib/supabase';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toPng } from "html-to-image";

// --- INTERFACES E CONSTANTES ---
interface LineData { tool: string; points: number[]; color: string; }
interface PlayerData { id: string; x: number; y: number; color: string; }

const CATEGORIES = ['Geral', 'Aquecimento', 'Ataque', 'Defesa', 'Saída de Parede', 'Volei', 'Bandeja/Víbora', 'Jogo de Pés'];

// --- HELPERS ---
const dataURLToBlob = (dataURL: string) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) { uInt8Array[i] = raw.charCodeAt(i); }
    return new Blob([uInt8Array], { type: contentType });
};

const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
};

const PadelCourt = () => {
    const width = 360;
    const height = 720;
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [tacticName, setTacticName] = useState('');
    const [category, setCategory] = useState('Geral');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [lines, setLines] = useState<LineData[]>([]);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [drillOwnerId, setDrillOwnerId] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);

    const initialPlayers: PlayerData[] = [
        { id: 'p1', x: 90, y: 650, color: '#f97316' },
        { id: 'p2', x: 270, y: 650, color: '#f97316' },
        { id: 'p3', x: 90, y: 250, color: '#4ade80' },
        { id: 'p4', x: 270, y: 250, color: '#4ade80' },
        { id: 'ball', x: width / 2, y: height / 2, color: '#fbbf24' },
    ];
    const [players, setPlayers] = useState<PlayerData[]>(initialPlayers);

    const isDrawing = useRef(false);
    const stageRef = useRef<any>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // --- DOWNLOAD DE IMAGEM ---
    const downloadImage = useCallback(async () => {
        if (!exportRef.current || !stageRef.current) return;
        setIsSaving(true);
        try {
            const stage = stageRef.current;
            const konvaImage = stage.toDataURL({ pixelRatio: 3 });
            const tempImg = document.createElement('img');
            tempImg.src = konvaImage;
            tempImg.style.position = 'absolute'; tempImg.style.top = '0'; tempImg.style.left = '0';
            tempImg.style.width = '100%'; tempImg.style.height = '100%'; tempImg.style.zIndex = '100';
            const canvasWrapper = exportRef.current.querySelector('.canvas-wrapper');
            if (canvasWrapper) canvasWrapper.appendChild(tempImg);
            await new Promise(r => setTimeout(r, 200));
            const dataUrl = await toPng(exportRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#0f172a', cacheBust: true });
            if (canvasWrapper && tempImg) canvasWrapper.removeChild(tempImg);
            const link = document.createElement('a');
            link.download = `Tatica_${tacticName.replace(/\s+/g, '_') || 'NextLevel'}.png`;
            link.href = dataUrl;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            showToast('success', 'Imagem exportada com sucesso!');
        } catch (err) { showToast('error', 'Falha ao gerar imagem.'); } finally { setIsSaving(false); }
    }, [tacticName]);

    // --- SMART SHARE (PÚBLICO E PRIVADO) ---
    const shareTactic = useCallback(async () => {
        if (!exportRef.current || !stageRef.current) return;

        setIsSaving(true);
        try {
            // Se for PÚBLICA: Partilhamos o Link via Web Share ou WhatsApp Web
            if (isPublic) {
                const shareData = {
                    title: `Next Level: ${tacticName || 'Estratégia'}`,
                    text: `Vê a tática "${tacticName || 'Padel'}" que criei no Next Level Coach:`,
                    url: window.location.href,
                };

                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`;
                    window.open(waUrl, '_blank');
                }
            }
            // Se for PRIVADA: Partilhamos o ficheiro de imagem diretamente
            else {
                const stage = stageRef.current;
                const konvaImage = stage.toDataURL({ pixelRatio: 3 });
                const file = dataURLtoFile(konvaImage, `Tatica_${tacticName || 'NextLevel'}.png`);

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: tacticName || 'Tática de Padel',
                        text: 'Partilha da minha tática privada - Next Level Coach',
                    });
                } else {
                    // Fallback para Desktop: Descarrega a imagem
                    downloadImage();
                    showToast('success', 'Modo privado: Imagem gerada para partilha manual.');
                }
            }
        } catch (err) {
            console.error('Erro ao partilhar:', err);
        } finally {
            setIsSaving(false);
        }
    }, [isPublic, tacticName, downloadImage]);

    // --- EVENT LISTENERS ---
    useEffect(() => {
        const handleExport = () => downloadImage();
        const handleShare = () => shareTactic();
        window.addEventListener('trigger-tatica-export', handleExport);
        window.addEventListener('trigger-tatica-share', handleShare);
        return () => {
            window.removeEventListener('trigger-tatica-export', handleExport);
            window.removeEventListener('trigger-tatica-share', handleShare);
        };
    }, [downloadImage, shareTactic]);

    // --- INICIALIZAÇÃO ---
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!isMounted) return;
                if (error || !session?.user) { setSessionError('Sessão expirada.'); setIsLoading(false); return; }
                setCurrentUser(session.user);
                const drillId = searchParams.get('id');
                if (drillId) {
                    const { data } = await supabase.from('drills').select('*').eq('id', drillId).single();
                    if (data && isMounted) {
                        setTacticName(data.title || ''); setCategory(data.category || 'Geral');
                        setDescription(data.description || ''); setIsPublic(Boolean(data.is_public));
                        setDrillOwnerId(data.user_id || null);
                        if (data.canvas_data) { setLines(data.canvas_data.lines || []); setPlayers(data.canvas_data.players || initialPlayers); }
                    }
                }
            } catch (e) { setSessionError('Erro ao carregar editor.'); } finally { if (isMounted) setIsLoading(false); }
        };
        init();
        return () => { isMounted = false; };
    }, [searchParams, supabase]);

    const isOwner = !drillOwnerId || (currentUser && currentUser.id === drillOwnerId);

    const saveToCloud = async () => {
        if (!isOwner || !tacticName || !currentUser) return;
        setIsSaving(true);
        try {
            const drillId = searchParams.get('id');
            const payload = {
                title: tacticName, category, description, is_public: isPublic,
                author_name: currentUser.user_metadata?.full_name || 'Treinador',
                canvas_data: { lines, players }, user_id: currentUser.id
            };
            if (drillId) { await supabase.from('drills').update(payload).eq('id', drillId); }
            else {
                const { data } = await supabase.from('drills').insert(payload).select().single();
                if (data) router.replace(`${pathname}?id=${data.id}`);
            }
            showToast('success', 'Tática guardada!');
        } catch (err) { showToast('error', 'Erro ao gravar.'); } finally { setIsSaving(false); }
    };

    const handleMouseDown = (e: any) => {
        if (!isOwner || e.target.attrs.draggable) return;
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        setLines([...lines, { tool, points: [pos.x, pos.y, pos.x, pos.y], color }]);
    };

    const handleMouseMove = (e: any) => {
        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        let lastLine = lines[lines.length - 1];
        if (lastLine) {
            if (lastLine.tool === 'pen') { lastLine.points = lastLine.points.concat([point.x, point.y]); }
            else { lastLine.points = [lastLine.points[0], lastLine.points[1], point.x, point.y]; }
            setLines(lines.slice(0, -1).concat(lastLine));
        }
    };

    if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center text-green-500 gap-2"><Loader2 className="animate-spin" /></div>;

    return (
        <>
            {toast && (
                <div className={`fixed bottom-10 right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 ${
                    toast.type === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'
                }`}>
                    {toast.type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
                    <span className="font-bold">{toast.message}</span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 py-8 w-full max-w-7xl mx-auto items-start px-4">
                <div className="flex flex-col items-center gap-6 w-full lg:w-auto">
                    {isOwner && (
                        <div className="grid grid-cols-1 gap-3 w-full max-w-[360px]">
                            <div className="flex gap-2 p-2 bg-slate-800 rounded-2xl border border-slate-700 justify-center shadow-xl">
                                <ToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} icon={<PenTool size={20}/>} />
                                <ToolBtn active={tool === 'arrow'} onClick={() => setTool('arrow')} icon={<MoveRight size={20}/>} />
                                <ToolBtn active={tool === 'ball'} onClick={() => setTool('ball')} icon={<CircleDashed size={20}/>} />
                                <div className="w-px bg-slate-700 mx-1" />
                                <ColorBtn color="#000000" active={color === '#000000'} onClick={() => setColor('#000000')} />
                                <ColorBtn color="#ef4444" active={color === '#ef4444'} onClick={() => setColor('#ef4444')} />
                                <ColorBtn color="#3b82f6" active={color === '#3b82f6'} onClick={() => setColor('#3b82f6')} />
                            </div>
                        </div>
                    )}

                    <div ref={exportRef} className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col items-center shrink-0" style={{ width: '424px' }}>
                        <div className="mb-6 flex justify-between items-end px-2 w-full">
                            <div>
                                <h2 className="text-red-500 font-black italic uppercase tracking-tighter text-2xl leading-none">Next <span className="text-white">Level</span></h2>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Strategy Card</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-black uppercase italic text-sm truncate max-w-[150px]">{tacticName || 'Untitled'}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Coach: {currentUser?.user_metadata?.full_name || 'Coach'}</p>
                            </div>
                        </div>
                        <div className="canvas-wrapper relative rounded-2xl overflow-hidden border-[6px] border-slate-800 bg-white shadow-inner">
                            <Stage width={width} height={height} ref={stageRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => isDrawing.current = false}>
                                <Layer>
                                    <Rect width={width} height={height} fill="#3b82f6" listening={false} />
                                    <Rect width={width} height={height} stroke="white" strokeWidth={4} listening={false} />
                                    <Line points={[0, height/2, width, height/2]} stroke="white" strokeWidth={4} dash={[10, 5]} listening={false} />
                                    <Line points={[0, 160, width, 160]} stroke="white" strokeWidth={2} listening={false} />
                                    <Line points={[width/2, 160, width/2, height-160]} stroke="white" strokeWidth={2} listening={false} />
                                    <Line points={[0, height-160, width, height-160]} stroke="white" strokeWidth={2} listening={false} />
                                    {lines.map((l, i) => l.tool === 'arrow' ? <Arrow key={i} points={l.points} stroke={l.color} fill={l.color} strokeWidth={3} pointerLength={10} pointerWidth={10} /> : <Line key={i} points={l.points} stroke={l.color} strokeWidth={3} dash={l.tool === 'ball' ? [8, 8] : []} lineCap="round" lineJoin="round" tension={0.5} />)}
                                    {players.map(p => <Circle key={p.id} x={p.x} y={p.y} radius={p.id === 'ball' ? 8 : 18} fill={p.color} stroke="white" strokeWidth={2} draggable={isOwner} onDragEnd={(e) => setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, x: e.target.x(), y: e.target.y() } : pl))} />)}
                                </Layer>
                            </Stage>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-6">
                    <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 backdrop-blur-xl shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight italic">Tactic <span className="text-red-500">Intel</span></h2>
                            {isOwner && (
                                <button onClick={() => setIsPublic(!isPublic)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${isPublic ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                    {isPublic ? 'Public Tactical' : 'Private Draft'}
                                </button>
                            )}
                        </div>
                        <div className="space-y-6">
                            <InputGroup label="Tactic Name" value={tacticName} onChange={setTacticName} disabled={!isOwner} />
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-2 block tracking-widest text-xs">Category</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!isOwner} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:border-red-500 outline-none appearance-none transition-all font-bold cursor-pointer">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            </div>
                            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isOwner} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:border-red-500 outline-none resize-none transition-all" placeholder="Enter tactical notes..." />
                            {isOwner && <button onClick={saveToCloud} disabled={isSaving} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white font-black uppercase py-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 tracking-widest">{isSaving ? <Loader2 className="animate-spin"/> : <CloudUpload size={20}/>} Deploy to Cloud</button>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const ToolBtn = ({ active, onClick, icon }: any) => <button onClick={onClick} className={`p-3 rounded-xl transition-all ${active ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}>{icon}</button>;
const ColorBtn = ({ color, active, onClick }: any) => <button onClick={onClick} className={`w-8 h-8 rounded-full border-2 transition-all ${active ? 'scale-125 border-white shadow-lg' : 'border-transparent scale-100'}`} style={{ backgroundColor: color }} />;
const InputGroup = ({ label, value, onChange, disabled }: any) => <div><label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-2 block tracking-widest text-xs">{label}</label><input type="text" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:border-red-500 outline-none transition-all font-bold" /></div>;

export default PadelCourt;