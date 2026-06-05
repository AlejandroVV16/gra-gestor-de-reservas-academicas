const ROLES = {
  ADMINISTRADOR: { bg: '#C8171E', label: 'Administrador' },
  PERSONAL_TI:   { bg: '#374151', label: 'Personal TI'   },
}

export default function RolBadge({ rol }) {
  const cfg = ROLES[rol?.toUpperCase()] || { bg: '#6b7280', label: rol || '—' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}
