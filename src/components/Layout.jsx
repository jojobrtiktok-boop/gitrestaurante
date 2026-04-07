import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
