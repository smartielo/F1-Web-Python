import { useState, useEffect } from 'react'
import axios from 'axios'
import TrackMap from './TrackMap';

function App() {
  const [message, setMessage] = useState("Conectando...")
  const [races, setRaces] = useState([])

  useEffect(() => {
    // Busca status
    axios.get('http://127.0.0.1:8000/')
      .then(response => setMessage(response.data.message))
      .catch(() => setMessage("Offline"))

    // Busca corridas
    axios.get('http://127.0.0.1:8000/api/races/2023')
      .then(response => setRaces(response.data))
      .catch(error => console.error(error))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-cyan-500 selection:text-white pb-10">

      {/* Header / Topo */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-3xl">🏎️</span>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        F1 Telemetry Hub
                    </h1>
                    <p className="text-xs text-gray-500 font-mono">Real-time Data Analysis</p>
                </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${
                message === "Offline"
                ? 'bg-red-950/50 border-red-900 text-red-400'
                : 'bg-green-950/50 border-green-900 text-green-400'
            }`}>
                <div className={`w-2 h-2 rounded-full ${message === "Offline" ? 'bg-red-500' : 'bg-green-500'}`}></div>
                {message === "Offline" ? "BACKEND OFFLINE" : "SYSTEM ONLINE"}
            </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Coluna Esquerda: Mapa (Ocupa 2/3 da tela) */}
            <div className="lg:col-span-2 space-y-6">
                <TrackMap year={2023} raceId={20} driver="VER" />
            </div>

            {/* Coluna Direita: Lista Lateral */}
            <aside className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-gray-800 bg-gray-800/30">
                    <h2 className="font-bold flex items-center gap-2">
                        📅 Temporada 2023
                        <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full border border-gray-700">
                            {races.length}
                        </span>
                    </h2>
                </div>

                <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 flex-1">
                    {races.length === 0 && (
                        <div className="text-center py-10 text-gray-500 text-sm animate-pulse">Carregando calendário...</div>
                    )}

                    {races.map((race) => (
                        <div key={race.round} className="group p-3 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700 cursor-pointer transition-all">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-cyan-500 font-mono text-xs font-bold">ROUND {race.round}</span>
                                <span className="text-gray-500 text-[10px]">{race.date}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-gray-300 group-hover:text-white">{race.name}</h3>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                📍 {race.location}
                            </p>
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