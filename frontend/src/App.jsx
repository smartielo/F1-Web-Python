import { useState, useEffect } from 'react'
import axios from 'axios'
import TrackMap from './TrackMap';
import Leaderboard from './Leaderboard';
import CircuitInfo from './CircuitInfo';

function App() {
  const [status, setStatus] = useState("Conectando...")
  const [races, setRaces] = useState([])
  const [selectedYear, setSelectedYear] = useState(2023)
  const [selectedRace, setSelectedRace] = useState(null)

  const [selectedDriver, setSelectedDriver] = useState(null)
  const [opponentDriver, setOpponentDriver] = useState(null)
  const [driversList, setDriversList] = useState([])

  // --- NOVO: Estados de Voltas ---
  const [lapsList, setLapsList] = useState([])
  const [selectedLap, setSelectedLap] = useState(0) // 0 = Fastest

  const API_URL = import.meta.env.VITE_API_URL;

  // Carga inicial
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

  // Ao selecionar corrida
  const handleRaceSelect = async (race) => {
    setSelectedRace(race);
    setOpponentDriver(null);
    setLapsList([]); // Limpa voltas
    try {
      const res = await axios.get(`${API_URL}/api/drivers/${selectedYear}/${race.round}`);
      setDriversList(res.data);
      if (!selectedDriver) {
          const defaultDriver = res.data.find(d => d.code === 'VER') ? 'VER' : res.data[0].code;
          handleDriverSelect(defaultDriver); // Usa a função nova
      } else {
        // Se já tem piloto, atualiza as voltas dele pra nova pista
        fetchLaps(race.round, selectedDriver);
      }
    } catch (error) {
      console.error("Erro drivers:", error);
    }
  }

  // NOVA FUNÇÃO: Selecionar Piloto e buscar voltas
  const handleDriverSelect = (driverCode) => {
    setSelectedDriver(driverCode);
    if(selectedRace) fetchLaps(selectedRace.round, driverCode);
  }

  // NOVA FUNÇÃO: Busca voltas no backend
  const fetchLaps = async (round, driver) => {
    setLapsList([]); // Limpa lista antiga visualmente
    setSelectedLap(0); // Reseta para "Fastest"
    try {
        const res = await axios.get(`${API_URL}/api/laps/${selectedYear}/${round}/${driver}`);
        setLapsList(res.data);
    } catch (error) {
        console.error("Erro laps:", error);
    }
  }

  const handleDriverRightClick = (e, driverCode) => {
    e.preventDefault();
    if (driverCode === selectedDriver) return;
    setOpponentDriver(driverCode === opponentDriver ? null : driverCode);
  }

  return (
    <div className="h-screen w-full bg-black text-gray-100 font-sans overflow-hidden flex flex-col">
      <header className="bg-gray-900/90 backdrop-blur border-b border-gray-800 h-14 flex items-center justify-between px-6 shrink-0 z-50">
         <div className="flex items-center gap-2">
            <span className="text-2xl">🏎️</span>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                F1 Telemetry Hub
            </h1>
         </div>
         <div className="text-xs font-mono">
            {status === "ONLINE" ? <span className="text-green-500">● ONLINE</span> : <span className="text-red-500">● OFFLINE</span>}
         </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-3.5rem)]">

        <aside className="lg:col-span-2 h-full overflow-hidden">
            <Leaderboard
                drivers={driversList}
                selectedDriver={selectedDriver}
                opponentDriver={opponentDriver}
                onSelectDriver={handleDriverSelect} // <--- Função Atualizada
                onRightClickDriver={handleDriverRightClick}
            />
        </aside>

        <section className="lg:col-span-7 h-full flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 relative overflow-hidden flex flex-col justify-center">
                {selectedRace && selectedDriver ? (
                    <div className="w-full h-full">
                        {/* --- COMPONENTE ATUALIZADO --- */}
                        <TrackMap
                            year={selectedYear}
                            raceId={selectedRace.round}
                            driver={selectedDriver}
                            opponent={opponentDriver}

                            // Props de Voltas e Controle
                            lapNumber={selectedLap}
                            onLapChange={setSelectedLap}
                            availableLaps={lapsList}
                        />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 animate-pulse">
                        Selecione uma corrida
                    </div>
                )}
            </div>
            <div className="h-auto shrink-0">
                <CircuitInfo race={selectedRace} />
            </div>
        </section>

        <aside className="lg:col-span-3 h-full flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
             {/* ... (Lista de Corridas igual) ... */}
             {/* (Copie o código da lista de corridas do seu App.jsx anterior ou mantenha se não mudou) */}
             <div className="p-3 border-b border-gray-800 bg-gray-800/80 flex justify-between items-center shadow-md z-10">
                <h2 className="font-bold text-sm">📅 Temporada {selectedYear}</h2>
                <span className="text-[10px] bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-300">RACES</span>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 flex-1">
                {races.map((race) => (
                    <div key={race.round} onClick={() => handleRaceSelect(race)} className={`p-3 rounded border cursor-pointer transition-all hover:bg-gray-800 ${selectedRace?.round === race.round ? 'bg-blue-900/20 border-blue-500/50' : 'border-transparent hover:border-gray-700'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className={`font-mono text-[10px] font-bold uppercase ${selectedRace?.round === race.round ? 'text-blue-400' : 'text-gray-500'}`}>{race.location}</span>
                            <span className="text-gray-600 text-[10px]">R{race.round}</span>
                        </div>
                        <h3 className={`font-bold text-sm truncate ${selectedRace?.round === race.round ? 'text-white' : 'text-gray-400'}`}>{race.name}</h3>
                    </div>
                ))}
            </div>
        </aside>
      </main>
    </div>
  )
}

export default App