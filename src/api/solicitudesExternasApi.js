import axiosInstance from './axiosInstance'

export const crearSolicitudExterna = (data) =>
  axiosInstance.post('/solicitudes-externas', data)

export const getSolicitudesExternas = (params) =>
  axiosInstance.get('/solicitudes-externas', { params })

export const getSolicitudExterna = (id) =>
  axiosInstance.get(`/solicitudes-externas/${id}`)

export const aprobarSolicitud = (id, datos) =>
  axiosInstance.patch(`/solicitudes-externas/${id}/aprobar`, datos)

export const rechazarSolicitud = (id, motivo) =>
  axiosInstance.patch(`/solicitudes-externas/${id}/rechazar`, { motivo })

export const registrarPago = (id, datos) =>
  axiosInstance.patch(`/solicitudes-externas/${id}/pago`, datos)
