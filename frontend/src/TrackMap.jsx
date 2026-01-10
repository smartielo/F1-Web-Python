import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const TrackMap = ({ year, raceId, driver, opponent, lapNumber, onLapChange, availableLaps }) => {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("Aguardando...");

    // --- ESTADOS DO PLAYER ---
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState("0:00.000");

    // --- REFS DO MOTOR DE TEMPO ---
    const requestRef = useRef();
    const lastFrameTime = useRef(0);
    const currentTimeRef = useRef(0);
    const totalTimeRef = useRef(0);

    // Dados brutos
    const telemetryData = useRef([]);
    const opponentData = useRef([]);

    // 1. Carga de Dados
    useEffect(() => {
        const fetchTelemetry = async () => {
            const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

            setIsPlaying(false);
            currentTimeRef.current = 0;
            setProgress(0);
            telemetryData.current = [];
            opponentData.current = [];

            const lapText = lapNumber === 0 ? 'Fastest' : `Volta ${lapNumber}`;
            setStatus(`📡 Baixando ${lapText}...`);

            try {
                // Se lapNumber for 0 (Fastest), enviamos 0 ou vazio (o backend entende 0 como fastest no nosso código novo)
                const lapParam = lapNumber ? `?lap=${lapNumber}` : '?lap=0';

                // Busca Telemetria do Piloto
                const res1 = await axios.get(`${API_URL}/api/telemetry/${year}/${raceId}/${driver}${lapParam}`);
                telemetryData.current = res1.data;

                // Busca Rival (Simplificado: sempre pega a melhor volta do rival para comparar)
                if (opponent) {
                    const res2 = await axios.get(`${API_URL}/api/telemetry/${year}/${raceId}/${opponent}`);
                    opponentData.current = res2.data;
                }

                if (telemetryData.current.length > 0) {
                    totalTimeRef.current = telemetryData.current[telemetryData.current.length - 1].time;
                    setStatus("Pronto");
                    setIsPlaying(true);
                } else {
                    setStatus("❌ Sem dados.");
                }
            } catch (error) {
                console.error(error);
                setStatus("❌ Erro ao baixar.");
            }
        };

        if (driver && raceId) {
            fetchTelemetry();
        }
    }, [year, raceId, driver, opponent, lapNumber]); // <-- Recarrega quando lapNumber mudar

    // 2. Loop de Animação
    useEffect(() => {
        const animate = (time) => {
            if (lastFrameTime.current === 0) lastFrameTime.current = time;
            const deltaTime = (time - lastFrameTime.current) / 1000;
            lastFrameTime.current = time;

            if (isPlaying && telemetryData.current.length > 0) {
                currentTimeRef.current += deltaTime;
                if (currentTimeRef.current >= totalTimeRef.current) {
                    currentTimeRef.current = 0;
                }
            }

            if (totalTimeRef.current > 0) {
                setProgress((currentTimeRef.current / totalTimeRef.current) * 100);
                setCurrentTimeDisplay(formatTime(currentTimeRef.current));
            }
            drawFrame();
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying]);

    // 3. Controles
    const togglePlay = () => setIsPlaying(!isPlaying);
    const stopSimulation = () => { setIsPlaying(false); currentTimeRef.current = 0; setProgress(0); drawFrame(); };
    const handleScrub = (e) => {
        const newProgress = parseFloat(e.target.value);
        currentTimeRef.current = (newProgress / 100) * totalTimeRef.current;
        setProgress(newProgress);
        drawFrame();
    };

    // 4. Desenho
    const drawFrame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const mainData = telemetryData.current;
        const ghostData = opponentData.current;
        const timeNow = currentTimeRef.current;

        ctx.clearRect(0, 0, width, height);
        // Ajuste de DPI se necessário, mas aqui faremos fill simples
        ctx.fillStyle = '#09090b'; // Fundo igual ao do container
        ctx.fillRect(0, 0, width, height);

        // Grid sutil
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 0; x <= width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = 0; y <= height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();

        if (mainData.length === 0) return;

        const xValues = mainData.map(p => p.x); const yValues = mainData.map(p => p.y);
        const minX = Math.min(...xValues); const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues); const maxY = Math.max(...yValues);

        const padding = 60;
        const trackWidth = maxX - minX;
        const trackHeight = maxY - minY;
        const scale = Math.min((width - padding*2) / trackWidth, (height - padding*2) / trackHeight);

        const offsetX = (width - trackWidth * scale) / 2;
        const offsetY = (height - trackHeight * scale) / 2;

        const toScreen = (x, y) => ({
            x: (x - minX) * scale + offsetX,
            y: height - ((y - minY) * scale + offsetY) // Inverte Y
        });

        // Desenha Traçado
        ctx.shadowBlur = 10; ctx.shadowColor = '#0891b2'; ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        mainData.forEach((p, i) => { const pos = toScreen(p.x, p.y); if (i === 0) ctx.moveTo(pos.x, pos.y); else ctx.lineTo(pos.x, pos.y); });
        ctx.stroke(); ctx.shadowBlur = 0;

        // Posição Atual
        const mainPacket = mainData.find(p => p.time >= timeNow) || mainData[mainData.length-1];

        // Ghost
        let ghostPacket = null;
        if (ghostData.length > 0) {
            const ghostTotalTime = ghostData[ghostData.length-1].time;
            const ghostTime = timeNow % ghostTotalTime;
            ghostPacket = ghostData.find(p => p.time >= ghostTime);
        }

        if (ghostPacket) {
            const gp = toScreen(ghostPacket.x, ghostPacket.y);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath(); ctx.arc(gp.x, gp.y, 6, 0, 2 * Math.PI); ctx.fill();
        }

        if (mainPacket) {
            const mp = toScreen(mainPacket.x, mainPacket.y);
            ctx.shadowBlur = 15; ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(mp.x, mp.y, 8, 0, 2 * Math.PI); ctx.fill(); ctx.shadowBlur = 0;

            // HUD Fixo
            const hudX = 20; const hudY = 20;
            ctx.fillStyle = 'rgba(10,10,10,0.8)'; ctx.strokeStyle='#333'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.roundRect(hudX, hudY, 150, 70, 8); ctx.fill(); ctx.stroke();

            // Velocidade
            ctx.fillStyle = '#fff'; ctx.font='bold 32px monospace';
            ctx.fillText(Math.round(mainPacket.speed), hudX+15, hudY+45);
            ctx.fillStyle='#888'; ctx.font='12px monospace';
            ctx.fillText("km/h", hudX+80, hudY+45);

            // Marcha (Gear)
            ctx.fillStyle = '#ef4444'; ctx.font='bold 24px monospace';
            ctx.fillText(mainPacket.gear, hudX+115, hudY+45);

            // Acelerador/Freio (Barras)
            const barW = 120; const barH = 6;
            // Throttle
            ctx.fillStyle = '#111'; ctx.fillRect(hudX+15, hudY+55, barW, barH);
            ctx.fillStyle = '#22c55e'; ctx.fillRect(hudX+15, hudY+55, barW * (mainPacket.throttle/100), barH);
            // Brake
            const isBraking = mainPacket.brake > 0 || mainPacket.brake === true;
            ctx.fillStyle = isBraking ? '#ef4444' : '#333';
            ctx.fillRect(hudX+15, hudY+63, isBraking ? barW : 0, barH);
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
            <div className="flex-1 relative">
                {!status.includes("Pronto") && !status.includes("Simulando") && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                        <div className="text-cyan-400 font-mono text-sm animate-pulse">{status}</div>
                    </div>
                )}
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
            </div>

            {/* Barra de Controles Inferior */}
            <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center px-4 gap-4 shrink-0 z-30">
                <div className="flex items-center gap-2">
                    <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all shadow-lg shadow-cyan-900/50">
                        {isPlaying ? "⏸" : "▶"}
                    </button>
                </div>

                <div className="flex-1 flex flex-col justify-center gap-1">
                    <div className="flex justify-between text-xs font-mono text-gray-400">
                        <span>{currentTimeDisplay}</span>
                        <span className="text-cyan-600">{lapNumber === 0 ? 'FASTEST LAP' : `LAP ${lapNumber}`}</span>
                    </div>
                    <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleScrub} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"/>
                </div>

                {/* Dropdown Extra para seleção rápida se a lista lateral estiver longe */}
                <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                    <span className="text-xs text-gray-500 font-bold uppercase hidden sm:inline">Volta:</span>
                    <select
                        className="bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:border-cyan-500 outline-none w-24 font-mono"
                        value={lapNumber}
                        onChange={(e) => onLapChange(Number(e.target.value))}
                    >
                        <option value={0}>Rápida</option>
                        {availableLaps && availableLaps.map(l => (
                            <option key={l.lap_number} value={l.lap_number}>V{l.lap_number}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
export default TrackMap;