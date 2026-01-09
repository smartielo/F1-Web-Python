const DriverSelect = ({ drivers, selectedDriver, onSelectDriver }) => {
  if (drivers.length === 0) return null;

  return (
    <div className="mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
      <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
        Selecione o Piloto
      </h3>

      <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
        {drivers.map((drv) => (
          <button
            key={drv.code}
            onClick={() => onSelectDriver(drv.code)}
            className={`
              px-3 py-1 rounded text-sm font-mono font-bold transition-all border
              ${selectedDriver === drv.code
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(8,145,178,0.5)]'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-500'}
            `}
          >
            {drv.code} <span className="text-[10px] opacity-60 ml-1">#{drv.number}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DriverSelect;