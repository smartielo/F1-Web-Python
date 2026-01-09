const Leaderboard = ({ drivers, selectedDriver, onSelectDriver }) => {
  if (drivers.length === 0) {
    return (
      <div className="h-full bg-gray-900/50 rounded-xl border border-gray-800 p-4 animate-pulse flex flex-col gap-2">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-800 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col h-[650px]">
      <div className="p-3 border-b border-gray-800 bg-gray-800/80">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Leaderboard
        </h3>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
        {drivers.map((drv, index) => (
          <button
            key={drv.code}
            onClick={() => onSelectDriver(drv.code)}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded transition-all group
              ${selectedDriver === drv.code
                ? 'bg-gray-800 border-l-4 border-l-cyan-500 shadow-lg'
                : 'hover:bg-gray-800/50 border-l-4 border-l-transparent hover:border-l-gray-600'}
            `}
          >
            <div className="flex items-center gap-3">
              {/* Posição (Fictícia por enquanto, baseada na ordem da lista) */}
              <span className={`font-mono font-bold w-4 text-right ${selectedDriver === drv.code ? 'text-white' : 'text-gray-500'}`}>
                {index + 1}
              </span>

              {/* Sigla do Piloto */}
              <span className={`font-bold font-mono text-lg ${selectedDriver === drv.code ? 'text-cyan-400' : 'text-white'}`}>
                {drv.code}
              </span>
            </div>

            {/* Número do Carro */}
            <span className={`text-xs font-mono opacity-50 ${selectedDriver === drv.code ? 'text-cyan-200' : 'text-gray-400'}`}>
              #{drv.number}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;