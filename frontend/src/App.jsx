import { useState, useEffect } from 'react'
import axios from 'axios'
import TrackMap from './TrackMap';

function App() {
  const [message, setMessage] = useState("Carregando...")
  const [races, setRaces] = useState([])

  // Esse useEffect roda assim que a página abre
  useEffect(() => {
    // 1. Testa conexão básica com o Python
    axios.get('http://127.0.0.1:8000/')
      .then(response => {
        setMessage(response.data.message)
      })
      .catch(error => {
        console.error("Erro ao conectar com Python:", error)
        setMessage("Erro: O Backend Python não está rodando! 😱")
      })

    // 2. Busca o calendário de 2023
    axios.get('http://127.0.0.1:8000/api/races/2023')
      .then(response => {
        setRaces(response.data)
      })
      .catch(error => console.error("Erro ao buscar corridas:", error))

  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#242424', color: 'white', minHeight: '100vh' }}>
      <h1>🏎️ F1 Web Telemetry</h1>


      {/* Testando com Brasil 2023 (Round 20), Piloto VER */}
      <TrackMap year={2023} raceId={20} driver="VER" />


      {/* Caixa de Status */}
      <div style={{
        border: message.includes("Erro") ? '1px solid red' : '1px solid #4CAF50',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: message.includes("Erro") ? '#3a0000' : '#003300'
      }}>
        <strong>Status do Backend:</strong> {message}
      </div>

      <h2>📅 Calendário 2023</h2>

      {races.length === 0 && <p>Carregando lista de corridas...</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {races.slice(0, 5).map((race) => (
          <li key={race.round} style={{
            backgroundColor: '#333',
            margin: '10px 0',
            padding: '10px',
            borderRadius: '5px'
          }}>
            <span style={{ color: '#aaa' }}>Round {race.round}:</span> <strong>{race.name}</strong> - {race.location}
          </li>
        ))}
      </ul>
      {races.length > 0 && <p style={{ color: '#888' }}>... e mais {races.length - 5} corridas carregadas via Python.</p>}
    </div>
  )
}

export default App