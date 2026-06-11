import { useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid, Image as ImageIcon } from 'lucide-react'

function SedeLabel(location) {
  return location || 'Sede no asignada'
}

export default function SelectorAuditorio({ auditorios, auditorioId, onSelect, error }) {
  const [vista, setVista] = useState('carrusel')
  const [slideIdx, setSlideIdx] = useState(0)

  if (!auditorios || auditorios.length === 0) {
    return (
      <p className="text-gray-500 text-sm col-span-full">
        No hay auditorios disponibles
      </p>
    )
  }

  const slide = auditorios[slideIdx]
  const hayAnterior = slideIdx > 0
  const haySiguiente = slideIdx < auditorios.length - 1

  return (
    <div>
      {/* Toggle de vista */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4 w-fit">
        <button
          type="button"
          onClick={() => setVista('carrusel')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            vista === 'carrusel' ? 'bg-white shadow-sm text-[#C8171E]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageIcon size={14} /> Carrusel
        </button>
        <button
          type="button"
          onClick={() => setVista('cuadricula')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            vista === 'cuadricula' ? 'bg-white shadow-sm text-[#C8171E]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutGrid size={14} /> Cuadrícula
        </button>
      </div>

      {error && (
        <p className="text-[#C8171E] text-xs mb-2">{error}</p>
      )}

      {vista === 'carrusel' ? (
        <div className="relative">
          {/* Slide */}
          <div
            className={`rounded-xl border-2 overflow-hidden transition-all ${
              auditorioId === slide.id
                ? 'border-[#C8171E] ring-2 ring-[#C8171E]/20'
                : 'border-[#E0E0E0]'
            }`}
          >
            {/* Imagen */}
            <div className="w-full h-52 bg-gray-100 bg-cover bg-center relative" style={slide.image ? { backgroundImage: `url(/uploads/auditorios/${slide.image})` } : {}}>
              {!slide.image && (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  Sin imagen
                </div>
              )}
              {/* Navegación en móviles */}
              {hayAnterior && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSlideIdx(i => i - 1) }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow transition"
                >
                  <ChevronLeft size={18} className="text-gray-700" />
                </button>
              )}
              {haySiguiente && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSlideIdx(i => i + 1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow transition"
                >
                  <ChevronRight size={18} className="text-gray-700" />
                </button>
              )}
              {/* Indicador de posicion */}
              {auditorios.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {auditorios.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSlideIdx(i) }}
                      className={`w-2 h-2 rounded-full transition ${
                        i === slideIdx ? 'bg-white shadow' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Información */}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-800 text-base leading-tight">{slide.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{SedeLabel(slide.location)}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-100 rounded-full px-2.5 py-1">
                  {slide.capacity} personas
                </span>
              </div>
              {slide.description && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {slide.description}
                </p>
              )}
            </div>

            {/* Botón seleccionar */}
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => onSelect(slide)}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                  auditorioId === slide.id
                    ? 'bg-green-50 text-green-700 border border-green-300 cursor-default'
                    : 'bg-[#C8171E] hover:bg-[#a01016] text-white'
                }`}
              >
                {auditorioId === slide.id ? 'Seleccionado' : 'Seleccionar este auditorio'}
              </button>
            </div>
          </div>

          {/* Contador */}
          {auditorios.length > 1 && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {slideIdx + 1} de {auditorios.length}
            </p>
          )}
        </div>
      ) : (
        /* Vista cuadrícula */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {auditorios.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a)}
              className={`relative flex flex-col items-start rounded-xl border-2 p-0 overflow-hidden text-left transition-all hover:shadow-md ${
                auditorioId === a.id
                  ? 'border-[#C8171E] ring-2 ring-[#C8171E]/20'
                  : 'border-[#E0E0E0]'
              }`}
            >
              <div
                className="w-full h-32 bg-gray-100 bg-cover bg-center"
                style={a.image ? { backgroundImage: `url(/uploads/auditorios/${a.image})` } : {}}
              >
                {!a.image && (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="p-3 w-full space-y-1">
                <p className="font-semibold text-gray-800 text-sm leading-tight">{a.name}</p>
                <p className="text-xs text-gray-500">{SedeLabel(a.location)}</p>
                <p className="text-xs text-gray-500">Capacidad: {a.capacity} personas</p>
                {a.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{a.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
