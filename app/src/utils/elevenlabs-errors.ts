/**
 * Utilitário para tratamento de erros da API ElevenLabs
 * Baseado na documentação oficial: https://elevenlabs.io/docs/developer-guides/error-messages
 */

export interface ElevenLabsError {
  code: string
  message: string
  details?: string
  httpStatus: number
  userMessage: string
  retryable: boolean
}

/**
 * Códigos de erro conhecidos da API ElevenLabs
 */
const KNOWN_ERROR_CODES = {
  // 400/401 Errors
  max_character_limit_exceeded: {
    userMessage: 'Texto muito longo. Divida em partes menores.',
    retryable: false
  },
  invalid_api_key: {
    userMessage: 'Chave da API inválida. Verifique sua configuração.',
    retryable: false
  },
  quota_exceeded: {
    userMessage: 'Cota de uso excedida. Verifique seu plano.',
    retryable: false
  },
  voice_not_found: {
    userMessage: 'Voz não encontrada. Verifique o ID da voz.',
    retryable: false
  },
  
  // 403 Errors
  'only_for_creator+': {
    userMessage: 'Recurso disponível apenas para planos Creator ou superior.',
    retryable: false
  },
  
  // 422 Errors (Validation)
  invalid_file_format: {
    userMessage: 'Formato de arquivo não suportado. Use MP3, WAV, FLAC ou outros formatos de áudio/vídeo.',
    retryable: false
  },
  file_too_large: {
    userMessage: 'Arquivo muito grande. O limite é 2GB para Speech-to-Text.',
    retryable: false
  },
  invalid_audio_content: {
    userMessage: 'Conteúdo de áudio inválido ou corrompido.',
    retryable: false
  },
  unsupported_language: {
    userMessage: 'Idioma não suportado pelo modelo selecionado.',
    retryable: false
  },
  
  // 429 Errors
  too_many_concurrent_requests: {
    userMessage: 'Muitas requisições simultâneas. Tente novamente em alguns segundos.',
    retryable: true
  },
  system_busy: {
    userMessage: 'Sistema ocupado. Tente novamente em alguns momentos.',
    retryable: true
  }
} as const

/**
 * Mapeia códigos de status HTTP para mensagens genéricas
 */
const HTTP_STATUS_MESSAGES = {
  400: 'Requisição inválida',
  401: 'Não autorizado - verifique sua API key',
  403: 'Acesso negado - verifique suas permissões',
  404: 'Recurso não encontrado',
  422: 'Dados inválidos - verifique o arquivo enviado',
  429: 'Muitas requisições - tente novamente mais tarde',
  500: 'Erro interno do servidor',
  502: 'Servidor indisponível',
  503: 'Serviço temporariamente indisponível'
} as const

/**
 * Extrai informações de erro de uma resposta da API ElevenLabs
 */
interface ErrorResponseData {
  detail?: string | {
    status?: string;
    message?: string;
  };
  error?: string | {
    type?: string;
    message?: string;
  };
  message?: string | string[];
  code?: string;
  error_code?: string;
  type?: string;
  details?: string;
  [key: string]: unknown;
}

export async function parseElevenLabsError(response: Response): Promise<ElevenLabsError> {
  let errorData: ErrorResponseData = {}
  
  try {
    const text = await response.text()
    if (text) {
      errorData = JSON.parse(text)
    }
  } catch {
    // Se não conseguir fazer parse do JSON, usar dados vazios
  }
  
  // Extrair código de erro
  const errorCode = errorData.code || errorData.error_code || errorData.type || 'unknown_error'
  
  // Extrair mensagem de erro
  let message = ''
  
  if (typeof errorData.message === 'string') {
    message = errorData.message
  } else if (typeof errorData.detail === 'string') {
    message = errorData.detail
  } else if (typeof errorData.error === 'string') {
    message = errorData.error
  } else if (typeof errorData.detail === 'object' && errorData.detail?.message) {
    message = errorData.detail.message
  } else if (typeof errorData.error === 'object' && errorData.error?.message) {
    message = errorData.error.message
  }
  
  // Se a mensagem for um array, pegar o primeiro item
  if (Array.isArray(message) && message.length > 0) {
    message = message[0]
  }
  
  // Se ainda não tiver mensagem, usar mensagem padrão do status HTTP
  if (!message) {
    message = HTTP_STATUS_MESSAGES[response.status as keyof typeof HTTP_STATUS_MESSAGES] || 'Erro desconhecido'
  }
  
  // Buscar informações do erro conhecido
  const knownError = KNOWN_ERROR_CODES[errorCode as keyof typeof KNOWN_ERROR_CODES]
  
  return {
    code: errorCode,
    message: message,
    details: errorData.details || JSON.stringify(errorData),
    httpStatus: response.status,
    userMessage: knownError?.userMessage || message,
    retryable: knownError?.retryable || false
  }
}

/**
 * Trata erros genéricos (não de resposta HTTP)
 */
export function parseGenericError(error: unknown): ElevenLabsError {
  if (error instanceof Error) {
    return {
      code: 'client_error',
      message: error.message,
      httpStatus: 0,
      userMessage: error.message,
      retryable: false
    }
  }
  
  if (typeof error === 'string') {
    return {
      code: 'client_error',
      message: error,
      httpStatus: 0,
      userMessage: error,
      retryable: false
    }
  }
  
  // Para objetos ou outros tipos, converter para string
  const errorMessage = typeof error === 'object' && error !== null 
    ? JSON.stringify(error) 
    : String(error)
  
  return {
    code: 'unknown_error',
    message: errorMessage,
    httpStatus: 0,
    userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
    retryable: true
  }
}

/**
 * Valida se um arquivo é suportado pela API Speech-to-Text
 */
export function validateSpeechToTextFile(file: File): { valid: boolean; error?: string } {
  // Formatos suportados pela API ElevenLabs Speech-to-Text
  const supportedFormats = [
    // Áudio
    'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/flac', 'audio/aac', 'audio/ogg', 'audio/webm', 'audio/m4a',
    'audio/wma', 'audio/amr', 'audio/3gpp', 'audio/3gpp2',
    // Vídeo (áudio será extraído)
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv',
    'video/webm', 'video/mkv', 'video/3gp', 'video/m4v', 'video/quicktime'
  ]
  
  // Verificar tipo MIME
  if (!supportedFormats.includes(file.type)) {
    // Verificar extensão como fallback
    const extension = file.name.toLowerCase().split('.').pop()
    const supportedExtensions = [
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'webm', 'm4a', 'wma', 'amr',
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', '3gp', 'm4v'
    ]
    
    if (!extension || !supportedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Formato de arquivo não suportado. Use arquivos de áudio (MP3, WAV, FLAC, etc.) ou vídeo (MP4, AVI, MOV, etc.)'
      }
    }
  }
  
  // Verificar tamanho (limite de 2GB para Speech-to-Text)
  const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Arquivo muito grande. O tamanho máximo é 2GB para Speech-to-Text.'
    }
  }
  
  // Verificar se o arquivo não está vazio
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Arquivo vazio. Selecione um arquivo válido.'
    }
  }
  
  return { valid: true }
}

/**
 * Cria uma mensagem de erro amigável para o usuário
 */
export function formatErrorMessage(error: ElevenLabsError): string {
  let message = error.userMessage
  
  // Adicionar informações extras para alguns tipos de erro
  if (error.code === 'invalid_api_key') {
    message += ' Acesse as configurações para inserir uma chave válida.'
  } else if (error.code === 'quota_exceeded') {
    message += ' Verifique seu plano na plataforma ElevenLabs.'
  } else if (error.retryable) {
    message += ' Você pode tentar novamente.'
  }
  
  return message
}