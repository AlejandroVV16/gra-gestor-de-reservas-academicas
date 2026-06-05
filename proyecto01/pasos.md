# Pasos pendientes para completar la plataforma

## Funcionalidades faltantes por desarrollar

| # | Funcionalidad | Frontend | Backend | Prioridad |
|---|---|---|---|---|
| 1 | **Historial de cambios** (`/historial`) | ✅ Página completa con filtros, tabla, export CSV | ❌ No existe ruta `GET /api/history` ni controlador | **Alta** |
| 2 | **Reportes / Estadísticas** (`/reportes`) | ✅ Página con gráficos Recharts, filtros, export CSV/PDF | ❌ No existen rutas `GET /api/reports/summary` ni `GET /api/reports/export` | **Alta** |
| 3 | **Gestión de solicitudes externas** (`/solicitudes-externas`) | ✅ Modal completo: aprobar, rechazar, registrar pago | ❌ No existen rutas `/solicitudes-externas` (GET, POST, PATCH) | **Alta** |
| 4 | **Persistencia de solicitudes externas** | ✅ Formulario público (`/solicitud-externa`) | ⚠️ Solo envía email vía Resend, NO guarda en DB | **Alta** |
| 5 | **API de pagos** | ✅ UI para registrar pago en `SolicitudExternaModal` | ❌ No existe ruta para crear/actualizar pagos (tabla `payments` sí existe en schema) | **Media** |
| 6 | **Asignación de Personal TI a reservas** | ✅ Formularios tienen campo para asignar TI | ❌ DB no tiene tabla de relación many-to-many | **Media** |
| 7 | **Role-based authorization middleware** | ✅ Frontend restringe rutas por rol | ❌ Backend no valida `user_type` en endpoints protegidos | **Media** |
| 8 | **Secciones / divisibilidad de auditorios** | ✅ `SelectorSecciones.jsx` componente completo | ❌ DB/backend no tiene concepto de secciones | **Baja** |
| 9 | **Subida de fotos de auditorios** | ✅ `AuditorioModal` drag-and-drop (con aviso "en desarrollo") | ❌ No hay almacenamiento de imágenes | **Baja** |
| 10 | **Exportación PDF** | ✅ Botón de PDF deshabilitado con toast "en desarrollo" | ❌ No implementado | **Baja** |
| 11 | **Sistema de notificaciones** | ✅ Header tiene ícono de campana | ❌ No implementado | **Baja** |
| 12 | **Variables de entorno** | - | ⚠️ Secrets hardcodeados en `podman-compose.yml`, falta archivo `.env` | **Media** |
| 13 | **Manejo global de errores** | - | ❌ No hay middleware centralizado de errores | **Baja** |
| 14 | **Configuración CORS** | - | ⚠️ `cors` instalado pero no configurado en `index.js` | **Media** |

---

## Observaciones adicionales

- **Dashboard**, **NuevaReserva**, **EditarReserva**, **Personal**, **Historial**, **Reportes** y **SolicitudesExternas** aún dependen de `mockData.js` como fallback — sin el backend correspondiente no funcionan realmente.
- La moneda en `tariffs` está como `CLP` pero debería ser `COP` (Colombia).
- El backend usa Express 5, que tiene cambios con respecto a Express 4 en el manejo de parámetros de ruta.
- El email de notificación de solicitudes externas está hardcodeado a `julirios21.jr@gmail.com` en vez de ser configurable.
- El JWT expira en 8 horas y no hay soporte para refresh token.
