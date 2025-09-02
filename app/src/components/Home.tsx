import React, { useEffect, useState, useRef } from 'react'
import { useConversation } from '@elevenlabs/react'
import Sidebar from './Sidebar/Sidebar'

interface HomeProps {
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

const Home: React.FC<HomeProps> = ({ isSidebarOpen, onCloseSidebar }) => {
  const [agentName, setAgentName] = useState('')

  const [volume, setVolume] = useState(1)
  const [micMuted, setMicMuted] = useState(false)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [isConversationActive, setIsConversationActive] = useState(false)
  const [audioBarHeights, setAudioBarHeights] = useState([12, 12, 12, 12, 12]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    textOnly: true,
    onConnect: () => {
      setIsConversationActive(true)
    },
    onDisconnect: () => {
      setIsConversationActive(false)
      setMicMuted(false)
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error)
      alert('Erro na conexão com o agente de voz. Verifique sua conexão.')
    },
    onStatusChange: (statusObj) => {
      const currentStatus = statusObj.status || statusObj
      

      if (currentStatus === 'connected' || currentStatus === 'connecting') {
        setIsConversationActive(true)
      } else if (currentStatus === 'disconnected') {
        setIsConversationActive(false)
        setMicMuted(false)
      }
    },
    preferHeadphonesForIosDevices: true,
    connectionDelay: {
      android: 1000,
      ios: 800,
      default: 500
    },
    micMuted: micMuted,
    volume: volume,
    useWakeLock: true
  })

  // Animação das barrinhas de áudio
  useEffect(() => {
    if (isConversationActive) {
      const animate = () => {
        const newHeights = Array.from({ length: 5 }, (_, i) => {
          const baseHeight = 12;
          // Intensidade maior quando o agente está falando
          const intensity = conversation.isSpeaking ? 1 : 0.5;
          const variation = Math.sin(Date.now() * 0.005 + i * 0.8) * 8 * intensity + Math.random() * 4 * intensity;
          return Math.max(baseHeight, baseHeight + variation);
        });
        setAudioBarHeights(newHeights);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      setAudioBarHeights([12, 12, 12, 12, 12]);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isConversationActive, conversation.isSpeaking]);

  useEffect(() => {
    const loadAgent = () => {
      try {
        const saved = localStorage.getItem('agent-name')
        if (saved) {
          setAgentName(saved)
        }
      } catch (error) {
        console.error('Erro ao carregar nome do agente:', error)
      }
    }
    loadAgent()
  }, [])



  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setMicPermission('granted')
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setMicPermission('denied')
      alert('Permissão do microfone é necessária para usar o agente de voz.')
      return false
    }
  }

  const handleStartConversation = async () => {
    if (micPermission !== 'granted') {
      const granted = await requestMic()
      if (!granted) {
        return
      }
    }

    
    const savedConfig = JSON.parse(localStorage.getItem('elevenlabs-config') || '{}')
      const agentId = savedConfig.agentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'local-agent-demo'
    
    if (!agentId) {
      alert('Configuração necessária: Configure o Agent ID nas configurações do agente.')
      return
    }

    try {
        setIsConversationActive(true)
        
        await conversation.startSession({
          agentId,
          connectionType: 'webrtc',
          ...(streamRef.current ? { inputStream: streamRef.current as unknown as MediaStream } : {})
        })
    } catch (error) {
      console.error('Failed to start session:', error)
      setIsConversationActive(false)
      alert('Erro ao iniciar sessão com o agente de voz. Verifique se o Agent ID está correto e se você tem créditos disponíveis no ElevenLabs.')
    }
  }

  const handleEndConversation = async () => {
    try {
      await conversation.endSession()
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }
      
      setIsConversationActive(false)
      setMicMuted(false)
      
    } catch (error) {
      console.error('🚨 Erro ao encerrar sessão:', error)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      setIsConversationActive(false)
      setMicMuted(false)
    }
  }

  return (
    <>
      {/* Sidebar de Configuração (reuso) */}
      <Sidebar isOpen={isSidebarOpen} onClose={onCloseSidebar} />

      {/* Conteúdo principal minimalista com orbe e chat */}
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
        {/* Orbe central */}
        <div className="relative mb-4 sm:mb-6 lg:mb-8 flex flex-col items-center w-full max-w-md">
          <div className={`w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-full opacity-90 transition-all duration-150 anexa-voice-visual ${
            isConversationActive
              ? conversation.isSpeaking
                ? 'shadow-[0_0_140px_rgba(34,197,94,0.6)] bg-gradient-to-tr from-green-400 via-emerald-300 to-teal-400 scale-105'
                : 'shadow-[0_0_120px_rgba(34,197,94,0.4)] bg-gradient-to-tr from-green-500 via-emerald-400 to-teal-500 animate-pulse'
              : 'shadow-[0_0_100px_rgba(59,130,246,0.25)] bg-gradient-to-tr from-cyan-600 via-blue-500 to-indigo-500 animate-spin'
          }`}>
            {/* Efeito de pulsar/radar verde quando ativo */}
            {isConversationActive && conversation.isSpeaking && (
              <>
                <span className="anexa-voice-visual__pulse" />
                <span className="anexa-voice-visual__pulse anexa-voice-visual__pulse--delay" />
              </>
            )}
          </div>
          {/* borda/halo suave */}
          <div className={`absolute inset-0 rounded-full blur-2xl opacity-25 transition-all duration-150 pointer-events-none ${
            isConversationActive
              ? conversation.isSpeaking
                ? 'bg-gradient-to-br from-green-300 via-emerald-200 to-teal-300'
                : 'bg-gradient-to-br from-green-400 via-emerald-300 to-teal-400'
              : 'bg-gradient-to-br from-cyan-500 via-blue-400 to-indigo-400'
          }`}></div>

          {/* Botões de ação */}
          <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base min-w-[160px] sm:min-w-[180px] ${
                isConversationActive
                  ? 'bg-red-500/90 text-white border border-red-400/20 hover:bg-red-600 hover:scale-105'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-[0_4px_12px_rgba(249,115,22,0.3)]'
              }`}
              title={
                isConversationActive ? 'Encerrar conversa' 
                : 'Iniciar conversa por voz'
              }
              onClick={isConversationActive ? handleEndConversation : handleStartConversation}
            >
              <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-black flex items-center justify-center text-xs sm:text-sm">
                {isConversationActive ? '🔴' : '▶'}
              </span>
              <span className="font-medium">
                {isConversationActive ? 'Encerrar conversa' : 'Iniciar conversa'}
              </span>
            </button>
          </div>

          {/* Controles de Áudio (quando conectado) */}
          {isConversationActive && (
            <div className="mt-3 sm:mt-4 flex flex-col gap-2 sm:gap-3 w-full max-w-sm">
              {/* Controle de Mute do Microfone */}
              <div className="flex items-center justify-between gap-3 bg-gray-900/70 border border-gray-700/60 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                <span className="text-white/70 text-xs sm:text-sm font-medium">Microfone:</span>
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg transition-colors min-w-[80px] sm:min-w-[90px] justify-center ${
                    micMuted 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}
                  title={micMuted ? 'Desmutar microfone' : 'Mutar microfone'}
                >
                  <span className="text-sm sm:text-base">{micMuted ? '🔇' : '🎤'}</span>
                  <span className="text-xs sm:text-sm font-medium">{micMuted ? 'Mutado' : 'Ativo'}</span>
                </button>
              </div>
              
              {/* Controle de Volume */}
              <div className="flex items-center gap-2 sm:gap-3 bg-gray-900/70 border border-gray-700/60 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                <span className="text-white/70 text-sm sm:text-base flex-shrink-0">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value)
                    setVolume(newVolume)
                  }}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider min-w-[80px]"
                />
                <span className="text-white/70 text-xs sm:text-sm font-medium min-w-[35px] text-right">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          )}


        </div>

        {/* Status da Conversa por Voz */}
        {conversation.status === 'connected' && (
          <div className="w-full max-w-4xl mx-auto bg-gray-800/90 rounded-2xl border border-gray-700 overflow-hidden">
            {/* Header do Status */}
            <div className="bg-gray-900/90 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
                <span className="truncate">Conversa ativa com {agentName || 'Agente'}</span>
              </h3>
              <button 
                onClick={handleEndConversation}
                className="text-gray-400 hover:text-white transition-colors p-1 flex-shrink-0"
                title="Encerrar conversa"
              >
                <span className="text-lg sm:text-xl">✕</span>
              </button>
            </div>
            
            {/* Visualizador de Voz */}
            <div className="p-4 sm:p-6 flex flex-col items-center">
              <div className="text-white/70 text-center mb-4 sm:mb-6">
                <p className="text-base sm:text-lg mb-2 font-medium">🎤 Conversa por voz ativa</p>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                  Fale naturalmente com o agente. Sua voz está sendo processada em tempo real.
                </p>
              </div>
              
              {/* Indicador visual de áudio */}
              <div className="flex items-end justify-center gap-1 h-6 sm:h-8">
                {audioBarHeights.map((height, i) => (
                  <div
                    key={i}
                    className={`w-1 sm:w-1.5 bg-green-500 rounded-full transition-all duration-100`}
                    style={{
                      height: `${Math.max(height * 0.8, 4)}px`,
                      opacity: conversation.isSpeaking ? 1 : 0.6
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instruções quando não conectado */}
        {conversation.status === 'disconnected' && (
          <div className="w-full max-w-3xl mx-auto px-4">
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 sm:p-6 text-center">
              <div className="text-white/70">
                <p className="text-base sm:text-lg mb-3 sm:mb-4 font-medium">🎤 Agente de Voz</p>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                  Clique em "Iniciar conversa" para começar a falar com o agente por voz.
                  Certifique-se de que seu microfone esteja habilitado.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Home
