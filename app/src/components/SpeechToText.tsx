import React, { useState, useRef } from 'react'
import { parseElevenLabsError, parseGenericError, validateSpeechToTextFile, formatErrorMessage, type ElevenLabsError } from '../utils/elevenlabs-errors'

interface WordDetail {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker_id?: string;
  type: 'word' | 'spacing' | 'audio_event';
}

interface ApiWordDetail {
  text?: string;
  start?: number;
  end?: number;
  confidence?: number;
  speaker_id?: string;
  type?: string;
}

interface TranscriptionResult {
  text: string
  confidence?: number
  language?: string
  duration?: number
  // Dados detalhados para modo de legendas
  words?: WordDetail[];
  language_code?: string;
  language_probability?: number;
}

interface SpeechToTextProps {
  className?: string
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ className = '' }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string>('')
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const [generateSRT, setGenerateSRT] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto')
  const [targetLanguage, setTargetLanguage] = useState<string>('none')
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslationModal, setShowTranslationModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    setError(null)
    
    // Validar arquivo usando o utilitário
    const validation = validateSpeechToTextFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido')
      return
    }

    setSelectedFile(file)
    setTranscriptionResult(null)
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const transcribeFile = async () => {
    if (inputMode === 'file' && !selectedFile) {
      setError('Por favor, selecione um arquivo primeiro.')
      return
    }
    
    if (inputMode === 'url' && !fileUrl.trim()) {
      setError('Por favor, insira uma URL válida.')
      return
    }

    setIsTranscribing(true)
    setError(null)
    setTranscriptionResult(null)
    setTranslatedText(null)

    try {
      // Obter configuração do ElevenLabs
      const savedConfig = JSON.parse(localStorage.getItem('elevenlabs-config') || '{}')
      const envApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
      const apiKey = savedConfig.apiKey || envApiKey
      
      
      if (!apiKey) {
        throw new Error('API Key do ElevenLabs não configurada. Configure nas configurações do agente.')
      }

      // Preparar FormData
      const formData = new FormData()
      
      if (inputMode === 'file') {
        // Validar arquivo antes de enviar
        const validation = validateSpeechToTextFile(selectedFile!)
        if (!validation.valid) {
          throw new Error(validation.error || 'Arquivo inválido')
        }
        formData.append('file', selectedFile!)
      } else {
        // Para URL da nuvem, usar o parâmetro correto da API ElevenLabs
        formData.append('cloud_storage_url', fileUrl.trim())
      }
      
      formData.append('model_id', 'scribe_v1') // Modelo de Speech-to-Text (único suportado)
      if (selectedLanguage !== 'auto') {
        formData.append('language_code', selectedLanguage)
        console.log('Enviando language_code:', selectedLanguage)
      } else {
        console.log('Usando detecção automática de idioma')
      }
      
      // Adicionar parâmetros para modo detalhado quando SRT for solicitado
      if (generateSRT) {
        formData.append('diarize', 'true') // Separar por falantes
        formData.append('tag_audio_events', 'true') // Marcar eventos de áudio
      }

      // Fazer requisição para API ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData
      })

      if (!response.ok) {
        const elevenLabsError = await parseElevenLabsError(response)
        throw elevenLabsError
      }

      const result = await response.json()
      
      // Debug: Log da resposta da API
      console.log('API Response:', JSON.stringify(result, null, 2))
      console.log('Generate SRT:', generateSRT)
      console.log('Language Code enviado:', selectedLanguage)
      console.log('Language Code retornado:', result.language_code)
      
      // Validar se a resposta tem o formato esperado
      if (!result || typeof result !== 'object') {
        throw new Error('Resposta inválida da API')
      }
      
      // Tratar diferentes formatos de resposta da API
      let transcriptionText = ''
      let language = ''
      let confidence = undefined
      let duration = undefined
      let words: WordDetail[] | undefined = undefined
      let languageCode = undefined
      let languageProbability = undefined
      
      if (result.text) {
        // Resposta single-channel
        transcriptionText = result.text
        language = result.language_code || result.detected_language || ''
        confidence = result.confidence || result.language_probability
        duration = result.duration
        languageCode = result.language_code
        languageProbability = result.language_probability
        
        // Capturar dados detalhados se disponíveis
        if (generateSRT && result.words && Array.isArray(result.words)) {
          console.log('Processando words da API - total:', result.words.length)
          console.log('Primeiras 5 words da API:', result.words.slice(0, 5))
          
          words = result.words.map((word: ApiWordDetail) => ({
            text: word.text || '',
            start: word.start || 0,
            end: word.end || 0,
            confidence: word.confidence || 0,
            speaker_id: word.speaker_id,
            type: word.type || 'word'
          }))
          
          if (words) {
            console.log('Words processadas - total:', words.length)
            console.log('Primeiras 5 words processadas:', words.slice(0, 5))
            console.log('Tipos de words encontrados:', [...new Set(words.map(w => w.type))])
          }
        }
      } else if (result.transcripts && Array.isArray(result.transcripts) && result.transcripts.length > 0) {
        // Resposta multi-channel - usar primeiro transcript
        const firstTranscript = result.transcripts[0]
        transcriptionText = firstTranscript.text || ''
        language = firstTranscript.language_code || ''
        confidence = firstTranscript.confidence
        duration = result.duration
        languageCode = firstTranscript.language_code
        languageProbability = firstTranscript.language_probability
        
        // Capturar dados detalhados se disponíveis
        if (generateSRT && firstTranscript.words && Array.isArray(firstTranscript.words)) {
          console.log('Processando words do primeiro transcript - total:', firstTranscript.words.length)
          console.log('Primeiras 5 words do transcript:', firstTranscript.words.slice(0, 5))
          
          words = firstTranscript.words.map((word: ApiWordDetail) => ({
            text: word.text || '',
            start: word.start || 0,
            end: word.end || 0,
            confidence: word.confidence || 0,
            speaker_id: word.speaker_id,
            type: word.type || 'word'
          }))
          
          if (words) {
            console.log('Words do transcript processadas - total:', words.length)
            console.log('Primeiras 5 words do transcript processadas:', words.slice(0, 5))
            console.log('Tipos de words do transcript encontrados:', [...new Set(words.map(w => w.type))])
          }
        }
      } else {
        throw new Error('Formato de resposta não reconhecido da API')
      }
      
      // Validar se pelo menos o texto foi extraído
      if (!transcriptionText) {
        throw new Error('Nenhum texto foi encontrado na resposta da API')
      }
      
      setTranscriptionResult({
        text: transcriptionText,
        confidence: confidence,
        language: language,
        duration: duration,
        words: words,
        language_code: languageCode,
        language_probability: languageProbability
      })

    } catch (err) {
      let elevenLabsError: ElevenLabsError
      
      // Se já é um erro da ElevenLabs, usar diretamente
      if (err && typeof err === 'object' && 'code' in err && 'userMessage' in err) {
        elevenLabsError = err as ElevenLabsError
      } else {
        // Caso contrário, processar como erro genérico
        elevenLabsError = parseGenericError(err)
      }
      
      const errorMessage = formatErrorMessage(elevenLabsError)
      
      console.error('Erro na transcrição:', {
        code: elevenLabsError.code,
        message: elevenLabsError.message,
        httpStatus: elevenLabsError.httpStatus,
        retryable: elevenLabsError.retryable,
        originalError: err
      })
      
      setError(errorMessage)
    } finally {
      setIsTranscribing(false)
    }
  }

  // Função auxiliar para retry com backoff exponencial
  const retryWithBackoff = async (
    fn: () => Promise<string>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
  ): Promise<string> => {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        // Se não é erro 429 ou é a última tentativa, falha imediatamente
        if (!error || typeof error !== 'object' || !('message' in error) || 
            !(error as Error).message.includes('429') || attempt === maxRetries) {
          throw error
        }
        
        // Calcular delay com jitter para evitar thundering herd
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        )
        
        console.log(`Tentativa ${attempt + 1}/${maxRetries + 1} falhou com 429. Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }

  const translateText = async (text: string, targetLang: string) => {
    if (!text || targetLang === 'none') return null
    
    setIsTranslating(true)
    setTranslatedText(null)
    
    try {
      // Mapeamento de códigos de idioma para LibreTranslate
      const languageMap: { [key: string]: string } = {
        'por': 'pt',
        'eng': 'en',
        'spa': 'es',
        'fra': 'fr',
        'deu': 'de',
        'ita': 'it',
        'jpn': 'ja',
        'kor': 'ko',
        'cmn': 'zh'
      }
      
      const targetCode = languageMap[targetLang] || 'en'
      
      // Dividir texto em chunks menores para reduzir carga na API
      const maxChunkSize = 300 // Reduzido para diminuir carga por requisição
      const chunks = []
      
      for (let i = 0; i < text.length; i += maxChunkSize) {
        chunks.push(text.substring(i, i + maxChunkSize))
      }
      
      console.log(`Traduzindo texto em ${chunks.length} chunks com retry automático para 429`)
      
      const translatedChunks = []
      
      // Mapear idioma detectado da transcrição para código LibreTranslate
      const detectedLanguage = transcriptionResult?.language_code || transcriptionResult?.language || 'pt'
      const sourceLanguageMap: { [key: string]: string } = {
        'por': 'pt',
        'pt': 'pt',
        'eng': 'en', 
        'en': 'en',
        'spa': 'es',
        'es': 'es',
        'fra': 'fr',
        'fr': 'fr',
        'deu': 'de',
        'de': 'de',
        'ita': 'it',
        'it': 'it',
        'jpn': 'ja',
        'ja': 'ja',
        'kor': 'ko',
        'ko': 'ko',
        'cmn': 'zh',
        'zh': 'zh'
      }
      
      const sourceCode = sourceLanguageMap[detectedLanguage] || 'pt'
      console.log(`Idioma detectado: ${detectedLanguage}, mapeado para: ${sourceCode}`)
      
      // Processar chunks com rate limiting inteligente
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const apiUrl = `/translate/get?q=${encodeURIComponent(chunk)}&langpair=${sourceCode}|${targetCode}`
        
        console.log(`Traduzindo chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`)
        
        // Usar retry com backoff exponencial para cada chunk
        const translatedChunk = await retryWithBackoff(async () => {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          })

          if (!response.ok) {
            // Tratamento específico para diferentes códigos de erro
            if (response.status === 429) {
              throw new Error(`Erro na API de tradução: 429 Too Many Requests`)
            } else if (response.status >= 500) {
              throw new Error(`Erro no servidor de tradução: ${response.status} ${response.statusText}`)
            } else {
              throw new Error(`Erro na API de tradução: ${response.status} ${response.statusText}`)
            }
          }

          const data = await response.json()
          console.log(`Resposta da API de tradução para chunk ${i + 1}:`, data)
          
          if (data.responseData && data.responseData.translatedText && data.responseStatus === 200) {
            return data.responseData.translatedText
          } else {
            throw new Error(`Erro na tradução do chunk ${i + 1}: ${data.responseDetails || 'Resposta inválida da API'}`)
          }
        }, 3, 1000, 8000) // 3 tentativas, delay inicial 1s, máximo 8s
        
        translatedChunks.push(translatedChunk)
        
        // Pausa adaptativa entre requisições baseada no número de chunks
        if (i < chunks.length - 1) {
          const adaptiveDelay = chunks.length > 5 ? 500 : 200 // Mais delay para textos longos
          await new Promise(resolve => setTimeout(resolve, adaptiveDelay))
        }
      }
      
      // Juntar todos os chunks traduzidos
      const finalTranslatedText = translatedChunks.join('')
      setTranslatedText(finalTranslatedText)
      console.log('Tradução completa:', finalTranslatedText.substring(0, 100) + '...')
      return finalTranslatedText
      
    } catch (err) {
      console.error('Erro na tradução:', err)
      
      // Mensagem de erro mais específica para 429
      let errorMessage = 'Erro desconhecido'
      if (err instanceof Error) {
        if (err.message.includes('429')) {
          errorMessage = 'Muitas requisições à API de tradução. Tente novamente em alguns minutos ou divida o texto em partes menores.'
        } else if (err.message.includes('500') || err.message.includes('502') || err.message.includes('503')) {
          errorMessage = 'Servidor de tradução temporariamente indisponível. Tente novamente em alguns momentos.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(`Erro na tradução: ${errorMessage}`)
      return null
    } finally {
      setIsTranslating(false)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFileUrl('')
    setTranscriptionResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  // Função para formatar tempo em mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Função para agrupar palavras por falante e criar legendas
  const createSubtitles = (words: WordDetail[]): Array<{speaker_id: string | undefined, text: string, start: number, end: number}> => {
    console.log('createSubtitles - entrada:', {
      wordsLength: words?.length || 0,
      firstWord: words?.[0],
      wordTypes: words?.map(w => w.type).slice(0, 10)
    })
    
    if (!words || words.length === 0) {
      console.log('createSubtitles - retornando array vazio: sem palavras')
      return []
    }
    
    // Filtrar apenas palavras (não spacing ou audio_event)
    const wordElements = words.filter(w => w.type === 'word')
    console.log('createSubtitles - palavras filtradas:', wordElements.length)
    
    if (wordElements.length === 0) {
      console.log('createSubtitles - retornando array vazio: nenhuma palavra encontrada após filtro')
      return []
    }
    
    const subtitles: Array<{speaker_id: string | undefined, text: string, start: number, end: number}> = []
    let currentSubtitle = {
      speaker_id: wordElements[0].speaker_id,
      text: wordElements[0].text || '',
      start: wordElements[0].start,
      end: wordElements[0].end
    }
    
    // Processar palavras restantes (começando da segunda)
    for (let i = 1; i < wordElements.length; i++) {
      const word = wordElements[i]
      
      // Se mudou de falante ou há uma pausa grande (>2s), criar nova legenda
      if (word.speaker_id !== currentSubtitle.speaker_id || 
          (word.start - currentSubtitle.end > 2)) {
        // Adicionar legenda atual
        if (currentSubtitle.text.trim()) {
          subtitles.push({...currentSubtitle})
          console.log(`createSubtitles - adicionada subtitle ${subtitles.length}:`, currentSubtitle.text.substring(0, 50))
        }
        
        // Iniciar nova legenda
        currentSubtitle = {
          speaker_id: word.speaker_id,
          text: word.text || '',
          start: word.start,
          end: word.end
        }
      } else {
        // Continuar legenda atual
        currentSubtitle.text += ' ' + (word.text || '')
        currentSubtitle.end = word.end
      }
    }
    
    // Adicionar última legenda
    if (currentSubtitle.text.trim()) {
      subtitles.push(currentSubtitle)
      console.log(`createSubtitles - adicionada última subtitle:`, currentSubtitle.text.substring(0, 50))
    }
    
    console.log('createSubtitles - resultado:', {
      totalWords: wordElements.length,
      totalSubtitles: subtitles.length,
      firstSubtitle: subtitles[0]?.text?.substring(0, 30)
    })
    
    return subtitles
  }

  const generateSRTContent = (words: WordDetail[]): string => {
    console.log('generateSRTContent - words recebidas:', words?.length || 0)
    console.log('generateSRTContent - primeiras 3 palavras:', words?.slice(0, 3))
    
    const subtitles = createSubtitles(words)
    console.log('generateSRTContent - subtitles criadas:', subtitles?.length || 0)
    console.log('generateSRTContent - primeiras 2 subtitles:', subtitles?.slice(0, 2))
    
    let srtContent = ''
    
    subtitles.forEach((subtitle, index) => {
      const startTime = formatSRTTime(subtitle.start)
      const endTime = formatSRTTime(subtitle.end)
      const speakerPrefix = subtitle.speaker_id !== undefined ? `[Falante ${subtitle.speaker_id + 1}] ` : ''
      
      srtContent += `${index + 1}\n`
      srtContent += `${startTime} --> ${endTime}\n`
      srtContent += `${speakerPrefix}${subtitle.text}\n\n`
    })
    
    console.log('generateSRTContent - conteúdo SRT gerado (primeiros 200 chars):', srtContent.substring(0, 200))
    return srtContent
  }

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
  }

  const downloadSRT = () => {
    if (!transcriptionResult?.words) return
    
    const srtContent = generateSRTContent(transcriptionResult.words)
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transcricao_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.srt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    if (transcriptionResult?.text) {
      try {
        await navigator.clipboard.writeText(transcriptionResult.text)
        // Feedback visual simples
        const button = document.getElementById('copy-button')
        if (button) {
          const originalText = button.textContent
          button.textContent = '✓ Copiado!'
          setTimeout(() => {
            button.textContent = originalText
          }, 2000)
        }
      } catch (err) {
        console.error('Erro ao copiar:', err)
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File): string => {
    if (file.type.startsWith('audio/')) return '🎵'
    if (file.type.startsWith('video/')) return '🎬'
    return '📄'
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">🎤 Speech to Text</h2>
        <p className="text-gray-400 text-sm sm:text-base">
          Converta arquivos de áudio e vídeo em texto usando a tecnologia ElevenLabs
        </p>
      </div>

      {/* Seletor de Modo de Input */}
      <div className="mb-6">
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setInputMode('file')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              inputMode === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📁 Upload de Arquivo
          </button>
          <button
            onClick={() => setInputMode('url')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              inputMode === 'url'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🌐 URL da Nuvem
          </button>
        </div>

        {inputMode === 'file' ? (
          <div
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-orange-400 bg-orange-500/10'
                : selectedFile
                ? 'border-green-400 bg-green-500/10'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="text-4xl">{getFileIcon(selectedFile)}</div>
              <div>
                <p className="text-white font-medium text-lg">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
              <button
                onClick={clearFile}
                className="relative z-10 text-red-400 hover:text-red-300 text-sm underline"
              >
                Remover arquivo
              </button>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="space-y-4">
                <div className="text-4xl text-gray-400">📁</div>
                <div>
                  <p className="text-white font-medium text-lg mb-2">
                    Arraste um arquivo aqui ou clique no botão abaixo
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    Suporta arquivos de áudio (MP3, WAV, FLAC, etc.) e vídeo (MP4, AVI, MOV, etc.)
                    <br />
                    Tamanho máximo: 3GB
                  </p>
                  <button
                    onClick={openFileSelector}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Escolher Arquivo
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-600 rounded-2xl p-6">
            <div className="space-y-4">
              <div className="text-4xl text-gray-400 text-center">🌐</div>
              <div>
                <label className="block text-white font-medium text-lg mb-2 text-center">
                  Cole a URL do arquivo na nuvem
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://exemplo.com/arquivo.mp3"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-gray-400 text-sm mt-2 text-center">
                  ✅ URLs públicas do S3, Google Cloud Storage<br/>
                  ✅ URLs diretas de arquivos (ex: https://exemplo.com/audio.mp3)<br/>
                  ❌ Google Drive, Dropbox (links de compartilhamento não funcionam)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opções de Transcrição */}
      {(selectedFile || (inputMode === 'url' && fileUrl.trim())) && (
        <div className="mb-6">
          {/* Seletor de Idioma Original */}
          <div className="mb-4 flex flex-col items-center gap-3">
            <label className="text-gray-300 text-sm font-medium">
              Idioma Original
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="auto">🌍 Detectar automaticamente</option>
              <option value="por">🇧🇷 Português</option>
              <option value="eng">🇺🇸 Inglês</option>
              <option value="spa">🇪🇸 Espanhol</option>
              <option value="fra">🇫🇷 Francês</option>
              <option value="deu">🇩🇪 Alemão</option>
              <option value="ita">🇮🇹 Italiano</option>
              <option value="jpn">🇯🇵 Japonês</option>
              <option value="kor">🇰🇷 Coreano</option>
              <option value="cmn">🇨🇳 Chinês (Mandarim)</option>
            </select>
          </div>



          {/* Checkbox para opções */}
          <div className="mb-4 flex flex-col items-center gap-3">
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={generateSRT}
                onChange={(e) => setGenerateSRT(e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm">Gerar arquivo de legendas (.srt)</span>
            </label>
          </div>
          
          {/* Botão de Transcrição */}
          <div className="text-center">
            <button
              onClick={transcribeFile}
              disabled={isTranscribing}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                isTranscribing
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-[0_4px_12px_rgba(249,115,22,0.3)]'
              }`}
            >
              {isTranscribing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Transcrevendo...
                </span>
              ) : (
                'Iniciar Transcrição'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">
            <span className="font-medium">Erro:</span> {typeof error === 'string' ? error : JSON.stringify(error)}
          </p>
        </div>
      )}

      {/* Resultado da Transcrição */}
      {transcriptionResult && (
        <div className="bg-gray-800/90 border border-gray-700 rounded-2xl overflow-hidden">
          {/* Header do Resultado */}
          <div className="bg-gray-900/90 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
              <span className="text-green-500">✓</span>
              Transcrição Concluída
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTranslationModal(true)}
                disabled={isTranslating}
                className={`text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-gray-700/50 text-sm ${
                  isTranslating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Traduzir texto"
              >
                {isTranslating ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                    🌐
                  </span>
                ) : (
                  '🌐 Traduzir'
                )}
              </button>
              <button
                id="copy-button"
                onClick={copyToClipboard}
                className="text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-gray-700/50 text-sm"
                title="Copiar texto"
              >
                📋 Copiar
              </button>
            </div>
          </div>
          
          {/* Conteúdo do Resultado */}
          <div className="p-4 sm:p-6">
            {/* Metadados */}
            {(transcriptionResult.language || transcriptionResult.duration || transcriptionResult.confidence || transcriptionResult.language_probability) && (
              <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-400">
                {transcriptionResult.language && (
                  <span>🌐 Idioma: {transcriptionResult.language}</span>
                )}
                {transcriptionResult.duration && (
                  <span>⏱️ Duração: {Math.round(transcriptionResult.duration)}s</span>
                )}
                {/* Mostrar confiança da transcrição ou do idioma detectado */}
                {(transcriptionResult.confidence || transcriptionResult.language_probability) && (
                  <span title="Percentual de confiança na transcrição ou detecção do idioma">
                    📊 Confiança: {Math.round((transcriptionResult.confidence || transcriptionResult.language_probability || 0) * 100)}%
                  </span>
                )}
              </div>
            )}
            
            {/* Texto Traduzido */}
            {translatedText && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-400">🌐</span>
                  <h4 className="text-blue-400 font-medium text-sm">Tradução</h4>
                </div>
                <p className="text-white leading-relaxed whitespace-pre-wrap">
                  {translatedText}
                </p>
              </div>
            )}
            
            {/* Texto Transcrito */}
            {generateSRT && transcriptionResult.words && transcriptionResult.words.length > 0 ? (
              /* Visualização de Legendas com Falantes */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">🎭</span>
                    <h4 className="text-white font-medium">Transcrição por Falantes</h4>
                  </div>
                  {generateSRT && (
                    <button
                      onClick={downloadSRT}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                      title="Baixar arquivo SRT"
                    >
                      📥 Baixar SRT
                    </button>
                  )}
                </div>
                <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 max-h-96 overflow-y-auto">
                  {createSubtitles(transcriptionResult.words).map((subtitle, index) => (
                    <div key={index} className="p-4 border-b border-gray-700/30 last:border-b-0 hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">
                            {subtitle.speaker_id !== undefined ? `Falante ${subtitle.speaker_id + 1}` : 'Falante'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
                          </span>
                        </div>
                      </div>
                      <p className="text-white leading-relaxed">
                        {subtitle.text}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Texto completo como fallback */}
                <details className="mt-4">
                  <summary className="text-gray-400 cursor-pointer hover:text-white transition-colors text-sm">
                    📄 Ver texto completo
                  </summary>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 mt-2">
                    <p className="text-white leading-relaxed whitespace-pre-wrap">
                      {transcriptionResult.text || 'Nenhum texto foi detectado no arquivo.'}
                    </p>
                  </div>
                </details>
                
                {/* Preview do arquivo SRT */}
                <details className="mt-4">
                  <summary className="text-gray-400 cursor-pointer hover:text-white transition-colors text-sm">
                    📝 Ver conteúdo do arquivo SRT
                  </summary>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 mt-2">
                    <pre className="text-white leading-relaxed whitespace-pre-wrap font-mono text-sm">
                      {generateSRTContent(transcriptionResult.words || []) || 'Nenhum conteúdo SRT foi gerado.'}
                    </pre>
                  </div>
                </details>
              </div>
            ) : (
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                {generateSRT && transcriptionResult.words && transcriptionResult.words.length > 0 ? (
                  <pre className="text-white leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {generateSRTContent(transcriptionResult.words)}
                  </pre>
                ) : (
                  <p className="text-white leading-relaxed whitespace-pre-wrap">
                    {transcriptionResult.text || 'Nenhum texto foi detectado no arquivo.'}
                  </p>
                )}
                {generateSRT && transcriptionResult.words && transcriptionResult.words.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={downloadSRT}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                      title="Baixar arquivo SRT"
                    >
                      📥 Baixar Legendas (.srt)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Tradução */}
      {showTranslationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">🌐 Traduzir Transcrição</h3>
              <button
                onClick={() => setShowTranslationModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-3">
                Selecione o idioma de destino:
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => {
                  setTargetLanguage(e.target.value)
                  setTranslatedText(null) // Limpar tradução anterior
                }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">🚫 Selecione um idioma</option>
                <option value="por">🇧🇷 Português</option>
                <option value="eng">🇺🇸 Inglês</option>
                <option value="spa">🇪🇸 Espanhol</option>
                <option value="fra">🇫🇷 Francês</option>
                <option value="deu">🇩🇪 Alemão</option>
                <option value="ita">🇮🇹 Italiano</option>
                <option value="jpn">🇯🇵 Japonês</option>
                <option value="kor">🇰🇷 Coreano</option>
                <option value="cmn">🇨🇳 Chinês (Mandarim)</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowTranslationModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (targetLanguage !== 'none' && transcriptionResult) {
                    translateText(transcriptionResult.text, targetLanguage)
                    setShowTranslationModal(false)
                  }
                }}
                disabled={targetLanguage === 'none' || isTranslating}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  targetLanguage === 'none' || isTranslating
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isTranslating ? 'Traduzindo...' : 'Traduzir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="mt-8 text-center">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-2">
            💡 <strong>Dica:</strong> Para melhores resultados, use arquivos com áudio claro e sem muito ruído de fundo.
          </p>

        </div>
      </div>
    </div>
  )
}

export default SpeechToText