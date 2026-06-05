import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Reservas from '../pages/Reservas'
import NuevaReserva from '../pages/NuevaReserva'
import EditarReserva from '../pages/EditarReserva'
import Calendario from '../pages/Calendario'
import Auditorios from '../pages/Auditorios'
import Personal from '../pages/Personal'
import Historial from '../pages/Historial'
import Homepage from '../pages/Homepage'
import Reportes from '../pages/Reportes'
import SolicitudExterna from '../pages/SolicitudExterna'
import SolicitudesExternas from '../pages/SolicitudesExternas'

function ProtectedRoute({ children, soloAdmin = false }) {
  const { user, esAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (soloAdmin && !esAdmin) return <Navigate to="/dashboard" replace />
  return children
}

export default function AppRouter() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />

        <Route path="/solicitud-externa" element={<SolicitudExterna />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reservas" element={<Reservas />} />
          <Route path="/reservas/nueva" element={
            <ProtectedRoute soloAdmin>
              <NuevaReserva />
            </ProtectedRoute>
          } />
          <Route path="/reservas/:id/editar" element={
            <ProtectedRoute soloAdmin>
              <EditarReserva />
            </ProtectedRoute>
          } />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/auditorios" element={
            <ProtectedRoute soloAdmin>
              <Auditorios />
            </ProtectedRoute>
          } />
          <Route path="/personal" element={
            <ProtectedRoute soloAdmin>
              <Personal />
            </ProtectedRoute>
          } />
          <Route path="/historial" element={
            <ProtectedRoute soloAdmin>
              <Historial />
            </ProtectedRoute>
          } />
          <Route path="/reportes" element={
            <ProtectedRoute soloAdmin>
              <Reportes />
            </ProtectedRoute>
          } />
          <Route path="/solicitudes-externas" element={
            <ProtectedRoute soloAdmin>
              <SolicitudesExternas />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
