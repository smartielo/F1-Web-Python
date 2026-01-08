import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const TrackMap = ({ year, raceId, driver }) => {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("Aguardando...");

    useEffect(() => {
        const fetchTelemetry = async () => {
            setStatus(`Baixando dados de ${driver}...`);
            try {
                // Chama nosso backend Python
                const response = await axios.get(`http://127.0.0.1:8000/api/telemetry/${year}/${raceId}/${driver}`);
                const data = response.data;

                if (data.length > 0) {
                    setStatus("Renderizando pista...");
                    drawTrack(data);
                    setStatus("Concluído!");
                } else {
                    setStatus("Nenhum dado encontrado.");
                }
            } catch (error) {
                console.error(error);
                setStatus("Erro ao carregar telemetria.");
            }
        };

        fetchTelemetry();
    }, [year, raceId, driver]); // Recarrega se esses dados mudarem

    const drawTrack = (points) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Limpa a tela antes de desenhar
        ctx.clearRect(0, 0, width, height);

        // 1. Encontrar limites (Min/Max) para calcular escala
        // Usamos Math.min/max com spread operator (...)
        const xValues = points.map(p => p.x);
        const yValues = points.map(p => p.y);

        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);

        const trackWidth = maxX - minX;
        const trackHeight = maxY - minY;

        // 2. Calcular Escala (Deixando margem de 40px)
        const scaleX = (width - 80) / trackWidth;
        const scaleY = (height - 80) / trackHeight;
        const scale = Math.min(scaleX, scaleY);

        // 3. Centralizar
        const offsetX = (width - trackWidth * scale) / 2;
        const offsetY = (height - trackHeight * scale) / 2;

        // 4. Desenhar a Linha
        ctx.strokeStyle = '#00ffcc'; // Cor Neon
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();

        points.forEach((point, index) => {
            // Conversão de Coordenadas
            const x = (point.x - minX) * scale + offsetX;

            // Invertemos o Y porque no Canvas o Y cresce para baixo, mas no GPS cresce para o Norte (cima)
            const y = height - ((point.y - minY) * scale + offsetY);

            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();
    };

    return (
        <div style={{
            backgroundColor: '#111',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px',
            border: '1px solid #333',
            textAlign: 'center'
        }}>
            <h3 style={{color: '#fff'}}>Mapa: {year} - Round {raceId} ({driver})</h3>
            <p style={{color: '#aaa', fontSize: '14px'}}>{status}</p>

            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{
                    background: 'black',
                    border: '1px solid #444',
                    maxWidth: '100%',
                    height: 'auto'
                }}
            />
        </div>
    );
};

export default TrackMap;