import { useState, useEffect } from 'react'
import axios from 'axios'
import TrackMap from './TrackMap';
import DriverSelect from './DriverSelect'; // <--- Importe o novo componente

function App() {
  const [status, setStatus] = useState("Conectando...")

  // Dados Gerais
  const [races, setRaces] = useState([])

  // Estado da Seleção (O que o usuário escolheu)
  const [selectedYear, setSelectedYear] = useState(2023)
  const [selectedRace, setSelectedRace] = useState(null) // Guarda o objeto da corrida inteira
  const [selectedDriver, setSelectedDriver] = useState(null)

  // Lista de pilotos da corrida selecionada
  const [driversList, setDriversList] = useState([])

  const API_URL = import.meta.env.VITE_API_URL;

  // 1. Carga Inicial (Calendário)
  useEffect(() => {
    axios.get(`${API_URL}/`)
      .then(() => setStatus("ONLINE"))
      .catch(() => setStatus("OFFLINE"))

    axios.get(`${API_URL}/api/races/${selectedYear}`)
      .then(res => {
        setRaces(res.data)
        // Seleciona a última corrida automaticamente (opcional)
        if(res.data.length > 0) handleRaceSelect(res.data[0])
      })
  }, [])

  // 2. Função disparada ao clicar numa corrida
  const handleRaceSelect = async (race) => {
    setSelectedRace(race);
    setSelectedDriver(null); // Reseta o piloto anterior
    setDriversList([]); // Limpa lista antiga

    try {
      // Busca pilotos dessa corrida
      const res = await axios.get(`${API_URL}/api/drivers/${selectedYear}/${race.round}`);
      setDriversList(res.data);

      // Tenta selecionar o Verstappen (VER) por padrão, ou o primeiro da lista
      const defaultDriver = res.data.find(d => d.code === 'VER') ? 'VER' : res.data[0].code;
      setSelectedDriver(defaultDriver);

    } catch (error) {
      console.error("Erro ao buscar pilotos", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-10">

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-3xl">🏎️</span>
                <div>
                    <h1 className="text-xl font-bold text-white">F1 Telemetry Hub</h1>
                    <p className="text-xs text-gray-500 font-mono">
                      {status === "ONLINE" ? "🟢 Localhost Connected" : "🔴 Backend Offline"}
                    </p>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* --- COLUNA ESQUERDA: MAPA E CONTROLES --- */}
            <div className="lg:col-span-2 flex flex-col">

                {/* Seletor de Pilotos (Novo!) */}
                <DriverSelect
                  drivers={driversList}
                  selectedDriver={selectedDriver}
                  onSelectDriver={setSelectedDriver}
                />

                {/* O Mapa (Só renderiza se tiver tudo selecionado) */}
                {selectedRace && selectedDriver ? (
                  <TrackMap
                    year={selectedYear}
                    raceId={selectedRace.round}
                    driver={selectedDriver}
                  />
                ) : (
                  <div className="h-[500px] bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center text-gray-500">
                    Selecione uma corrida para começar
                  </div>
                )}
            </div>

            {/* --- COLUNA DIREITA: LISTA DE CORRIDAS --- */}
            <aside className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col h-[650px]">
                <div className="p-4 border-b border-gray-800 bg-gray-800/30">
                    <h2 className="font-bold">📅 Temporada {selectedYear}</h2>
                </div>

                <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 flex-1">
                    {races.map((race) => (
                        <div
                          key={race.round}
                          onClick={() => handleRaceSelect(race)} // <--- CLIQUE AQUI
                          className={`
                            group p-3 rounded-lg border cursor-pointer transition-all
                            ${selectedRace?.round === race.round
                              ? 'bg-blue-900/20 border-blue-500/50'
                              : 'hover:bg-gray-800 border-transparent hover:border-gray-700'}
                          `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-mono text-xs font-bold ${selectedRace?.round === race.round ? 'text-blue-400' : 'text-cyan-600'}`}>
                                  ROUND {race.round}
                                </span>
                                <span className="text-gray-500 text-[10px]">{race.date}</span>
                            </div>
                            <h3 className={`font-semibold text-sm ${selectedRace?.round === race.round ? 'text-white' : 'text-gray-300'}`}>
                              {race.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">📍 {race.location}</p>
                        </div>
                    ))}
                </div>
            </aside>

        </div>
      </main>
    </div>
  )
}

export default App