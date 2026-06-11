const ESTADOS = {
  CONFIRMADA: { bg: '#16a34a', label: 'Confirmada' },
  APROBADA:   { bg: '#16a34a', label: 'Aprobada'   },
  PENDIENTE:  { bg: '#ca8a04', label: 'Pendiente'  },
  PRE_APROBADA: { bg: '#2563eb', label: 'Pre-aprobada' },
  CANCELADA:  { bg: '#dc2626', label: 'Cancelada'  },
  RECHAZADA:  { bg: '#dc2626', label: 'Rechazada'  },
  CONFLICTO:  { bg: '#7f1d1d', label: 'Conflicto'  },
}

export default function EstadoBadge({ estado, cfg: cfgCustom, valor }) {
  const val = valor ?? estado
  const mapa = cfgCustom || ESTADOS
  const cfg = mapa[val?.toUpperCase()] || { bg: '#6b7280', label: val || '—' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}
