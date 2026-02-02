'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { createClient } from '@/src/lib/supabase';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface LineData {
    tool: string;
    points: number[];
    color: string;
}

interface PlayerData {
    id: string;
    x: number;
    y: number;
    color: string;
}

const CATEGORIES = [
    'Geral',
    'Aquecimento',
    'Ataque',
    'Defesa',
    'Saída de Parede',
    'Volei',
    'Bandeja/Víbora',
    'Jogo de Pés',
];

// Converte Base64 em Blob
const dataURLToBlob = (dataURL: string) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
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
    const [saveSuccess, setSaveSuccess] = useState(false);
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

    // 1. Carregar sessão + tática
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error || !session?.user) {
                    console.error('Erro de sessão em PadelCourt:', error);
                    setSessionError('Sessão inválida. Faz login novamente.');
                    setIsLoading(false);
                    return;
                }

                const user = session.user;
                setCurrentUser(user);

                const drillId = searchParams.get('id');
                if (drillId) {
                    const { data, error: drillError } = await supabase
                        .from('drills')
                        .select('*')
                        .eq('id', drillId)
                        .single();

                    if (!isMounted) return;

                    if (drillError) {
                        console.error('Erro a carregar drill:', drillError);
                    }

                    if (data) {
                        setTacticName(data.title || '');
                        setCategory(data.category || 'Geral');
                        setDescription(data.description || '');
                        setIsPublic(Boolean(data.is_public));
                        setDrillOwnerId(data.user_id || null);

                        if (data.canvas_data) {
                            setLines(data.canvas_data.lines || []);
                            setPlayers(data.canvas_data.players || initialPlayers);
                        }
                    }
                }
            } catch (e) {
                console.error('Erro inesperado em PadelCourt:', e);
                setSessionError('Ocorreu um erro ao carregar o editor.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [searchParams, supabase]);

    const isOwner =
        !drillOwnerId || (currentUser && currentUser.id === drillOwnerId);

    // 2. Gravar (com upload de imagem)
    const saveToCloud = async () => {
        if (!isOwner) return;
        if (!tacticName) return alert('Dá um nome à tática.');
        if (!currentUser) return alert('Sessão inválida. Faz login novamente.');

        setIsSaving(true);
        try {
            let publicImageUrl: string | null = null;

            if (stageRef.current) {
                const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
                const blob = dataURLToBlob(dataUrl);
                const fileName = `${currentUser.id}/${Date.now()}.png`;

                const { error: uploadError } = await supabase.storage
                    .from('tactics')
                    .upload(fileName, blob, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('tactics')
                    .getPublicUrl(fileName);

                publicImageUrl = urlData.publicUrl;
            }

            const canvasData = { lines, players };
            const drillId = searchParams.get('id');

            const payload: any = {
                title: tacticName,
                category,
                description,
                is_public: isPublic,
                author_name:
                    currentUser.user_metadata?.full_name || 'Treinador',
                canvas_data: canvasData,
                image_url: publicImageUrl,
            };

            if (drillId) {
                const { error } = await supabase
                    .from('drills')
                    .update(payload)
                    .eq('id', drillId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('drills')
                    .insert({ ...payload, user_id: currentUser.id })
                    .select()
                    .single();
                if (error) throw error;
                if (data) {
                    router.replace(`${pathname}?id=${data.id}`, { scroll: false });
                    setDrillOwnerId(currentUser.id);
                }
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
        } catch (error: any) {
            console.error(error);
            alert('Erro ao gravar: ' + (error.message || 'Erro desconhecido.'));
        } finally {
            setIsSaving(false);
        }
    };

    // Clonar tática
    const cloneDrill = async () => {
        if (!currentUser) return alert('Login necessário.');
        if (!confirm('Clonar para a tua biblioteca?')) return;
        setIsSaving(true);
        try {
            let publicImageUrl: string | null = null;
            if (stageRef.current) {
                const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
                const blob = dataURLToBlob(dataUrl);
                const fileName = `${currentUser.id}/${Date.now()}.png`;

                const { error: uploadError } = await supabase.storage
                    .from('tactics')
                    .upload(fileName, blob);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('tactics')
                    .getPublicUrl(fileName);

                publicImageUrl = urlData.publicUrl;
            }

            const canvasData = { lines, players };
            const payload = {
                user_id: currentUser.id,
                title: `${tacticName || 'Tática'} (Cópia)`,
                category,
                description,
                is_public: false,
                author_name:
                    currentUser.user_metadata?.full_name || 'Treinador',
                canvas_data: canvasData,
                image_url: publicImageUrl,
            };

            const { data, error } = await supabase
                .from('drills')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            if (data) {
                alert('Tática copiada!');
                router.push(`/dashboard/tatica?id=${data.id}`);
            }
        } catch (error: any) {
            console.error(error);
            alert('Erro: ' + (error.message || 'Erro ao clonar.'));
        } finally {
            setIsSaving(false);
        }
    };

    // UI helpers
    const clearBoard = () => {
        if (confirm('Limpar tudo?')) {
            setLines([]);
            setPlayers(initialPlayers);
            setTacticName('');
            setDescription('');
            setCategory('Geral');
            setIsPublic(false);
            setDrillOwnerId(null);
            router.replace(pathname);
        }
    };

    const fixBoundary = (pos: any, radius: number) => {
        let x = pos.x;
        let y = pos.y;
        if (x < radius) x = radius;
        if (x > width - radius) x = width - radius;
        if (y < radius) y = radius;
        if (y > height - radius) y = height - radius;
        return { x, y };
    };

    const handleDragEnd = (e: any, id: string) => {
        if (!isOwner) return;
        const newPos = { x: e.target.x(), y: e.target.y() };
        setPlayers((prev) =>
            prev.map((p) => (p.id === id ? { ...p, x: newPos.x, y: newPos.y } : p))
        );
    };

    const handleMouseDown = (e: any) => {
        if (!isOwner || e.target.attrs.draggable) return;
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        if (!pos) return;
        setLines([
            ...lines,
            {
                tool,
                points: [pos.x, pos.y, pos.x, pos.y],
                color,
            },
        ]);
    };

    const handleMouseMove = (e: any) => {
        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        if (!point) return;

        let lastLine = lines[lines.length - 1];
        if (lastLine) {
            if (lastLine.tool === 'pen') {
                lastLine.points = lastLine.points.concat([point.x, point.y]);
            } else {
                const newPoints = lastLine.points.slice(0, 2);
                newPoints.push(point.x, point.y);
                lastLine.points = newPoints;
            }
            const updated = lines.slice(0, lines.length - 1).concat(lastLine);
            setLines(updated);
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const undoLast = () => {
        if (!isOwner) return;
        setLines(lines.slice(0, -1));
    };

    const downloadImage = () => {
        if (stageRef.current) {
            const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = tacticName ? `${tacticName}.png` : 'tatica.png';
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-green-500 gap-2">
                <Loader2 className="animate-spin" /> A carregar editor...
            </div>
        );
    }

    if (sessionError) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-red-400">
                <p className="mb-2 font-bold">{sessionError}</p>
                <p className="text-sm text-slate-400">
                    Fecha e volta a abrir a sessão para continuar a editar táticas.
                </p>
            </div>
        );
    }

    return (
        <>
            {saveSuccess && (
                <div className="fixed bottom-6 right-6 z-50 bg-green-500 text-slate-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border-2 border-green-400">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Check size={24} className="text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg leading-none">Guardado!</h4>
                        <p className="text-sm font-medium opacity-80 mt-1">
                            Imagem e tática atualizadas.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 py-8 w-full max-w-6xl mx-auto items-start px-4">
                {/* Campo */}
                <div className="flex flex-col items-center gap-6 w-full lg:w-auto flex-shrink-0">
                    {isOwner && (
                        <div className="flex flex-col gap-3 w-full max-w-[360px]">
                            <div className="flex gap-2 p-2 bg-slate-800 rounded-xl shadow border border-slate-700 justify-center">
                                <button
                                    onClick={() => setTool('pen')}
                                    className={`p-2 rounded-lg transition ${
                                        tool === 'pen'
                                            ? 'bg-green-500 text-slate-900'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                    title="Lápis Livre"
                                >
                                    <PenTool size={20} />
                                </button>
                                <button
                                    onClick={() => setTool('arrow')}
                                    className={`p-2 rounded-lg transition ${
                                        tool === 'arrow'
                                            ? 'bg-green-500 text-slate-900'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                    title="Seta"
                                >
                                    <MoveRight size={20} />
                                </button>
                                <button
                                    onClick={() => setTool('ball')}
                                    className={`p-2 rounded-lg transition ${
                                        tool === 'ball'
                                            ? 'bg-green-500 text-slate-900'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                    title="Linha Bola"
                                >
                                    <CircleDashed size={20} />
                                </button>
                                <div className="w-px bg-slate-600 mx-2" />
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => setColor('#000000')}
                                        className={`w-6 h-6 rounded-full bg-black border-2 ${
                                            color === '#000000'
                                                ? 'border-white'
                                                : 'border-transparent'
                                        }`}
                                    />
                                    <button
                                        onClick={() => setColor('#ef4444')}
                                        className={`w-6 h-6 rounded-full bg-red-500 border-2 ${
                                            color === '#ef4444'
                                                ? 'border-white'
                                                : 'border-transparent'
                                        }`}
                                    />
                                    <button
                                        onClick={() => setColor('#3b82f6')}
                                        className={`w-6 h-6 rounded-full bg-blue-500 border-2 ${
                                            color === '#3b82f6'
                                                ? 'border-white'
                                                : 'border-transparent'
                                        }`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 p-2 bg-slate-800 rounded-xl shadow border border-slate-700 justify-center">
                                <button
                                    onClick={undoLast}
                                    className="flex-1 text-slate-400 hover:text-white hover:bg-slate-700 py-1 rounded transition flex justify-center"
                                >
                                    <Undo size={20} />
                                </button>
                                <button
                                    onClick={clearBoard}
                                    className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1 rounded transition flex justify-center"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button
                                    onClick={downloadImage}
                                    className="flex-1 text-green-400 hover:text-green-300 hover:bg-green-500/10 py-1 rounded transition flex justify-center"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    <Stage
                        width={width}
                        height={height}
                        className={`bg-white shadow-2xl rounded-xl overflow-hidden touch-none border-[6px] border-slate-800 ring-1 ring-slate-700 ${
                            isOwner ? 'cursor-crosshair' : 'cursor-default opacity-90'
                        }`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                        ref={stageRef}
                    >
                        <Layer>
                            <Rect x={0} y={0} width={width} height={height} fill="#3b82f6" />
                            <Rect
                                x={0}
                                y={0}
                                width={width}
                                height={height}
                                stroke="white"
                                strokeWidth={4}
                                listening={false}
                            />
                            <Line
                                points={[0, height / 2, width, height / 2]}
                                stroke="white"
                                strokeWidth={4}
                                dash={[10, 5]}
                                listening={false}
                            />
                            <Line
                                points={[0, 160, width, 160]}
                                stroke="white"
                                strokeWidth={2}
                                listening={false}
                            />
                            <Line
                                points={[width / 2, 160, width / 2, height / 2]}
                                stroke="white"
                                strokeWidth={2}
                                listening={false}
                            />
                            <Line
                                points={[0, height - 160, width, height - 160]}
                                stroke="white"
                                strokeWidth={2}
                                listening={false}
                            />
                            <Line
                                points={[width / 2, height - 160, width / 2, height / 2]}
                                stroke="white"
                                strokeWidth={2}
                                listening={false}
                            />

                            {lines.map((line, i) => {
                                if (line.tool === 'arrow') {
                                    return (
                                        <Arrow
                                            key={i}
                                            points={line.points}
                                            stroke={line.color}
                                            fill={line.color}
                                            strokeWidth={3}
                                            pointerLength={10}
                                            pointerWidth={10}
                                            listening={false}
                                        />
                                    );
                                }
                                if (line.tool === 'ball') {
                                    return (
                                        <Line
                                            key={i}
                                            points={line.points}
                                            stroke={line.color}
                                            strokeWidth={3}
                                            dash={[8, 8]}
                                            lineCap="round"
                                            lineJoin="round"
                                            listening={false}
                                        />
                                    );
                                }
                                return (
                                    <Line
                                        key={i}
                                        points={line.points}
                                        stroke={line.color}
                                        strokeWidth={3}
                                        tension={0.5}
                                        lineCap="round"
                                        lineJoin="round"
                                        listening={false}
                                    />
                                );
                            })}

                            {players.map((p) => (
                                <Circle
                                    key={p.id}
                                    x={p.x}
                                    y={p.y}
                                    radius={p.id === 'ball' ? 8 : 18}
                                    fill={p.color}
                                    stroke="white"
                                    strokeWidth={p.id === 'ball' ? 1 : 2}
                                    draggable={isOwner}
                                    dragBoundFunc={(pos) =>
                                        fixBoundary(pos, p.id === 'ball' ? 8 : 18)
                                    }
                                    onDragEnd={(e) => handleDragEnd(e, p.id)}
                                />
                            ))}
                        </Layer>
                    </Stage>
                </div>

                {/* Painel lateral */}
                <div className="flex flex-col gap-6 w-full lg:flex-1 min-w-[350px]">
                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl h-full relative overflow-hidden">
                        {!isOwner && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                        )}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`p-2 rounded-lg ${
                                        isOwner
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-blue-500/10 text-blue-400'
                                    }`}
                                >
                                    {isOwner ? <FileText size={24} /> : <Globe size={24} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {isOwner ? 'Detalhes' : 'Modo Leitura'}
                                    </h2>
                                    {!isOwner && (
                                        <p className="text-xs text-blue-400 font-bold">
                                            A visualizar tática da comunidade
                                        </p>
                                    )}
                                </div>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={() => setIsPublic(!isPublic)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition border ${
                                        isPublic
                                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                            : 'bg-slate-700 text-slate-400 border-slate-600'
                                    }`}
                                >
                                    {isPublic ? <Globe size={14} /> : <Lock size={14} />}{' '}
                                    {isPublic ? 'Público' : 'Privado'}
                                </button>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">
                                Nome
                            </label>
                            <input
                                type="text"
                                disabled={!isOwner}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-green-500 outline-none disabled:opacity-50"
                                value={tacticName}
                                onChange={(e) => setTacticName(e.target.value)}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">
                                Categoria
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={!isOwner}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white disabled:opacity-50"
                            >
                                <option>Geral</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-8">
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">
                                Notas
                            </label>
                            <textarea
                                rows={6}
                                disabled={!isOwner}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white resize-none disabled:opacity-50"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {isOwner ? (
                            <button
                                onClick={saveToCloud}
                                disabled={isSaving}
                                className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition ${
                                    saveSuccess
                                        ? 'bg-slate-700 text-slate-300'
                                        : 'bg-green-500 hover:bg-green-400 text-slate-900'
                                }`}
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" />
                                ) : saveSuccess ? (
                                    <Check />
                                ) : (
                                    <CloudUpload />
                                )}
                                <span>
                  {saveSuccess ? 'Guardado!' : 'Gravar Alterações'}
                </span>
                            </button>
                        ) : (
                            <button
                                onClick={cloneDrill}
                                disabled={isSaving}
                                className="w-full font-bold py-4 rounded-xl flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Copy />
                                )}
                                <span>Guardar na Minha Biblioteca</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PadelCourt;
