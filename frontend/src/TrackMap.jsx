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
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/telemetry/${year}/${raceId}/${driver}`);
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

        drawFrame(data, currentPacket);
        requestRef.current = requestAnimationFrame(animate);
    };

    const drawGrid = (ctx, width, height) => {
        ctx.strokeStyle = '#1a1a1a'; // Grid bem sutil
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = 0; y <= height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();
    };

    const drawFrame = (points, currentPacket) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Limpa tela
        ctx.clearRect(0, 0, width, height);

        // Fundo do Canvas
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
        ctx.shadowColor = '#06b6d4'; // Cyan-500 do Tailwind
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        points.forEach((p, i) => {
            const pos = toScreen(p.x, p.y);
            if (i === 0) ctx.moveTo(pos.x, pos.y); else ctx.lineTo(pos.x, pos.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset

        // 2. Carro e HUD
        if (currentPacket) {
            const carPos = toScreen(currentPacket.x, currentPacket.y);

            // Ponto do Carro
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ef4444'; // Red-500
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(carPos.x, carPos.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Nome do Piloto ao lado do carro
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(driver, carPos.x + 12, carPos.y + 4);

            // --- HUD (Painel) ---
            // Fundo semi-transparente
            ctx.fillStyle = 'rgba(23, 23, 23, 0.8)'; // Gray-900 com alpha
            ctx.strokeStyle = '#374151'; // Gray-700
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(15, 15, 160, 80, 8); // Retângulo arredondado
            ctx.fill();
            ctx.stroke();

            // Texto Velocidade
            ctx.fillStyle = '#e5e7eb'; // Gray-200
            ctx.font = '14px monospace';
            ctx.fillText("VELOCIDADE", 30, 40);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px monospace';
            ctx.fillText(`${Math.round(currentPacket.speed)}`, 30, 70);

            ctx.fillStyle = '#9ca3af'; // Gray-400
            ctx.font = '14px monospace';
            ctx.fillText("km/h", 100, 70);

            // Barra de RPM decorativa
            ctx.fillStyle = '#ef4444';
            const barWidth = (currentPacket.speed / 350) * 130; // Simulando RPM com velocidade
            ctx.fillRect(30, 80, barWidth, 4);
        }
    };

    return (
        <div className="bg-gray-900 p-1 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
            {/* Cabeçalho do Card */}
            <div className="bg-gray-800/50 px-6 py-3 flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <h3 className="font-bold text-gray-100 tracking-wide">
                        LIVE TELEMETRY <span className="text-gray-500 mx-2">|</span> {driver}
                    </h3>
                </div>
                <div className="text-xs font-mono text-cyan-400 border border-cyan-900 bg-cyan-950/30 px-2 py-1 rounded">
                    {year} - R{raceId}
                </div>
            </div>

            {/* Área do Canvas */}
            <div className="relative w-full h-[500px] bg-black">
                {/* Status Overlay se estiver carregando */}
                {!status.includes("Simulando") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="text-cyan-400 font-mono animate-bounce">{status}</div>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full object-contain block"
                />
            </div>
        </div>
    );
};

export default TrackMap;