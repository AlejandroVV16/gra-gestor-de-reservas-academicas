// Genera un color de fondo basado en el nombre para consistencia visual
function colorDesdeNombre(nombre = '') {
  const colores = ['#C8171E', '#374151', '#1d4ed8', '#15803d', '#7c3aed', '#b45309', '#0891b2']
  let suma = 0
  for (const c of nombre) suma += c.charCodeAt(0)
  return colores[suma % colores.length]
}

function iniciales(nombre = '', apellido = '') {
  return `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase() || '?'
}

export default function Avatar({ nombre = '', apellido = '', size = 'md', className = '' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{ backgroundColor: colorDesdeNombre(nombre) }}
      title={`${nombre} ${apellido}`.trim()}
    >
      {iniciales(nombre, apellido)}
    </div>
  )
}
