const CircuitInfo = ({ race }) => {
    if (!race) return null;

    // Convertendo data para formato legível
    const dateObj = new Date(race.date);
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 h-full">
          {/* Card 1: Localização */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">Localização</span>
              <div className="flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-200 truncate">{race.location}</span>
              </div>
          </div>

          {/* Card 2: Rodada */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">Round</span>
              <div className="flex items-center gap-2">
                  <span className="text-xl">🏁</span>
                  <span className="font-bold text-gray-200 text-xl">#{race.round}</span>
              </div>
          </div>

          {/* Card 3: Data */}
          <div className="col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">Data da Sessão</span>
              <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <span className="font-bold text-gray-200 capitalize">{formattedDate}</span>
              </div>
          </div>

          {/* Futuro: Clima (Placeholder estático por enquanto) */}
          <div className="col-span-2 md:col-span-4 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed p-3 flex items-center justify-between opacity-60">
             <span className="text-xs font-mono text-gray-500">WEATHER DATA (OFFLINE)</span>
             <div className="flex gap-4 text-xs font-mono text-gray-600">
                <span>AIR: --°C</span>
                <span>TRACK: --°C</span>
                <span>HUMIDITY: --%</span>
             </div>
          </div>
      </div>
    );
  };

  export default CircuitInfo;