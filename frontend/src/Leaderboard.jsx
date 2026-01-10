const Leaderboard = ({ drivers, selectedDriver, opponentDriver, onSelectDriver, onRightClickDriver }) => {
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
                <button
                key={drv.code}
                onClick={() => onSelectDriver(drv.code)}
                onContextMenu={(e) => onRightClickDriver(e, drv.code)} // Botão Direito
                className={`
                    w-full flex items-center justify-between px-3 py-2 rounded transition-all group border-l-4
                    ${isSelected
                        ? 'bg-gray-800 border-l-cyan-500 shadow-lg'
                        : (isOpponent
                            ? 'bg-gray-800 border-l-white shadow-lg ring-1 ring-white/20' // Estilo do Rival
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

                    {/* Badge VS */}
                    {isOpponent && <span className="text-[9px] bg-white text-black px-1 rounded font-bold">VS</span>}
                </div>

                <span className={`text-xs font-mono opacity-50 ${isSelected ? 'text-cyan-200' : 'text-gray-400'}`}>
                    #{drv.number}
                </span>
                </button>
            )
          })}
        </div>
      </div>
    );
  };

  export default Leaderboard;