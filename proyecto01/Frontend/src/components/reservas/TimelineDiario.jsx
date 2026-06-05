import { useState, useEffect } from 'react'
import { Clock, Check } from 'lucide-react'
import { getHorario } from '../../api/auditoriosApi'

const HORA_INICIO = 6
const HORA_FIN = 23

function generarBloques(ocupados, fecha) {
  if (!ocupados) return []
  const bloques = []
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    const startStr = `${String(h).padStart(2, '0')}:00`
    const endStr = `${String(h + 1).padStart(2, '0')}:00`

    const conflictos = ocupados.filter((o) => {
      const oInicio = o.hora_inicio
      const oFin = o.hora_fin
      return oInicio < endStr && oFin > startStr
    })

    bloques.push({
      hora: h,
      label: startStr,
      ocupado: conflictos.length > 0,
      eventos: conflictos,
    })
  }
  return bloques
}

export default function TimelineDiario({ auditorioId, fecha, onTimeSelect, selected }) {
  const [bloques, setBloques] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [startSel, setStartSel] = useState(null)
  const [opciones, setOpciones] = useState([])

  useEffect(() => {
    setOpciones([])
    setStartSel(null)
    if (!auditorioId || !fecha) {
      setBloques([])
      return
    }
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const { data } = await getHorario(auditorioId, fecha)
        setBloques(generarBloques(data.bloques_ocupados, fecha))
      } catch {
        setBloques(generarBloques([], fecha))
        setError('No se pudo cargar la disponibilidad')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [auditorioId, fecha])

  const handleHoraClick = (horaInicio) => {
    const disponibles = []
    for (const dur of [4, 6]) {
      const horaFin = horaInicio + dur
      if (horaFin > HORA_FIN) continue

      const libre = Array.from({ length: dur }, (_, i) => horaInicio + i)
        .every((h) => {
          const b = bloques.find((b) => b.hora === h)
          return b && !b.ocupado
        })

      if (libre) {
        disponibles.push({
          duracion: dur,
          horaInicio: `${String(horaInicio).padStart(2, '0')}:00`,
          horaFin: `${String(horaFin).padStart(2, '0')}:00`,
        })
      }
    }

    if (disponibles.length === 0) return

    setStartSel(horaInicio)
    setOpciones(disponibles)
  }

  const confirmarOpcion = (op) => {
    onTimeSelect({ horaInicio: op.horaInicio, horaFin: op.horaFin })
    setOpciones([])
    setStartSel(null)
  }

  const isSelected = (hora) => {
    if (!selected?.horaInicio) return false
    const h = parseInt(selected.horaInicio.split(':')[0])
    const hFin = parseInt(selected.horaFin.split(':')[0])
    return hora >= h && hora < hFin
  }

  const bloqueEsSeleccionable = (hora) => {
    if (hora + 4 > HORA_FIN) return false
    for (const dur of [4, 6]) {
      if (hora + dur > HORA_FIN) continue
      const libre = Array.from({ length: dur }, (_, i) => hora + i)
        .every((h) => {
          const b = bloques.find((b) => b.hora === h)
          return b && !b.ocupado
        })
      if (libre) return true
    }
    return false
  }

  if (!auditorioId || !fecha) {
    return (
      <div className="text-sm text-gray-400 py-4 text-center">
        Selecciona un auditorio y fecha para ver la disponibilidad
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Clock size={14} className="text-[#C8171E]" />
        <span className="font-semibold text-gray-700 text-sm">Disponibilidad horaria</span>
        {cargando && (
          <span className="inline-block w-3 h-3 ml-1 border-2 border-[#C8171E] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-600 mb-2">{error}</p>
      )}

      <div className="space-y-0.5 max-h-80 overflow-y-auto pr-1">
        {bloques.slice(0, -1).map((b) => {
          const sel = isSelected(b.hora)
          const seleccionable = !b.ocupado && bloqueEsSeleccionable(b.hora)
          return (
            <div
              key={b.hora}
              onClick={() => seleccionable && handleHoraClick(b.hora)}
              className={`
                flex items-center h-7 rounded text-xs cursor-pointer transition-all select-none
                ${sel
                  ? 'bg-[#C8171E] text-white font-medium'
                  : b.ocupado
                    ? 'bg-red-50 text-red-600 cursor-not-allowed'
                    : seleccionable
                      ? 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <span className="w-12 text-center font-mono text-[11px] opacity-70">{b.label}</span>
              <div className="flex-1 px-2 truncate text-[11px]">
                {b.ocupado
                  ? b.eventos[0]?.evento || 'Ocupado'
                  : seleccionable
                    ? 'Disponible'
                    : '—'
                }
              </div>
              {sel && <Check size={12} className="mr-2" />}
            </div>
          )
        })}
      </div>

      {opciones.length > 0 && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-800 mb-1.5">
            Desde las {String(startSel).padStart(2, '0')}:00 — ¿Cuántas horas necesitas?
          </p>
          <div className="flex gap-1.5">
            {opciones.map((op) => (
              <button
                key={op.duracion}
                onClick={() => confirmarOpcion(op)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 rounded text-xs text-blue-700 hover:bg-blue-50 font-medium transition-colors"
              >
                {op.duracion} horas
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
