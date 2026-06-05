export default function KpiCard({ titulo, valor, subtitulo, icono: Icono, color = '#C8171E' }) {
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-5 flex items-start gap-4 border-l-4"
      style={{ borderLeftColor: color }}
    >
      {Icono && (
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icono size={20} style={{ color }} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-3xl font-bold text-[#111111] leading-none mb-1">{valor}</p>
        <p className="text-sm font-semibold text-gray-800">{titulo}</p>
        {subtitulo && <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>}
      </div>
    </div>
  )
}
