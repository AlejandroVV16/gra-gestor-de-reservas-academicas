const SEDES = {
  CENTRO:   { bg: '#1d4ed8', label: 'Centro'   },
  BELMONTE: { bg: '#15803d', label: 'Belmonte' },
}

export default function SedeBadge({ sede }) {
  const key = sede?.toUpperCase().replace(/\s+/g, '_')
  const cfg = SEDES[key] || { bg: '#6b7280', label: sede || '—' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}
