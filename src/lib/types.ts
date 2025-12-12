export interface Provider {
  id: string
  name: string
  endpoint: string
  apiKey: string
  requestParams?: Record<string, any>
}

export interface Model {
  id: string
  providerId: string
  modelId: string
}

export interface ModelSlot {
  id: string
  provider?: Provider
  modelId?: string
  displayName?: string
}

export interface TimingMetrics {
  requestSent?: number
  firstToken?: number
  cotStart?: number
  cotEnd?: number
  contentStart?: number
  contentEnd?: number
  totalTokens?: number
  cotTokens?: number
  contentTokens?: number
  httpStatus?: number
}

export interface ModelResponse {
  slotId: string
  content: string
  thinking: string
  metrics: TimingMetrics
  status: 'idle' | 'streaming' | 'complete' | 'error'
  error?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
