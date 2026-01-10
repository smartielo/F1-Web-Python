import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const TrackMap = ({ year, raceId, driver, opponent }) => {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("Aguardando...");
    const requestRef = useRef();

    // Refs para dados (Para não causar re-render desnecessário)
    const telemetryData = useRef([]);
    const opponentData = useRef([]); // Dados do Rival

    useEffect(() => {
        const fetchTelemetry = async () => {
            const API_URL = import.meta.env.VITE_API_URL;

            // 1. Resetar dados
            telemetryData.current = [];
            opponentData.current = [];
            setStatus(`📡 Carregando ${driver}...`);

            try {
                // Busca Piloto Principal
                const res1 = await axios.get(`${API_URL}/api/telemetry/${year}/${raceId}/${driver}`);
                telemetryData.current = res1.data;

                // Busca Rival (Se houver)
                if (opponent) {
                    setStatus(`📡 Carregando ${opponent}...`);
                    const res2 = await axios.get(`${API_URL}/api/telemetry/${year}/${raceId}/${opponent}`);
                    opponentData.current = res2.data;
                }

                if (telemetryData.current.length > 0) {
                    setStatus("⚡ Simulando");
                    requestRef.current = requestAnimationFrame(animate);
                } else {
                    setStatus("❌ Sem dados.");
                }
            } catch (error) {
                console.error(error);
                setStatus("❌ Erro.");
            }
        };

        fetchTelemetry();
        return () => cancelAnimationFrame(requestRef.current);
    }, [year, raceId, driver, opponent]);

    const animate = () => {
        const mainData = telemetryData.current;
        const ghostData = opponentData.current;

        if (mainData.length === 0) return;

        // Tempo Baseado no Piloto Principal
        const totalLapTime = mainData[mainData.length - 1].time;
        const timeElapsed = (Date.now() / 1000) % totalLapTime;

        // Posição Principal
        const mainPacket = mainData.find(p => p.time >= timeElapsed) || mainData[mainData.length - 1];

        // Posição do Rival (Ghost) - Se existir dados
        let ghostPacket = null;
        if (ghostData.length > 0) {
             // O Ghost pode ter um tempo de volta diferente, mas usamos o tempo absoluto para ver a diferença real
             ghostPacket = ghostData.find(p => p.time >= timeElapsed);
             // Se o tempoElapsed for maior que a volta do ghost, ele já terminou (pega o ultimo)
             if (!ghostPacket && timeElapsed > ghostData[0].time) ghostPacket = ghostData[ghostData.length -1];
        }

        drawFrame(mainData, mainPacket, ghostPacket, timeElapsed, totalLapTime);
        requestRef.current = requestAnimationFrame(animate);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${mins}:${secs}.${ms}`;
    };

    const drawFrame = (points, mainPacket, ghostPacket, timeElapsed, totalTime) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Limpa e Fundo
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, width, height);

        // --- Grid ---
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 0; x <= width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = 0; y <= height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();

        // --- CÁLCULO DE ESCALA (Igual antes) ---
        const xValues = points.map(p => p.x); const yValues = points.map(p => p.y);
        const minX = Math.min(...xValues); const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues); const maxY = Math.max(...yValues);
        const trackWidth = maxX - minX; const trackHeight = maxY - minY;
        const scale = Math.min((width - 100) / trackWidth, (height - 100) / trackHeight);
        const offsetX = (width - trackWidth * scale) / 2;
        const offsetY = (height - trackHeight * scale) / 2;
        const toScreen = (x, y) => ({ x: (x - minX) * scale + offsetX, y: height - ((y - minY) * scale + offsetY) });

        // 1. Desenha Pista
        ctx.shadowBlur = 10; ctx.shadowColor = '#0891b2'; ctx.strokeStyle = '#0891b2'; // Cyan mais escuro
        ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
        points.forEach((p, i) => { const pos = toScreen(p.x, p.y); if (i === 0) ctx.moveTo(pos.x, pos.y); else ctx.lineTo(pos.x, pos.y); });
        ctx.stroke(); ctx.shadowBlur = 0;

        // 2. Desenha GHOST CAR (Rival) - BRANCO
        if (ghostPacket) {
            const ghostPos = toScreen(ghostPacket.x, ghostPacket.y);
            ctx.fillStyle = 'white';
            ctx.globalAlpha = 0.6; // Meio transparente
            ctx.beginPath(); ctx.arc(ghostPos.x, ghostPos.y, 6, 0, 2 * Math.PI); ctx.fill();

            ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
            ctx.fillText(opponent, ghostPos.x + 10, ghostPos.y + 3);
            ctx.globalAlpha = 1.0;
        }

        // 3. Desenha MAIN CAR (Principal) - VERMELHO (Desenha por último pra ficar por cima)
        if (mainPacket) {
            const carPos = toScreen(mainPacket.x, mainPacket.y);
            ctx.shadowBlur = 20; ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(carPos.x, carPos.y, 8, 0, 2 * Math.PI); ctx.fill(); ctx.shadowBlur = 0;

            ctx.fillStyle = 'white'; ctx.font = 'bold 12px monospace';
            ctx.fillText(driver, carPos.x + 12, carPos.y + 4);

            // --- HUD ---
            const hudX = 20; const hudY = 20;
            ctx.fillStyle = 'rgba(20, 20, 20, 0.9)'; ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(hudX, hudY, 180, 80, 8); ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#9ca3af'; ctx.font = '10px monospace'; ctx.fillText("SPEED", hudX + 15, hudY + 25);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 36px monospace'; ctx.fillText(`${Math.round(mainPacket.speed)}`, hudX + 15, hudY + 60);
            ctx.font = '12px monospace'; ctx.fillStyle = '#666'; ctx.fillText('km/h', hudX + 85, hudY + 60);

            // Gear
            ctx.fillStyle = '#9ca3af'; ctx.font = '10px monospace'; ctx.fillText("GEAR", hudX + 135, hudY + 25);
            const gear = mainPacket.gear;
            ctx.font = 'bold 36px monospace'; ctx.fillStyle = gear <= 3 ? '#fbbf24' : (gear >= 7 ? '#a855f7' : '#ef4444');
            ctx.fillText(gear, hudX + 138, hudY + 60);

            // Separador
            ctx.beginPath(); ctx.moveTo(hudX + 120, hudY + 15); ctx.lineTo(hudX + 120, hudY + 65);
            ctx.strokeStyle = '#444'; ctx.stroke();

            // --- TIMER ---
            const timerX = width - 170; const timerY = 20;
            ctx.fillStyle = 'rgba(20, 20, 20, 0.8)'; ctx.strokeStyle = '#333';
            ctx.beginPath(); ctx.roundRect(timerX, timerY, 150, 50, 8); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 24px monospace';
            ctx.fillText(formatTime(timeElapsed), timerX + 15, timerY + 32);

            // Barra Progresso
            const progress = timeElapsed / totalTime;
            ctx.fillStyle = '#333'; ctx.fillRect(0, height - 4, width, 4);
            ctx.fillStyle = '#22d3ee'; ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
            ctx.fillRect(0, height - 4, width * progress, 4); ctx.shadowBlur = 0;
        }
    };

    return (
        <div className="w-full h-full bg-gray-950 relative flex flex-col">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-800 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <h3 className="font-bold text-gray-100 tracking-wide text-xs font-mono">
                    LIVE <span className="text-gray-600 mx-2">|</span> {driver}
                    {opponent && <span className="text-white ml-2">vs {opponent}</span>}
                </h3>
            </div>

            <div className="relative w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black">
                {!status.includes("Simulando") && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                        <div className="text-cyan-400 font-mono text-sm animate-pulse">{status}</div>
                    </div>
                )}
                <canvas ref={canvasRef} width={800} height={600} className="max-w-full max-h-full object-contain" />
            </div>
        </div>
    );
};
export default TrackMap;