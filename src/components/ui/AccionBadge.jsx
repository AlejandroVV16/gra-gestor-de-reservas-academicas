const ACCIONES = {
  CREADA:             { bg: '#16a34a', label: 'Creada'             },
  EDITADA:            { bg: '#2563eb', label: 'Editada'            },
  CANCELADA:          { bg: '#dc2626', label: 'Cancelada'          },
  CONFLICTO_RESUELTO: { bg: '#ca8a04', label: 'Conflicto resuelto' },
}

export default function AccionBadge({ accion }) {
  const cfg = ACCIONES[accion?.toUpperCase()] || { bg: '#6b7280', label: accion || '—' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}
