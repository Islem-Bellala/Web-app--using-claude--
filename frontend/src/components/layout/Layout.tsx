/**
 * Layout — Fixed 100vh × 100vw shell with Topbar + Sidebar + scrollable content.
 * This is the outer authenticated shell. Login page is rendered outside this.
 */

import type { ReactNode } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import { useUIStore } from '../../stores'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-atlas-bg dark:bg-atlas-dark-bg">
      <Topbar onOpenSidebar={() => setSidebarOpen(true)} sidebarOpen={sidebarOpen} />

      {/* Body: sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {/* Main content: the ONLY scrollable region */}
        <main className="flex-1 overflow-y-auto bg-atlas-bg dark:bg-atlas-dark-bg">
          {children}
        </main>
      </div>
    </div>
  )
}
