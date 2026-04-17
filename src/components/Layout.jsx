import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import { Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Layout() {
  const { displayReady } = useApp()

  if (!displayReady) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg-main)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 'env(safe-area-inset-bottom)' }}
        className="pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
