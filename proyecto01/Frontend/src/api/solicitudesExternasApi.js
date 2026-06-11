import axiosInstance from './axiosInstance'

export const crearSolicitudExterna = (data, esFormData = false) =>
  axiosInstance.post('/api/solicitudes-externas', data, {
    headers: esFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })

export const getSolicitudesExternas = (params) =>
  axiosInstance.get('/api/solicitudes-externas', { params })

export const getSolicitudExterna = (id) =>
  axiosInstance.get(`/api/solicitudes-externas/${id}`)

export const aprobarSolicitud = (id, datos) =>
  axiosInstance.patch(`/api/solicitudes-externas/${id}/aprobar`, datos)

export const aprobarSolicitudGratis = (id, datos) =>
  axiosInstance.patch(`/api/solicitudes-externas/${id}/aprobar-gratis`, datos)

export const rechazarSolicitud = (id, motivo) =>
  axiosInstance.patch(`/api/solicitudes-externas/${id}/rechazar`, { motivo })

export const cancelarSolicitud = (id, motivo) =>
  axiosInstance.patch(`/api/solicitudes-externas/${id}/cancelar`, { motivo })

export const registrarPago = (id, datos) =>
  axiosInstance.patch(`/api/solicitudes-externas/${id}/pago`, datos)
