import { useState } from 'react'
import {
  X, Building2, User, Calendar, Clock, Users, Mail, Phone,
  CheckCircle2, XCircle, CreditCard, Copy, Check,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { aprobarSolicitud, aprobarSolicitudGratis, rechazarSolicitud, cancelarSolicitud, registrarPago } from '../../api/solicitudesExternasApi'

const CFG_ESTADO = {
  PENDIENTE:    { bg: '#ca8a04', label: 'Pendiente'     },
  PRE_APROBADA: { bg: '#2563eb', label: 'Pre-aprobada'  },
  APROBADA:     { bg: '#16a34a', label: 'Aprobada'      },
  RECHAZADA:    { bg: '#dc2626', label: 'Rechazada'     },
  CANCELADA:    { bg: '#6b7280', label: 'Cancelada'     },
}

const CFG_PAGO = {
  PENDIENTE_PAGO: { bg: '#ca8a04', label: 'Pago pendiente' },
  PARCIAL:        { bg: '#2563eb', label: 'Pago parcial'    },
  PAGADO:         { bg: '#16a34a', label: 'Pagado'          },
  EXENTO:         { bg: '#2563eb', label: 'Exento'          },
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

export default function SolicitudExternaModal({ solicitud, onClose, onActualizar }) {
  const { addToast } = useApp()

  const total = Number(solicitud.tarifaAplicada) || 0
  const costoEquipos = Array.isArray(solicitud.requiereEquipos)
    ? solicitud.requiereEquipos.reduce((sum, e) => {
        if (typeof e === 'object' && e.precioUnitario) return sum + (e.cantidad || 1) * e.precioUnitario
        return sum
      }, 0)
    : 0
  const totalConEquipos = total + costoEquipos
  const mitad = Math.round(totalConEquipos / 2)
  const montoFase2Calculado = total - (solicitud.montoFase1 ?? 0)

  const dentroDe7Dias = (() => {
    if (!solicitud.fecha) return false
    const fechaEvento = new Date(solicitud.fecha + 'T00:00:00')
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const dentroDe7 = new Date(hoy)
    dentroDe7.setDate(dentroDe7.getDate() + 7)
    return fechaEvento <= dentroDe7
  })()

  const [montoFase1, setMontoFase1] = useState(solicitud.montoFase1 ?? mitad ?? '')
  const [montoCompleto, setMontoCompleto] = useState(solicitud.montoFase1 ?? totalConEquipos ?? '')
  const [refFase1, setRefFase1] = useState(solicitud.referenciaFase1 ?? '')
  const [refFase2, setRefFase2] = useState(solicitud.referenciaFase2 ?? '')
  const [notaAdmin, setNotaAdmin] = useState('')
  const [motivo, setMotivo] = useState('')
  const [estadoPago, setEstadoPago] = useState(solicitud.estadoPago || 'PENDIENTE_PAGO')
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [confirmarGratis, setConfirmarGratis] = useState(false)

  if (!solicitud) return null

  const esPersonaNatural = !solicitud.nit

  const copiarCorreo = () => {
    navigator.clipboard.writeText(solicitud.correoContacto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  // ── Aprobar Fase 1 ──────────────────────────────────────────────────
  const handleAprobarFase1 = async () => {
    if (!montoFase1 || isNaN(Number(montoFase1)) || Number(montoFase1) < 0) {
      addToast({ tipo: 'error', mensaje: 'Ingrese un monto válido para la Fase 1' })
      return
    }
    setEnviando(true)
    try {
      await aprobarSolicitud(solicitud.id, { phase: 1, monto: Number(montoFase1), referenciaPago: refFase1, notaAdmin })
      addToast({ tipo: 'exito', mensaje: 'Fase 1 aprobada — reserva creada en calendario' })
      onActualizar({
        ...solicitud,
        estado: 'PRE_APROBADA',
        estadoPago: 'PARCIAL',
        montoFase1: Number(montoFase1),
        referenciaFase1: refFase1,
        notaAdmin,
      })
      onClose()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err?.response?.data?.error || 'Error al aprobar fase 1' })
    } finally {
      setEnviando(false)
    }
  }

  // ── Aprobar pago completo (1 fase) ──────────────────────────────────
  const handleAprobarCompleto = async () => {
    if (!montoCompleto || isNaN(Number(montoCompleto)) || Number(montoCompleto) < 0) {
      addToast({ tipo: 'error', mensaje: 'Ingrese un monto válido' })
      return
    }
    setEnviando(true)
    try {
      await aprobarSolicitud(solicitud.id, { phase: 1, monto: Number(montoCompleto), referenciaPago: refFase1, notaAdmin })
      addToast({ tipo: 'exito', mensaje: 'Solicitud aprobada — pago completo registrado' })
      onActualizar({
        ...solicitud,
        estado: 'APROBADA',
        estadoPago: 'PAGADO',
        montoFase1: Number(montoCompleto),
        referenciaFase1: refFase1,
        notaAdmin,
      })
      onClose()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err?.response?.data?.error || 'Error al aprobar' })
    } finally {
      setEnviando(false)
    }
  }

  // ── Aprobar Fase 2 ──────────────────────────────────────────────────
  const handleAprobarFase2 = async () => {
    if (montoFase2Calculado <= 0) {
      addToast({ tipo: 'error', mensaje: 'El monto restante debe ser mayor a cero' })
      return
    }
    setEnviando(true)
    try {
      await aprobarSolicitud(solicitud.id, { phase: 2, referenciaPago: refFase2, notaAdmin })
      addToast({ tipo: 'exito', mensaje: 'Fase 2 aprobada — solicitud completada' })
      onActualizar({
        ...solicitud,
        estado: 'APROBADA',
        estadoPago: 'PAGADO',
        montoFase2: montoFase2Calculado,
        referenciaFase2: refFase2,
        notaAdmin,
      })
      onClose()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err?.response?.data?.error || 'Error al aprobar fase 2' })
    } finally {
      setEnviando(false)
    }
  }

  // ── Rechazar ─────────────────────────────────────────────────────────
  const handleRechazar = async () => {
    if (!motivo.trim()) {
      addToast({ tipo: 'error', mensaje: 'El motivo de rechazo es obligatorio' })
      return
    }
    setEnviando(true)
    try {
      await rechazarSolicitud(solicitud.id, motivo)
      addToast({ tipo: 'alerta', mensaje: 'Solicitud rechazada' })
      onActualizar({ ...solicitud, estado: 'RECHAZADA' })
      onClose()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err?.response?.data?.error || 'Error al rechazar' })
    } finally {
      setEnviando(false)
    }
  }

  // ── Cancelar ────────────────────────────────────────────────────────
  const handleCancelar = async () => {
    setEnviando(true)
    try {
      await cancelarSolicitud(solicitud.id)
      addToast({ tipo: 'alerta', mensaje: 'Solicitud cancelada' })
      onActualizar({ ...solicitud, estado: 'CANCELADA' })
      onClose()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err?.response?.data?.error || 'Error al cancelar' })
    } finally {
      setEnviando(false)
    }
  }

  // ── Aprobar sin pago (exento) ───────────────────────────────────────
  const handleAprobarGratis = async () => {
    setEnviando(true)
    try {
      await aprobarSolicitudGratis(solicitud.id, {})
      addToast({ tipo: 'exito', mensaje: 'Solicitud aprobada sin pago — reserva creada en calendario' })
      onActualizar({
        ...solicitud,
        estado: 'APROBADA',
        estadoPago: 'EXENTO',
        tarifaAplicada: 0,
      })
      onClose()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err?.response?.data?.error || 'Error al aprobar solicitud' })
    } finally {
      setEnviando(false)
      setConfirmarGratis(false)
    }
  }

  // ── Registrar estado de pago manual ─────────────────────────────────
  const handleRegistrarPago = async () => {
    setEnviando(true)
    try {
      await registrarPago(solicitud.id, { estadoPago })
      addToast({ tipo: 'exito', mensaje: 'Estado de pago actualizado' })
      onActualizar({ ...solicitud, estadoPago })
      onClose()
    } catch (err) {
      addToast({ tipo: 'error', mensaje: err?.response?.data?.error || 'Error al actualizar' })
    } finally {
      setEnviando(false)
    }
  }

  const fmt = (n) => (n != null ? `$${Number(n).toLocaleString('es-CO')} COP` : '—')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

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

          { /* ── Datos de la entidad ─────────────────────────────────── */ }
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Datos de la entidad
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!esPersonaNatural && (
                <>
                  <InfoRow icon={Building2} label="Organización" valor={solicitud.nombreEntidad} />
                  <InfoRow icon={Building2} label="Tipo de entidad" valor={solicitud.tipoEntidad} />
                  {solicitud.nit && solicitud.nit.includes('.pdf') ? (
                    <div className="flex items-start gap-2">
                      <Building2 size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Documento RUT</p>
                        <a
                          href={`/uploads/ruts/${solicitud.nit.split(/[\\/]/).pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#C8171E] underline hover:text-[#a01016]"
                        >
                          Ver PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <InfoRow icon={Building2} label="NIT / RUT" valor={solicitud.nit} mono />
                  )}
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

          { /* ── Datos del evento ────────────────────────────────────── */ }
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Datos del evento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={Calendar} label="Fecha" valor={solicitud.fecha} />
              <InfoRow icon={Clock} label="Horario" valor={`${solicitud.horaInicio} – ${solicitud.horaFin}`} />
              <InfoRow icon={Building2} label="Sede / Auditorio" valor={`${solicitud.sede || '-'} · ${solicitud.auditorio}`} />
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
                  {solicitud.requiereEquipos.map((eq) => {
                    const nombre = typeof eq === 'string' ? eq : eq.nombre
                    const cant = typeof eq === 'object' ? eq.cantidad : null
                    return (
                      <span
                        key={typeof eq === 'string' ? eq : eq.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#C8A84B]/15 text-[#7a5f10] border border-[#C8A84B]/30"
                      >
                        {nombre}{cant ? ` x${cant}` : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          { /* ── Tarifa total ────────────────────────────────────────── */ }
          {total > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <div className="flex items-start gap-3">
                <CreditCard size={16} className="text-green-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700">Tarifa del auditorio</span>
                    <span className="text-sm font-semibold text-green-800">{fmt(total)}</span>
                  </div>
                  {costoEquipos > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-700">Equipos adicionales</span>
                      <span className="text-sm font-semibold text-green-800">{fmt(costoEquipos)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-green-200">
                    <span className="text-xs font-semibold text-green-800">Total</span>
                    <span className="text-sm font-bold text-green-900">{fmt(totalConEquipos)}</span>
                  </div>
                </div>
              </div>
              {solicitud.notaAdmin && (
                <p className="text-xs text-green-700 italic mt-2">"{solicitud.notaAdmin}"</p>
              )}
            </div>
          )}

          { /* ── PENDIENTE → Fase 1 / Pago completo / Rechazar ────────── */ }
          {solicitud.estado === 'PENDIENTE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {dentroDe7Dias ? (
                <section className="border border-violet-200 rounded-xl p-4 bg-violet-50/50">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-violet-800 mb-1">
                    <CheckCircle2 size={15} /> Aprobar (pago completo)
                  </h4>
                  <p className="text-xs text-violet-600 mb-3">
                    El evento es dentro de los próximos 7 días — el pago completo es requerido
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Monto total (COP) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          min={0}
                          value={montoCompleto}
                          onChange={(e) => setMontoCompleto(e.target.value)}
                          placeholder={totalConEquipos ? String(totalConEquipos) : '0'}
                          className="w-full border border-[#E0E0E0] rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Referencia pago{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={refFase1}
                        onChange={(e) => setRefFase1(e.target.value)}
                        placeholder="REC-2026-XXXX"
                        className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Nota interna{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <textarea
                        value={notaAdmin}
                        onChange={(e) => setNotaAdmin(e.target.value)}
                        rows={2}
                        className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none"
                        placeholder="Observaciones..."
                      />
                    </div>
                    <button
                      onClick={handleAprobarCompleto}
                      disabled={enviando}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} /> Aprobar (pago completo)
                    </button>
                  </div>
                </section>
              ) : (
                <section className="border border-blue-200 rounded-xl p-4 bg-blue-50/50">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-blue-800 mb-1">
                    <CheckCircle2 size={15} /> Aprobar Fase 1
                  </h4>
                  <p className="text-xs text-blue-600 mb-3">Crea la reserva en calendario y registra el primer pago</p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Monto Fase 1 (COP) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          min={0}
                          value={montoFase1}
                          onChange={(e) => setMontoFase1(e.target.value)}
                          placeholder={mitad ? String(mitad) : '0'}
                          className="w-full border border-[#E0E0E0] rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Referencia pago Fase 1{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={refFase1}
                        onChange={(e) => setRefFase1(e.target.value)}
                        placeholder="REC-2026-XXXX"
                        className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Nota interna{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <textarea
                        value={notaAdmin}
                        onChange={(e) => setNotaAdmin(e.target.value)}
                        rows={2}
                        className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                        placeholder="Observaciones..."
                      />
                    </div>
                    <button
                      onClick={handleAprobarFase1}
                      disabled={enviando}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} /> Aprobar Fase 1
                    </button>
                  </div>
                </section>
              )}

              <section className="border border-red-200 rounded-xl p-4 bg-red-50/50">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-red-800 mb-3">
                  <XCircle size={15} /> Rechazar solicitud
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Motivo de rechazo *
                    </label>
                    <textarea
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

          { /* ── PENDIENTE → Aprobar sin pago (exento) ────────────────── */ }
          {solicitud.estado === 'PENDIENTE' && (
            <section className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 mb-1">
                <CheckCircle2 size={15} /> Aprobar sin pago
              </h4>
              <p className="text-xs text-emerald-600 mb-3">
                Para usuarios universitarios o casos exentos. Crea la reserva sin costo.
              </p>
              {!confirmarGratis ? (
                <button
                  onClick={() => setConfirmarGratis(true)}
                  disabled={enviando}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  <CheckCircle2 size={15} /> Aprobar sin pago
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleAprobarGratis}
                    disabled={enviando}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                  >
                    {enviando ? 'Aprobando...' : 'Sí, aprobar sin pago'}
                  </button>
                  <button
                    onClick={() => setConfirmarGratis(false)}
                    disabled={enviando}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </section>
          )}

          { /* ── PRE_APROBADA → Fase 2 ───────────────────────────────── */ }
          {solicitud.estado === 'PRE_APROBADA' && (
            <div className="space-y-4">
              <section className="border border-green-200 rounded-xl p-4 bg-green-50/50">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-green-800 mb-2">
                  <CheckCircle2 size={15} /> Fase 1 — Pagada
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold">{fmt(solicitud.montoFase1)}</span>
                </div>
                {solicitud.referenciaFase1 && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Referencia:</span>
                    <span className="font-mono">{solicitud.referenciaFase1}</span>
                  </div>
                )}
              </section>

              <section className="border border-blue-200 rounded-xl p-4 bg-blue-50/50">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-blue-800 mb-1">
                  <CreditCard size={15} /> Aprobar Fase 2
                </h4>
                <p className="text-xs text-blue-600 mb-3">Registra el pago restante y completa la solicitud</p>
                <div className="space-y-3">
                  <div className="bg-blue-100/50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Monto Fase 2 (COP)</span>
                    <span className="text-lg font-bold text-blue-800">{fmt(montoFase2Calculado)}</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Referencia pago Fase 2{' '}
                      <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={refFase2}
                      onChange={(e) => setRefFase2(e.target.value)}
                      placeholder="REC-2026-XXXX"
                      className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleAprobarFase2}
                    disabled={enviando}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} /> Aprobar Fase 2
                  </button>
                </div>
              </section>
            </div>
          )}

          { /* ── APROBADA → Resumen de pagos ─────────────────────────── */ }
          {solicitud.estado === 'APROBADA' && (
            <section className="border border-[#E0E0E0] rounded-xl p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                <CreditCard size={15} /> Pagos realizados
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-green-700 font-medium mb-1">Fase 1</p>
                  <p className="text-sm font-bold text-green-800">{fmt(solicitud.montoFase1)}</p>
                  {solicitud.referenciaFase1 && (
                    <p className="text-xs text-gray-500 mt-0.5">Ref: {solicitud.referenciaFase1}</p>
                  )}
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-green-700 font-medium mb-1">Fase 2</p>
                  <p className="text-sm font-bold text-green-800">{fmt(solicitud.montoFase2)}</p>
                  {solicitud.referenciaFase2 && (
                    <p className="text-xs text-gray-500 mt-0.5">Ref: {solicitud.referenciaFase2}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E0E0E0]">
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Estado de pago
                </label>
                <div className="flex gap-2">
                  <select
                    value={estadoPago}
                    onChange={(e) => setEstadoPago(e.target.value)}
                    className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8171E]/30 focus:border-[#C8171E]"
                  >
                    <option value="PENDIENTE_PAGO">Pago pendiente</option>
                    <option value="PARCIAL">Pago parcial</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="EXENTO">Exento</option>
                  </select>
                  <button
                    onClick={handleRegistrarPago}
                    disabled={enviando}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#111111] hover:bg-gray-800 text-white transition disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </section>
          )}

        </div>

        <div className="px-5 py-3 border-t border-[#E0E0E0] flex items-center justify-between">
          <div>
            {(solicitud.estado === 'PENDIENTE' || solicitud.estado === 'PRE_APROBADA') && (
              <button
                onClick={handleCancelar}
                disabled={enviando}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition disabled:opacity-50"
              >
                <XCircle size={15} /> Cancelar solicitud
              </button>
            )}
          </div>
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


