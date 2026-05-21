import { useState } from 'react'
import {
  X, Building2, User, Calendar, Clock, Users, Mail, Phone,
  CheckCircle2, XCircle, CreditCard, Copy, Check,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { aprobarSolicitud, rechazarSolicitud, registrarPago } from '../../api/solicitudesExternasApi'

// ── Badges internos ──────────────────────────────────────────────────────────

const CFG_ESTADO = {
  PENDIENTE:  { bg: '#ca8a04', label: 'Pendiente'  },
  APROBADA:   { bg: '#16a34a', label: 'Aprobada'   },
  RECHAZADA:  { bg: '#dc2626', label: 'Rechazada'  },
  CANCELADA:  { bg: '#6b7280', label: 'Cancelada'  },
}

const CFG_PAGO = {
  PENDIENTE_PAGO: { bg: '#ca8a04', label: 'Pago pendiente' },
  PAGADO:         { bg: '#16a34a', label: 'Pagado'         },
  EXENTO:         { bg: '#2563eb', label: 'Exento'         },
}

function Badge({ cfg, valor }) {
  const c = cfg[valor?.toUpperCase()] || { bg: '#6b7280', label: valor || '—' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  )
}

// ── Fila de información ──────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, valor, mono }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>
          {valor || '—'}
        </p>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function SolicitudExternaModal({ solicitud, onClose, onActualizar }) {
  const { addToast } = useApp()

  // Estado local de las acciones del admin
  const [tarifaAplicada, setTarifaAplicada] = useState('')
  const [notaAdmin, setNotaAdmin] = useState('')
  const [motivo, setMotivo] = useState('')
  const [estadoPago, setEstadoPago] = useState(solicitud.estadoPago || 'PENDIENTE_PAGO')
  const [referenciaPago, setReferenciaPago] = useState(solicitud.referenciaPago || '')
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  if (!solicitud) return null

  const esPersonaNatural = !solicitud.nit

  // ── Copiar correo ──────────────────────────────────────────────────────────
  const copiarCorreo = () => {
    navigator.clipboard.writeText(solicitud.correoContacto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  // ── Acciones ───────────────────────────────────────────────────────────────

  const handleAprobar = async () => {
    if (!tarifaAplicada || isNaN(Number(tarifaAplicada)) || Number(tarifaAplicada) < 0) {
      addToast({ tipo: 'error', mensaje: 'Ingrese una tarifa válida (número ≥ 0)' })
      return
    }
    setEnviando(true)
    try {
      try {
        await aprobarSolicitud(solicitud.id, {
          tarifaAplicada: Number(tarifaAplicada),
          notaAdmin,
        })
      } catch {
        // Mock: simular respuesta del backend
        await new Promise((r) => setTimeout(r, 800))
      }
      addToast({ tipo: 'exito', mensaje: `Solicitud ${solicitud.id} aprobada correctamente` })
      onActualizar({ ...solicitud, estado: 'APROBADA', tarifaAplicada: Number(tarifaAplicada), notaAdmin })
      onClose()
    } catch {
      addToast({ tipo: 'error', mensaje: 'Error al aprobar la solicitud' })
    } finally {
      setEnviando(false)
    }
  }

  const handleRechazar = async () => {
    if (!motivo.trim()) {
      addToast({ tipo: 'error', mensaje: 'El motivo de rechazo es obligatorio' })
      return
    }
    setEnviando(true)
    try {
      try {
        await rechazarSolicitud(solicitud.id, motivo)
      } catch {
        await new Promise((r) => setTimeout(r, 800))
      }
      addToast({ tipo: 'alerta', mensaje: `Solicitud ${solicitud.id} rechazada` })
      onActualizar({ ...solicitud, estado: 'RECHAZADA' })
      onClose()
    } catch {
      addToast({ tipo: 'error', mensaje: 'Error al rechazar la solicitud' })
    } finally {
      setEnviando(false)
    }
  }

  const handleRegistrarPago = async () => {
    if (estadoPago === 'PAGADO' && !referenciaPago.trim()) {
      addToast({ tipo: 'error', mensaje: 'Ingrese la referencia de pago' })
      return
    }
    setEnviando(true)
    try {
      try {
        await registrarPago(solicitud.id, { estadoPago, referenciaPago })
      } catch {
        await new Promise((r) => setTimeout(r, 800))
      }
      addToast({ tipo: 'exito', mensaje: 'Estado de pago actualizado' })
      onActualizar({ ...solicitud, estadoPago, referenciaPago })
      onClose()
    } catch {
      addToast({ tipo: 'error', mensaje: 'Error al registrar el pago' })
    } finally {
      setEnviando(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#E0E0E0]">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Solicitud externa #{solicitud.id}</p>
            <h3 className="font-bold text-lg text-[#111111]">{solicitud.nombreEvento}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge cfg={CFG_ESTADO} valor={solicitud.estado} />
              <Badge cfg={CFG_PAGO} valor={solicitud.estadoPago} />
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 mt-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* ── Datos de la entidad ── */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Datos de la entidad
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!esPersonaNatural && (
                <>
                  <InfoRow icon={Building2} label="Organización" valor={solicitud.nombreEntidad} />
                  <InfoRow icon={Building2} label="Tipo de entidad" valor={solicitud.tipoEntidad} />
                  <InfoRow icon={Building2} label="NIT / RUT" valor={solicitud.nit} mono />
                </>
              )}
              <InfoRow icon={User} label="Responsable" valor={solicitud.nombreContacto} />
              <InfoRow icon={User} label="Cargo" valor={solicitud.cargoContacto} />
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Correo</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 break-all">
                      {solicitud.correoContacto}
                    </p>
                    <button
                      onClick={copiarCorreo}
                      className="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      title="Copiar correo"
                    >
                      {copiado ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
              <InfoRow icon={Phone} label="Teléfono" valor={solicitud.telefonoContacto} mono />
            </div>
          </section>

          {/* ── Datos del evento ── */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Datos del evento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={Calendar} label="Fecha" valor={solicitud.fecha} />
              <InfoRow icon={Clock} label="Horario" valor={`${solicitud.horaInicio} – ${solicitud.horaFin}`} />
              <InfoRow icon={Building2} label="Sede / Auditorio" valor={`${solicitud.sede} · ${solicitud.auditorio}`} />
              <InfoRow icon={Users} label="Asistentes estimados" valor={solicitud.numAsistentes} />
              <InfoRow label="Tipo de evento" valor={solicitud.tipoEvento} />
              <InfoRow label="Fecha solicitud" valor={new Date(solicitud.fechaSolicitud).toLocaleString('es-CO')} />
            </div>
            {solicitud.descripcionEvento && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Descripción</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                  {solicitud.descripcionEvento}
                </p>
              </div>
            )}
            {solicitud.requiereEquipos?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5">Equipos solicitados</p>
                <div className="flex flex-wrap gap-1.5">
                  {solicitud.requiereEquipos.map((eq) => (
                    <span
                      key={eq}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#C8A84B]/15 text-[#7a5f10] border border-[#C8A84B]/30"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Tarifa aprobada (si ya fue aprobada) ── */}
          {solicitud.estado === 'APROBADA' && solicitud.tarifaAplicada != null && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <CreditCard size={16} className="text-green-700 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-700">Tarifa aprobada</p>
                <p className="text-sm font-bold text-green-800">
                  ${solicitud.tarifaAplicada.toLocaleString('es-CO')} COP
                </p>
              </div>
              {solicitud.notaAdmin && (
                <p className="text-xs text-green-700 ml-auto italic">"{solicitud.notaAdmin}"</p>
              )}
            </div>
          )}

          {/* ── Acciones según estado ── */}

          {/* PENDIENTE: aprobar o rechazar */}
          {solicitud.estado === 'PENDIENTE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Aprobar */}
              <section className="border border-green-200 rounded-xl p-4 bg-green-50/50">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-green-800 mb-3">
                  <CheckCircle2 size={15} /> Aprobar solicitud
                </h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="tarifaAplicada" className="text-xs font-medium text-gray-600 block mb-1">
                      Tarifa (COP) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        id="tarifaAplicada"
                        type="number"
                        min={0}
                        value={tarifaAplicada}
                        onChange={(e) => setTarifaAplicada(e.target.value)}
                        placeholder="0"
                        className="w-full border border-[#E0E0E0] rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="notaAdmin" className="text-xs font-medium text-gray-600 block mb-1">
                      Nota interna{' '}
                      <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <textarea
                      id="notaAdmin"
                      value={notaAdmin}
                      onChange={(e) => setNotaAdmin(e.target.value)}
                      rows={2}
                      className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 resize-none"
                      placeholder="Observaciones internas..."
                    />
                  </div>
                  <button
                    onClick={handleAprobar}
                    disabled={enviando}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} /> Aprobar
                  </button>
                </div>
              </section>

              {/* Rechazar */}
              <section className="border border-red-200 rounded-xl p-4 bg-red-50/50">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-red-800 mb-3">
                  <XCircle size={15} /> Rechazar solicitud
                </h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="motivo" className="text-xs font-medium text-gray-600 block mb-1">
                      Motivo de rechazo *
                    </label>
                    <textarea
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={4}
                      className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
                      placeholder="Explique el motivo del rechazo..."
                    />
                  </div>
                  <button
                    onClick={handleRechazar}
                    disabled={enviando}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-[#C8171E] hover:bg-[#a01016] text-white transition disabled:opacity-50"
                  >
                    <XCircle size={15} /> Rechazar
                  </button>
                </div>
              </section>

            </div>
          )}

          {/* APROBADA: registrar pago */}
          {solicitud.estado === 'APROBADA' && (
            <section className="border border-[#E0E0E0] rounded-xl p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                <CreditCard size={15} /> Registrar estado de pago
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="estadoPago" className="text-xs font-medium text-gray-600 block mb-1">
                    Estado de pago *
                  </label>
                  <select
                    id="estadoPago"
                    value={estadoPago}
                    onChange={(e) => setEstadoPago(e.target.value)}
                    className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 focus:border-[#C8171E]"
                  >
                    <option value="PENDIENTE_PAGO">Pago pendiente</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="EXENTO">Exento</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="referenciaPago" className="text-xs font-medium text-gray-600 block mb-1">
                    Referencia / N° recibo
                    {estadoPago === 'PAGADO' && ' *'}
                    {estadoPago !== 'PAGADO' && (
                      <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                    )}
                  </label>
                  <input
                    id="referenciaPago"
                    type="text"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    placeholder="REC-2026-XXXX"
                    className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 focus:border-[#C8171E]"
                  />
                </div>
              </div>
              <button
                onClick={handleRegistrarPago}
                disabled={enviando}
                className="mt-4 flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-semibold bg-[#111111] hover:bg-gray-800 text-white transition disabled:opacity-50"
              >
                <CreditCard size={15} /> Guardar estado de pago
              </button>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E0E0E0] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-[#E0E0E0] hover:bg-gray-50 text-gray-600 transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
