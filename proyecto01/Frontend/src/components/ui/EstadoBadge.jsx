const ESTADOS = {
  CONFIRMADA: { bg: '#16a34a', label: 'Confirmada' },
  APROBADA:   { bg: '#16a34a', label: 'Aprobada'   },
  PENDIENTE:  { bg: '#ca8a04', label: 'Pendiente'  },
  CANCELADA:  { bg: '#dc2626', label: 'Cancelada'  },
  RECHAZADA:  { bg: '#dc2626', label: 'Rechazada'  },
  CONFLICTO:  { bg: '#7f1d1d', label: 'Conflicto'  },
}

export default function EstadoBadge({ estado }) {
  const cfg = ESTADOS[estado?.toUpperCase()] || { bg: '#6b7280', label: estado || '—' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}
