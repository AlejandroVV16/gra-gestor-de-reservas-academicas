/**
 * SelectorSecciones
 * Plano interactivo 2×2 del auditorio Rodrigo Rivera.
 * Permite seleccionar una o varias secciones independientes.
 *
 * Props:
 *   secciones      — array completo de secciones del auditorio
 *                    [{ id, label, capacidad }]
 *   seleccionadas  — array de ids seleccionados, p.ej. ['SI', 'SD']
 *   ocupadas       — array de ids que ya están reservadas (gris, no clickables)
 *   onChange       — callback(nuevasSeleccionadas: string[])
 */
export default function SelectorSecciones({
  secciones = [],
  seleccionadas = [],
  ocupadas = [],
  onChange,
}) {
  const toggle = (id) => {
    if (ocupadas.includes(id)) return
    const ya = seleccionadas.includes(id)
    onChange(ya ? seleccionadas.filter((s) => s !== id) : [...seleccionadas, id])
  }

  // Orden fijo del plano: fila superior [SI, SD], fila inferior [II, ID]
  const orden = ['SI', 'SD', 'II', 'ID']
  const ordenadas = orden.map((id) => secciones.find((s) => s.id === id)).filter(Boolean)

  const capacidadTotal = seleccionadas.reduce((acc, id) => {
    const s = secciones.find((s) => s.id === id)
    return acc + (s?.capacidad || 0)
  }, 0)

  return (
    <div className="space-y-2">
      {/* Indicador de tarima */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#E0E0E0]" />
        <span className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-2 whitespace-nowrap">
          ▲ Tarima / Pantalla
        </span>
        <div className="flex-1 h-px bg-[#E0E0E0]" />
      </div>

      {/* Cuadrícula 2×2 */}
      <div className="grid grid-cols-2 gap-2">
        {ordenadas.map((sec) => {
          const seleccionada = seleccionadas.includes(sec.id)
          const ocupada      = ocupadas.includes(sec.id)
          return (
            <button
              key={sec.id}
              type="button"
              disabled={ocupada}
              onClick={() => toggle(sec.id)}
              className={`
                relative rounded-lg border-2 p-3 text-left transition-all duration-150
                ${ocupada
                  ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                  : seleccionada
                    ? 'bg-[#C8171E] border-[#C8171E] text-white shadow-md scale-[1.02]'
                    : 'bg-white border-[#E0E0E0] hover:border-[#C8171E]/50 hover:bg-red-50 cursor-pointer'
                }
              `}
            >
              {/* Etiqueta de estado */}
              {(seleccionada || ocupada) && (
                <span className={`
                  absolute top-1.5 right-2 text-[9px] font-bold tracking-wider uppercase
                  ${seleccionada ? 'text-white/80' : 'text-gray-400'}
                `}>
                  {seleccionada ? '✓ Sel.' : 'Ocupado'}
                </span>
              )}

              {/* Nombre sección */}
              <p className={`text-xs font-semibold leading-tight ${seleccionada ? 'text-white' : 'text-gray-700'}`}>
                {sec.label}
              </p>

              {/* Capacidad */}
              <p className={`text-[11px] mt-0.5 ${seleccionada ? 'text-white/75' : 'text-gray-400'}`}>
                {sec.capacidad} personas
              </p>
            </button>
          )
        })}
      </div>

      {/* Indicador de pasillos */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#E0E0E0]" />
        <span className="text-[10px] text-gray-300 px-2">▼ Entrada / Pasillos</span>
        <div className="flex-1 h-px bg-[#E0E0E0]" />
      </div>

      {/* Resumen capacidad seleccionada */}
      {seleccionadas.length > 0 && (
        <div className="flex items-center justify-between bg-[#C8171E]/8 border border-[#C8171E]/20 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-600">
            {seleccionadas.length === 1 ? '1 sección seleccionada' : `${seleccionadas.length} secciones seleccionadas`}
          </span>
          <span className="text-xs font-bold text-[#C8171E]">
            Capacidad: {capacidadTotal} personas
          </span>
        </div>
      )}

      {seleccionadas.length === 0 && (
        <p className="text-xs text-gray-400 text-center pt-1">
          Haz clic en una sección para seleccionarla
        </p>
      )}
    </div>
  )
}
