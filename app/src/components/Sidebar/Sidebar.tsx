import { useEffect } from 'react'
import { X, Settings } from 'lucide-react'

import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {

  // Fechar sidebar ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll do body quando sidebar está aberta
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const closeSidebar = () => {
    onClose()
  }

  return (
    <>
      {/* Overlay escuro */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Agora abre da direita para a esquerda */}
      <div
        className={`fixed top-0 right-0 h-full w-[600px] bg-gradient-to-b from-gray-900 to-gray-800 border-l border-orange-500/30 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header do Sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-orange-500/30">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Configurações</h2>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center text-gray-400">
            <p>Configurações em desenvolvimento</p>
          </div>
        </div>

        {/* Footer do Sidebar */}
        <div className="p-6 border-t border-orange-500/30">
          <div className="text-center text-gray-400 text-sm">
            <p>Configurações salvas automaticamente</p>
            <p className="text-xs mt-1">Alest Consultoria</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
