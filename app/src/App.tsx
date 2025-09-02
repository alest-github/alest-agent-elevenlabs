import { useState, Suspense, lazy } from 'react'

// Lazy loading dos componentes
const Header = lazy(() => import('./components/Header'))
const Home = lazy(() => import('./components/Home'))

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Suspense fallback={<div className="flex items-center justify-center h-16 bg-gray-800">Carregando...</div>}>
        <Header onMenuClick={toggleSidebar} />
      </Suspense>
      <main className="py-2">
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-white">Carregando aplicação...</div>}>
          <Home 
            isSidebarOpen={isSidebarOpen} 
            onCloseSidebar={closeSidebar}
          />
        </Suspense>
      </main>
    </div>
  )
}

export default App
