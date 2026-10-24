import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, Topbar, MobileDrawer } from './Chrome'
import { CreateProvider } from '../create/CreateProvider'

/** Contenedor de la app autenticada: sidebar fija + topbar + contenido. */
export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  // Al cambiar de vista se vuelve arriba (como el Navigator de Flutter).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    mainRef.current?.scrollTo?.({ top: 0 })
  }, [location.pathname])

  return (
    <CreateProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setDrawerOpen(true)} />
          <main ref={mainRef} className="flex-1 px-3.5 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto w-full max-w-[1180px]">
              <Outlet />
            </div>
          </main>
          <footer className="border-t border-line/60 px-4 py-4 text-center text-[11px] text-dim">
            DevPlay · React 19 + FastAPI · hecho por la comunidad
          </footer>
        </div>
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </CreateProvider>
  )
}
