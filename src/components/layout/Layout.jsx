import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    /*
      CORRECCIÓN 1: h-screen + overflow-hidden en el wrapper raíz.
      Esto le da una altura DEFINIDA al padre para que los hijos con
      h-full / h-screen puedan resolverla correctamente.
    */
    <div className="h-screen overflow-hidden flex bg-[#F5F5F5]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/*
        El sidebar es siempre fixed, por eso necesitamos ml-[240px]
        en desktop para que el contenido no quede debajo de él.
        overflow-y-auto aquí (no en main) para que el scroll sea
        del área completa debajo del header.
      */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px] h-screen overflow-y-auto overflow-x-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/*
          CORRECCIÓN 2 — padding-top NO puede ser un shorthand.
          Cascada CSS en desktop:
            1) p-4  → padding: 1rem  (base)
            2) pt-16 → padding-top: 4rem  (base, gana sobre p-4 ✓)
            3) lg:p-6 → padding: 1.5rem  (@media → MAYOR precedencia,
               resetea padding-top a 24px y el contenido queda detrás del header)
          Solución: usar SOLO utilidades de lado específico para evitar
          que ningún shorthand pueda pisar el padding-top de 64px.
        */}
        <main className="flex-1 pt-16 px-4 pb-4 lg:px-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
