import { useState, Suspense, lazy } from 'react'

// Lazy loading dos componentes
const Header = lazy(() => import('./components/Header'))
const Home = lazy(() => import('./components/Home'))
const SpeechToText = lazy(() => import('./components/SpeechToText'))
const Sidebar = lazy(() => import('./components/Sidebar/Sidebar'))

type ActiveView = 'voice-agent' | 'speech-to-text'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<ActiveView>('voice-agent')

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
      
      {/* Navegação entre funcionalidades */}
      <nav className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveView('voice-agent')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'voice-agent'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              🎤 Agente de Voz
            </button>
            <button
              onClick={() => setActiveView('speech-to-text')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'speech-to-text'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              📝 Speech to Text
            </button>
          </div>
        </div>
      </nav>

      <main className="py-2">
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-white">Carregando aplicação...</div>}>
          {activeView === 'voice-agent' && <Home />}
          {activeView === 'speech-to-text' && (
            <div className="container mx-auto px-4 py-8">
              <SpeechToText />
            </div>
          )}
        </Suspense>
      </main>
      
      <Suspense fallback={<div>Carregando sidebar...</div>}>
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </Suspense>
    </div>
  )
}

export default App
