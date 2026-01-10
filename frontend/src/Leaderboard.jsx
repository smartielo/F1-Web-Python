// Adicionamos as props: laps, selectedLap, onSelectLap
const Leaderboard = ({ drivers, selectedDriver, opponentDriver, onSelectDriver, onRightClickDriver, laps, selectedLap, onSelectLap }) => {

    if (drivers.length === 0) {
      return (
        <div className="h-full bg-gray-900/50 rounded-xl border border-gray-800 p-4 animate-pulse flex flex-col gap-2">
          {[...Array(20)].map((_, i) => <div key={i} className="h-8 bg-gray-800 rounded"></div>)}
        </div>
      );
    }

    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col h-full">
        <div className="p-3 border-b border-gray-800 bg-gray-800/80">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Leaderboard
          </h3>
          <p className="text-[9px] text-gray-600 mt-1">
            🖱️ Esq: Selecionar | 🖱️ Dir: Comparar
          </p>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
          {drivers.map((drv, index) => {
            const isSelected = selectedDriver === drv.code;
            const isOpponent = opponentDriver === drv.code;

            return (
                <div key={drv.code} className="flex flex-col">
                    {/* CARD DO PILOTO */}
                    <button
                        onClick={() => onSelectDriver(drv.code)}
                        onContextMenu={(e) => onRightClickDriver(e, drv.code)}
                        className={`
                            w-full flex items-center justify-between px-3 py-2 rounded transition-all group border-l-4
                            ${isSelected
                                ? 'bg-gray-800 border-l-cyan-500 shadow-lg'
                                : (isOpponent
                                    ? 'bg-gray-800 border-l-white shadow-lg ring-1 ring-white/20'
                                    : 'hover:bg-gray-800/50 border-l-transparent hover:border-l-gray-600')
                            }
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`font-mono font-bold w-4 text-right ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            {index + 1}
                            </span>

                            <span className={`font-bold font-mono text-lg ${isSelected ? 'text-cyan-400' : (isOpponent ? 'text-white' : 'text-gray-400')}`}>
                            {drv.code}
                            </span>

                            {isOpponent && <span className="text-[9px] bg-white text-black px-1 rounded font-bold">VS</span>}
                        </div>

                        <span className={`text-xs font-mono opacity-50 ${isSelected ? 'text-cyan-200' : 'text-gray-400'}`}>
                            #{drv.number}
                        </span>
                    </button>

                    {/* ÁREA DE VOLTAS (APENAS SE O PILOTO ESTIVER SELECIONADO) */}
                    {isSelected && (
                        <div className="mt-1 mb-3 bg-gray-950/50 p-2 rounded border border-gray-800 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Selecione a Volta:</span>
                            </div>

                            {/* Grid de Botões */}
                            <div className="grid grid-cols-4 gap-1">
                                {/* Botão Volta Rápida (Padrão) */}
                                <button
                                    onClick={() => onSelectLap(0)}
                                    className={`
                                        text-[10px] p-1 rounded font-mono border transition-all
                                        ${selectedLap === 0
                                            ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-900/40'
                                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}
                                    `}
                                >
                                    RÁPIDA
                                </button>

                                {/* Lista de Voltas Baixadas */}
                                {laps && laps.map((lap) => (
                                    <button
                                        key={lap.lap_number}
                                        onClick={() => onSelectLap(lap.lap_number)}
                                        className={`
                                            text-[10px] p-1 rounded font-mono border flex flex-col items-center justify-center transition-all
                                            ${selectedLap === lap.lap_number
                                                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}
                                            ${lap.is_fastest ? 'border-purple-500/50 text-purple-300' : ''}
                                        `}
                                        title={`Volta ${lap.lap_number}: ${lap.lap_time}`}
                                    >
                                        <span className="font-bold">V{lap.lap_number}</span>
                                    </button>
                                ))}

                                {laps && laps.length === 0 && (
                                    <span className="col-span-4 text-center text-[10px] text-gray-600 py-1">Carregando voltas...</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
          })}
        </div>
      </div>
    );
};

export default Leaderboard;