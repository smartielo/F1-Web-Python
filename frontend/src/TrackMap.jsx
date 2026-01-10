import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const TrackMap = ({ year, raceId, driver, opponent, lapNumber, onLapChange, availableLaps }) => {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("Aguardando...");

    // --- ESTADOS DO PLAYER ---
    const [isPlaying, setIsPlaying] = useState(true); // Começa tocando
    const [progress, setProgress] = useState(0); // 0 a 100%
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState("0:00.000");

    // --- REFS DO MOTOR DE TEMPO ---
    const requestRef = useRef();
    const lastFrameTime = useRef(0);
    const currentTimeRef = useRef(0); // Tempo atual em segundos (ex: 15.43s)
    const totalTimeRef = useRef(0);   // Tempo total da volta (ex: 90.00s)

    // Dados brutos
    const telemetryData = useRef([]);
    const opponentData = useRef([]);

    // 1. Carga de Dados
    useEffect(() => {
        const fetchTelemetry = async () => {
            const API_URL = import.meta.env.VITE_API_URL;

            // Pausa e Reseta ao mudar de piloto/volta
            setIsPlaying(false);
            currentTimeRef.current = 0;
            setProgress(0);
            telemetryData.current = [];
            opponentData.current = [];

            setStatus(`📡 Baixando volta ${lapNumber || 'Fastest'}...`);

            try {
                // Busca Principal (passando o lapNumber se existir)
                const lapParam = lapNumber ? `?lap=${lapNumber}` : '';
                const res1 = await axios.get(`${API_URL}/api/telemetry/${year}/${raceId}/${driver}${lapParam}`);
                telemetryData.current = res1.data;

                // Busca Rival (Sempre a volta mais rápida dele para comparação justa, ou você pode evoluir isso depois)
                if (opponent) {
                    const res2 = await axios.get(`${API_URL}/api/telemetry/${year}/${raceId}/${opponent}`);
                    opponentData.current = res2.data;
                }

                if (telemetryData.current.length > 0) {
                    // Configura tempo total
                    totalTimeRef.current = telemetryData.current[telemetryData.current.length - 1].time;
                    setStatus("Pronto");

                    // Inicia o loop (mas pausado até user dar play ou se quisermos auto-play)
                    setIsPlaying(true);
                } else {
                    setStatus("❌ Sem dados.");
                }
            } catch (error) {
                console.error(error);
                setStatus("❌ Erro.");
            }
        };

        fetchTelemetry();
    }, [year, raceId, driver, opponent, lapNumber]); // Recarrega se a volta mudar

    // 2. Loop de Animação (Engine)
    useEffect(() => {
        const animate = (time) => {
            if (lastFrameTime.current === 0) lastFrameTime.current = time;

            // Calcula delta (tempo entre frames)
            const deltaTime = (time - lastFrameTime.current) / 1000; // ms -> segundos
            lastFrameTime.current = time;

            if (isPlaying && telemetryData.current.length > 0) {
                // Avança o tempo
                currentTimeRef.current += deltaTime;

                // Loop: Se passar do final, volta pro zero
                if (currentTimeRef.current >= totalTimeRef.current) {
                    currentTimeRef.current = 0;
                }
            }

            // Atualiza UI (Barra e Texto)
            if (totalTimeRef.current > 0) {
                setProgress((currentTimeRef.current / totalTimeRef.current) * 100);
                setCurrentTimeDisplay(formatTime(currentTimeRef.current));
            }

            // Desenha o quadro atual
            drawFrame();

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying]); // Recria o loop se o status de play mudar


    // 3. Controles
    const togglePlay = () => setIsPlaying(!isPlaying);

    const stopSimulation = () => {
        setIsPlaying(false);
        currentTimeRef.current = 0;
        setProgress(0);
        drawFrame(); // Desenha frame zero
    };

    const handleScrub = (e) => {
        // Permite clicar na barra para pular tempo
        const newProgress = parseFloat(e.target.value);
        currentTimeRef.current = (newProgress / 100) * totalTimeRef.current;
        setProgress(newProgress);
        drawFrame();
    };


    // 4. Desenho (Separado para ser chamado no scrub)
    const drawFrame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const mainData = telemetryData.current;
        const ghostData = opponentData.current;
        const timeNow = currentTimeRef.current;

        // Limpa
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 0; x <= width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = 0; y <= height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();

        if (mainData.length === 0) return;

        // Escala (Baseada no Main)
        const xValues = mainData.map(p => p.x); const yValues = mainData.map(p => p.y);
        const minX = Math.min(...xValues); const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues); const maxY = Math.max(...yValues);
        const trackWidth = maxX - minX; const trackHeight = maxY - minY;
        const scale = Math.min((width - 80) / trackWidth, (height - 80) / trackHeight);
        const offsetX = (width - trackWidth * scale) / 2;
        const offsetY = (height - trackHeight * scale) / 2;
        const toScreen = (x, y) => ({ x: (x - minX) * scale + offsetX, y: height - ((y - minY) * scale + offsetY) });

        // Pista
        ctx.shadowBlur = 10; ctx.shadowColor = '#0891b2'; ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 3; ctx.beginPath();
        mainData.forEach((p, i) => { const pos = toScreen(p.x, p.y); if (i === 0) ctx.moveTo(pos.x, pos.y); else ctx.lineTo(pos.x, pos.y); });
        ctx.stroke(); ctx.shadowBlur = 0;

        // Posições
        const mainPacket = mainData.find(p => p.time >= timeNow) || mainData[mainData.length-1];

        // Ghost (Lógica simplificada de loop para o fantasma)
        let ghostPacket = null;
        if (ghostData.length > 0) {
            const ghostTotalTime = ghostData[ghostData.length-1].time;
            const ghostTime = timeNow % ghostTotalTime; // Loopa o fantasma também
            ghostPacket = ghostData.find(p => p.time >= ghostTime);
        }

        // Desenha Ghost
        if (ghostPacket) {
            const gp = toScreen(ghostPacket.x, ghostPacket.y);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath(); ctx.arc(gp.x, gp.y, 6, 0, 2 * Math.PI); ctx.fill();
            if(opponent) { ctx.fillStyle = '#aaa'; ctx.font='9px monospace'; ctx.fillText(opponent, gp.x+8, gp.y); }
        }

        // Desenha Main
        if (mainPacket) {
            const mp = toScreen(mainPacket.x, mainPacket.y);
            ctx.shadowBlur = 20; ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(mp.x, mp.y, 8, 0, 2 * Math.PI); ctx.fill(); ctx.shadowBlur = 0;

            // HUD Flutuante no Carro
            ctx.fillStyle = 'white'; ctx.font='bold 12px monospace'; ctx.fillText(driver, mp.x+10, mp.y+4);

            // --- HUD FIXO (No Canvas) ---
            const hudX = 20; const hudY = 20;
            ctx.fillStyle = 'rgba(20,20,20,0.9)'; ctx.strokeStyle='#444'; ctx.beginPath(); ctx.roundRect(hudX, hudY, 140, 60, 6); ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#fff'; ctx.font='bold 30px monospace'; ctx.fillText(Math.round(mainPacket.speed), hudX+10, hudY+40);
            ctx.font='12px monospace'; ctx.fillStyle='#888'; ctx.fillText("km/h", hudX+75, hudY+40);

            // Marcha
            ctx.fillStyle = '#ef4444'; ctx.font='bold 24px monospace'; ctx.fillText(mainPacket.gear, hudX+110, hudY+40);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${mins}:${secs}.${ms}`;
    };

    return (
        <div className="w-full h-full bg-gray-950 flex flex-col relative group">

            {/* CANVAS AREA */}
            <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black">
                 {!status.includes("Pronto") && !status.includes("Simulando") && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                        <div className="text-cyan-400 font-mono text-sm animate-pulse">{status}</div>
                    </div>
                )}
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
            </div>

            {/* BARRA DE CONTROLE (NOVA!) */}
            <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center px-4 gap-4 shrink-0 z-30">

                {/* Botões Play/Stop */}
                <div className="flex items-center gap-2">
                    <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all shadow-lg shadow-cyan-900/50">
                        {isPlaying ? "⏸" : "▶"}
                    </button>
                    <button onClick={stopSimulation} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-red-500 text-white flex items-center justify-center transition-all">
                        ⏹
                    </button>
                </div>

                {/* Timer e Barra de Progresso */}
                <div className="flex-1 flex flex-col justify-center gap-1">
                    <div className="flex justify-between text-xs font-mono text-gray-400">
                        <span>{currentTimeDisplay}</span>
                        <span>LIVE REPLAY</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="100" step="0.1"
                        value={progress}
                        onChange={handleScrub}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                    />
                </div>

                {/* Seletor de Voltas (Lap Selector) */}
                <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                    <span className="text-xs text-gray-500 font-bold uppercase">Lap:</span>
                    <select
                        className="bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:border-cyan-500 outline-none w-32 font-mono"
                        value={lapNumber || ""}
                        onChange={(e) => onLapChange(Number(e.target.value))}
                        disabled={!availableLaps || availableLaps.length === 0}
                    >
                        <option value="">Fastest (Auto)</option>
                        {availableLaps && availableLaps.map(l => (
                            <option key={l.lap_number} value={l.lap_number}>
                                #{l.lap_number} - {l.lap_time} {l.is_fastest ? '⚡' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
export default TrackMap;