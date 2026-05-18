import { AlertTriangle, X } from 'lucide-react'

export default function ConflictoAlert({ conflictos = [], auditorio, onDismiss }) {
  if (!conflictos.length) return null

  return (
    <div className="bg-red-50 border border-[#C8171E] rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-[#C8171E] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-[#C8171E] text-sm">Conflicto de horario detectado</p>
          {auditorio && (
            <p className="text-sm text-red-700 mt-1">
              El auditorio <strong>{auditorio}</strong> tiene una reserva en ese horario:
            </p>
          )}
          <ul className="mt-2 space-y-1">
            {conflictos.map((c, i) => (
              <li key={i} className="text-sm text-red-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#C8171E] rounded-full" />
                Reserva #{c.reserva_id}: {c.hora_inicio} – {c.hora_fin}
              </li>
            ))}
          </ul>
          <p className="text-sm text-red-600 mt-3 font-medium">
            💡 Sugerencias: se puede redirigir al otro auditorio disponible o cambiar el horario.
          </p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-[#C8171E]">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
