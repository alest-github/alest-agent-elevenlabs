import { X, Settings, Key, User } from 'lucide-react'
import { useEffect, useState } from 'react'

import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('')
  const [agentId, setAgentId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = JSON.parse(localStorage.getItem('elevenlabs-config') || '{}')
    setApiKey(savedConfig.apiKey || '')
    setAgentId(savedConfig.agentId || '')
  }, [isOpen])

  // Salvar configurações
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      const config = { apiKey, agentId }
      localStorage.setItem('elevenlabs-config', JSON.stringify(config))
      setSaveMessage('Configurações salvas com sucesso!')
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setSaveMessage('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  // Fechar sidebar ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    if (isOpen) {
      // Usar capture para garantir que o evento seja capturado
      document.addEventListener('keydown', handleEscape, { capture: true })
      // Prevenir scroll do body quando sidebar está aberta
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape, { capture: true })
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
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 cursor-pointer"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            closeSidebar()
          }}
          onMouseDown={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar - Agora abre da direita para a esquerda */}
      <div
        className={`fixed top-0 right-0 h-full w-[600px] max-w-[90vw] bg-gradient-to-b from-gray-900 to-gray-800 border-l border-orange-500/30 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header do Sidebar */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-orange-500/30 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">Configurações</h2>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200 flex-shrink-0 ml-2"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Configurações ElevenLabs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Key className="h-5 w-5 text-orange-400" />
              <span>ElevenLabs API</span>
            </h3>
            
            {/* API Key */}
            <div className="space-y-2">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300">
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400">
                Obtenha sua API key em{' '}
                <a 
                  href="https://elevenlabs.io/app/speech-synthesis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  elevenlabs.io
                </a>
              </p>
            </div>

            {/* Agent ID */}
            <div className="space-y-2">
              <label htmlFor="agentId" className="block text-sm font-medium text-gray-300">
                Agent ID (opcional)
              </label>
              <input
                id="agentId"
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="agent_..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400">
                ID do agente conversacional (necessário apenas para o Agente de Voz)
              </p>
            </div>

            {/* Botão Salvar */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Configurações</span>
              )}
            </button>

            {/* Mensagem de feedback */}
            {saveMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                saveMessage.includes('sucesso') 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {saveMessage}
              </div>
            )}
          </div>

          {/* Informações de uso */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <User className="h-5 w-5 text-orange-400" />
              <span>Como usar</span>
            </h3>
            
            <div className="space-y-3 text-sm text-gray-300">
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-white mb-2">🎤 Agente de Voz</h4>
                <p>Configure tanto a API Key quanto o Agent ID para usar o agente conversacional.</p>
              </div>
              
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-white mb-2">📝 Speech to Text</h4>
                <p>Configure apenas a API Key para converter áudio em texto.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer do Sidebar */}
        <div className="p-4 sm:p-6 border-t border-orange-500/30 flex-shrink-0">
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
