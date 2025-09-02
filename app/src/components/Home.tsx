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
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-4">
        {/* Orbe central */}
        <div className="relative mb-6 flex flex-col items-center">
          <div className={`w-64 h-64 md:w-80 md:h-80 rounded-full opacity-90 transition-all duration-150 anexa-voice-visual ${
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
          <div className="absolute -bottom-6 md:bottom-8 md:static translate-y-8 md:translate-y-0 flex gap-3" style={{ marginTop: '20px' }}>
            <button
              className={`px-5 py-2 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 ${
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
              <span className="inline-block w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                {isConversationActive ? '🔴' : '▶'}
              </span>
              <span>
                {isConversationActive ? 'Encerrar conversa' : 'Iniciar conversa'}
              </span>
            </button>
          </div>

          {/* Controles de Áudio (quando conectado) */}
          {isConversationActive && (
            <div className="mt-3 flex flex-col gap-2">
              {/* Controle de Mute do Microfone */}
              <div className="flex items-center gap-3 bg-gray-900/70 border border-gray-700/60 rounded-2xl px-4 py-2">
                <span className="text-white/70 text-sm">Microfone:</span>
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                    micMuted 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}
                  title={micMuted ? 'Desmutar microfone' : 'Mutar microfone'}
                >
                  <span>{micMuted ? '🔇' : '🎤'}</span>
                  <span className="text-sm">{micMuted ? 'Mutado' : 'Ativo'}</span>
                </button>
              </div>
              
              {/* Controle de Volume */}
              <div className="flex items-center gap-3 bg-gray-900/70 border border-gray-700/60 rounded-2xl px-4 py-2">
                <span className="text-white/70 text-sm">🔊</span>
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
                  className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-white/70 text-sm">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          )}


        </div>

        {/* Status da Conversa por Voz */}
        {conversation.status === 'connected' && (
          <div className="w-full max-w-4xl bg-gray-800/90 rounded-2xl border border-gray-700 overflow-hidden">
            {/* Header do Status */}
            <div className="bg-gray-900/90 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                Conversa ativa com {agentName || 'Agente'}
              </h3>
              <button 
                onClick={handleEndConversation}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Visualizador de Voz */}
            <div className="p-4 flex flex-col items-center">
              <div className="text-white/70 text-center mb-4">
                <p className="text-lg mb-2">🎤 Conversa por voz ativa</p>
                <p className="text-sm text-gray-400">
                  Fale naturalmente com o agente. Sua voz está sendo processada em tempo real.
                </p>
              </div>
              
              {/* Indicador visual de áudio */}
              <div className="flex items-end justify-center gap-1 h-8">
                {audioBarHeights.map((height, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-green-500 rounded-full transition-all duration-100`}
                    style={{
                      height: `${height}px`,
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
          <div className="w-full max-w-3xl">
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 text-center">
              <div className="text-white/70 mb-4">
                <p className="text-lg mb-2">🎤 Agente de Voz</p>
                <p className="text-sm text-gray-400">
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
