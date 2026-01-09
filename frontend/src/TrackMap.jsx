import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const TrackMap = ({ year, raceId, driver }) => {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("Aguardando...");
    const requestRef = useRef();
    const startTimeRef = useRef(0);
    const telemetryData = useRef([]);

    useEffect(() => {
        const fetchTelemetry = async () => {
            setStatus(`📡 Baixando dados de ${driver}...`);
            try {
                const API_URL = import.meta.env.VITE_API_URL;
                const response = await axios.get(`${API_URL}/api/telemetry/${year}/${raceId}/${driver}`);
                const data = response.data;

                if (data.length > 0) {
                    setStatus("⚡ Simulando");
                    telemetryData.current = data;
                    startTimeRef.current = performance.now();
                    requestRef.current = requestAnimationFrame(animate);
                } else {
                    setStatus("❌ Nenhum dado encontrado.");
                }
            } catch (error) {
                console.error(error);
                setStatus("❌ Erro ao carregar telemetria.");
            }
        };

        fetchTelemetry();
        return () => cancelAnimationFrame(requestRef.current);
    }, [year, raceId, driver]);

    const animate = (time) => {
        const data = telemetryData.current;
        if (data.length === 0) return;

        const totalLapTime = data[data.length - 1].time;
        const timeElapsed = (Date.now() / 1000) % totalLapTime;
        const currentPacket = data.find(p => p.time >= timeElapsed) || data[data.length - 1];

        drawFrame(data, currentPacket, timeElapsed, totalLapTime);
        requestRef.current = requestAnimationFrame(animate);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${mins}:${secs}.${ms}`;
    };

    const drawGrid = (ctx, width, height) => {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = 0; y <= height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();
    };

    const drawFrame = (points, currentPacket, timeElapsed, totalTime) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Limpa tela
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height);

        // --- CÁLCULO DE ESCALA ---
        const xValues = points.map(p => p.x); const yValues = points.map(p => p.y);
        const minX = Math.min(...xValues); const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues); const maxY = Math.max(...yValues);
        const trackWidth = maxX - minX; const trackHeight = maxY - minY;

        const scale = Math.min((width - 100) / trackWidth, (height - 100) / trackHeight);
        const offsetX = (width - trackWidth * scale) / 2;
        const offsetY = (height - trackHeight * scale) / 2;

        const toScreen = (x, y) => ({
            x: (x - minX) * scale + offsetX,
            y: height - ((y - minY) * scale + offsetY)
        });

        // 1. Pista Neon
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06b6d4';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        points.forEach((p, i) => {
            const pos = toScreen(p.x, p.y);
            if (i === 0) ctx.moveTo(pos.x, pos.y); else ctx.lineTo(pos.x, pos.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 2. Carro e HUD
        if (currentPacket) {
            const carPos = toScreen(currentPacket.x, currentPacket.y);

            // Carro
            ctx.shadowBlur = 20; ctx.shadowColor = '#ef4444';
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(carPos.x, carPos.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Nome do Piloto
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(driver, carPos.x + 12, carPos.y + 4);

            // --- HUD CORRIGIDO (Separando Velocidade e Marcha) ---
            const hudX = 20;
            const hudY = 20;
            const hudWidth = 180;
            const hudHeight = 80;

            // Fundo HUD
            ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 8);
            ctx.fill();
            ctx.stroke();

            // 1. Velocidade (Lado Esquerdo)
            ctx.fillStyle = '#9ca3af'; // cinza claro
            ctx.font = '10px monospace';
            ctx.fillText("SPEED", hudX + 15, hudY + 25);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px monospace';
            ctx.fillText(`${Math.round(currentPacket.speed)}`, hudX + 15, hudY + 60);

            ctx.font = '12px monospace';
            ctx.fillStyle = '#666';
            ctx.fillText('km/h', hudX + 85, hudY + 60);

            // 2. Separador Vertical
            ctx.beginPath();
            ctx.moveTo(hudX + 120, hudY + 15);
            ctx.lineTo(hudX + 120, hudY + 65);
            ctx.strokeStyle = '#444';
            ctx.stroke();

            // 3. Marcha (Lado Direito)
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px monospace';
            ctx.fillText("GEAR", hudX + 135, hudY + 25);

            const gear = currentPacket.gear;
            ctx.font = 'bold 36px monospace';
            // Lógica de cores: Amarelo (baixa), Roxo (alta), Vermelho (média)
            ctx.fillStyle = gear <= 3 ? '#fbbf24' : (gear >= 7 ? '#a855f7' : '#ef4444');
            // Centraliza o número da marcha
            ctx.fillText(gear, hudX + 138, hudY + 60);


            // --- HUD DIREITA (Cronômetro) ---
            const timerX = width - 170;
            const timerY = 20;

            // Fundo Timer
            ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
            ctx.strokeStyle = '#333'; // Borda sutil
            ctx.beginPath();
            ctx.roundRect(timerX, timerY, 150, 50, 8);
            ctx.fill();
            ctx.stroke();

            // Texto Tempo
            ctx.fillStyle = '#22d3ee'; // Cyan neon
            ctx.font = 'bold 24px monospace';
            ctx.fillText(formatTime(timeElapsed), timerX + 15, timerY + 32);

            // Barra de Progresso (Rodapé)
            const progress = timeElapsed / totalTime;
            const barHeight = 4;

            // Fundo da barra
            ctx.fillStyle = '#333';
            ctx.fillRect(0, height - barHeight, width, barHeight);

            // Progresso preenchido
            ctx.fillStyle = '#22d3ee';
            ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
            ctx.fillRect(0, height - barHeight, width * progress, barHeight);
            ctx.shadowBlur = 0;
        }
    };

    return (
        <div className="bg-gray-900 p-1 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
            <div className="bg-gray-800/50 px-6 py-3 flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <h3 className="font-bold text-gray-100 tracking-wide">
                        LIVE REPLAY <span className="text-gray-500 mx-2">|</span> {driver}
                    </h3>
                </div>
                <div className="text-xs font-mono text-cyan-400 border border-cyan-900 bg-cyan-950/30 px-2 py-1 rounded">
                    {year} - R{raceId}
                </div>
            </div>

            <div className="relative w-full h-[500px] bg-black">
                {!status.includes("Simulando") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="text-cyan-400 font-mono animate-bounce">{status}</div>
                    </div>
                )}
                <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain block" />
            </div>
        </div>
    );
};

export default TrackMap;