import { useState, useEffect } from 'react'
import axios from 'axios'
import TrackMap from './TrackMap';
import Leaderboard from './Leaderboard'; // <--- Importe o novo componente

function App() {
  const [status, setStatus] = useState("Conectando...")
  const [races, setRaces] = useState([])
  const [selectedYear, setSelectedYear] = useState(2023)
  const [selectedRace, setSelectedRace] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [driversList, setDriversList] = useState([])

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${API_URL}/`)
      .then(() => setStatus("ONLINE"))
      .catch(() => setStatus("OFFLINE"))

    axios.get(`${API_URL}/api/races/${selectedYear}`)
      .then(res => {
        setRaces(res.data)
        if(res.data.length > 0) handleRaceSelect(res.data[0])
      })
  }, [])

  const handleRaceSelect = async (race) => {
    setSelectedRace(race);
    // setSelectedDriver(null); // (Opcional: Não resetar o piloto se quiser manter o foco)

    try {
      const res = await axios.get(`${API_URL}/api/drivers/${selectedYear}/${race.round}`);
      setDriversList(res.data);
      // Se não tiver piloto selecionado, pega o primeiro (Geralmente o VER ou Pole)
      if (!selectedDriver) {
          const defaultDriver = res.data.find(d => d.code === 'VER') ? 'VER' : res.data[0].code;
          setSelectedDriver(defaultDriver);
      }
    } catch (error) {
      console.error("Erro ao buscar pilotos", error);
    }
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans overflow-hidden flex flex-col">

      {/* Header Compacto */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 h-14 flex items-center justify-between px-6 shrink-0">
         <div className="flex items-center gap-2">
            <span className="text-2xl">🏎️</span>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                F1 Telemetry Hub
            </h1>
         </div>
         <div className="text-xs font-mono text-gray-500">
            {status === "ONLINE" ? <span className="text-green-500">● SYSTEM ONLINE</span> : <span className="text-red-500">● DISCONNECTED</span>}
         </div>
      </header>

      {/* --- GRID PRINCIPAL (LAYOUT TV) --- */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-3.5rem)]">

        {/* 1. COLUNA ESQUERDA: LEADERBOARD (Ocupa 2 de 12) */}
        <aside className="lg:col-span-2 h-full">
            <Leaderboard
                drivers={driversList}
                selectedDriver={selectedDriver}
                onSelectDriver={setSelectedDriver}
            />
        </aside>

        {/* 2. COLUNA CENTRAL: MAPA (Ocupa 7 de 12 - O Palco Principal) */}
        <section className="lg:col-span-7 h-full flex flex-col">
            {selectedRace && selectedDriver ? (
                <div className="h-full">
                    <TrackMap
                        year={selectedYear}
                        raceId={selectedRace.round}
                        driver={selectedDriver}
                    />
                </div>
            ) : (
                <div className="h-full border border-gray-800 rounded-xl flex items-center justify-center bg-gray-900/30 text-gray-600">
                    Selecione uma sessão
                </div>
            )}
        </section>

        {/* 3. COLUNA DIREITA: CALENDÁRIO/SESSÕES (Ocupa 3 de 12) */}
        <aside className="lg:col-span-3 h-full flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-3 border-b border-gray-800 bg-gray-800/80 flex justify-between items-center">
                <h2 className="font-bold text-sm">📅 Temporada {selectedYear}</h2>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">Race</span>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 flex-1">
                {races.map((race) => (
                    <div
                        key={race.round}
                        onClick={() => handleRaceSelect(race)}
                        className={`
                        p-3 rounded border cursor-pointer transition-all hover:bg-gray-800
                        ${selectedRace?.round === race.round
                            ? 'bg-blue-900/20 border-blue-500/50'
                            : 'border-transparent hover:border-gray-700'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`font-mono text-[10px] font-bold uppercase ${selectedRace?.round === race.round ? 'text-blue-400' : 'text-gray-500'}`}>
                                {race.location}
                            </span>
                            <span className="text-gray-600 text-[10px]">R{race.round}</span>
                        </div>
                        <h3 className={`font-bold text-sm truncate ${selectedRace?.round === race.round ? 'text-white' : 'text-gray-400'}`}>
                            {race.name}
                        </h3>
                    </div>
                ))}
            </div>

            {/* Espaço reservado para o futuro seletor de sessões */}
            <div className="p-3 border-t border-gray-800 bg-gray-900">
                <button className="w-full py-2 text-xs font-bold text-gray-500 border border-dashed border-gray-700 rounded hover:text-white hover:border-gray-500 transition-colors">
                    + EXPANDIR SESSÕES (EM BREVE)
                </button>
            </div>
        </aside>

      </main>
    </div>
  )
}

export default App