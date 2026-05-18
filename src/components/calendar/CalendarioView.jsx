import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { MOCK_RESERVAS } from '../../data/mockData'

// Colores por auditorio
function colorAuditorio(auditorio) {
  if (auditorio?.includes('Benjamín')) return { color: '#fecaca', textColor: '#991b1b', borderColor: '#C8171E' }
  if (auditorio?.includes('Rodrigo'))  return { color: '#bfdbfe', textColor: '#1e3a8a', borderColor: '#1d4ed8' }
  if (auditorio?.includes('Auxiliar')) return { color: '#bbf7d0', textColor: '#14532d', borderColor: '#15803d' }
  if (auditorio?.includes('Sistemas')) return { color: '#ddd6fe', textColor: '#4c1d95', borderColor: '#7c3aed' }
  return { color: '#f3f4f6', textColor: '#374151', borderColor: '#6b7280' }
}

// Convertir reservas mock a eventos de FullCalendar
function reservasAEventos(reservas) {
  return reservas.map((r) => {
    const c = r.estado === 'CONFLICTO'
      ? { color: '#7f1d1d', textColor: '#fff', borderColor: '#7f1d1d' }
      : colorAuditorio(r.auditorio)
    return {
      id: String(r.id),
      title: r.evento,
      start: `${r.fecha}T${r.horaInicio}`,
      end:   `${r.fecha}T${r.horaFin}`,
      backgroundColor: c.color,
      textColor:       c.textColor,
      borderColor:     c.borderColor,
      extendedProps: { reserva: r },
    }
  })
}

export default function CalendarioView({ onEventClick, onFechaClick, esAdmin }) {
  const eventos = reservasAEventos(MOCK_RESERVAS)

  return (
    <div className="fc-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="es"
        headerToolbar={{
          left:   'prev,next today',
          center: 'title',
          right:  'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week:  'Semana',
          day:   'Día',
        }}
        events={eventos}
        eventClick={(info) => onEventClick && onEventClick(info.event.extendedProps.reserva)}
        dateClick={(info) => {
          if (esAdmin && onFechaClick) onFechaClick(info.dateStr)
        }}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={3}
        nowIndicator
        selectable={esAdmin}
        eventClassNames="cursor-pointer"
      />

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#E0E0E0]">
        {[
          { label: 'Benjamín Herrera', color: '#fecaca', border: '#C8171E'  },
          { label: 'Rodrigo Rivera',   color: '#bfdbfe', border: '#1d4ed8'  },
          { label: 'Sala Auxiliar',    color: '#bbf7d0', border: '#15803d'  },
          { label: 'Sala Sistemas',    color: '#ddd6fe', border: '#7c3aed'  },
          { label: 'Conflicto',        color: '#7f1d1d', border: '#7f1d1d', text: '#fff' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="w-3 h-3 rounded-sm border"
              style={{ backgroundColor: l.color, borderColor: l.border }}
            />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
