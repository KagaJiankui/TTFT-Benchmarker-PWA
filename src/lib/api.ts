import { Provider, ChatMessage } from './types'

function buildApiUrl(endpoint: string, apiPath: string): string {
  let baseUrl = endpoint.trim()
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }

  const versionMatch = baseUrl.match(/\/v\d+$/)
  
  if (versionMatch) {
    return `${baseUrl}${apiPath}`
  } else {
    return `${baseUrl}/v1${apiPath}`
  }
}

export async function fetchModelsFromProvider(provider: Provider): Promise<string[]> {
  try {
    const url = buildApiUrl(provider.endpoint, '/models')
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((model: any) => model.id || model.model || '')
    }
    
    return []
  } catch (error) {
    console.error('Error fetching models:', error)
    throw error
  }
}

export async function* streamChatCompletion(
  provider: Provider,
  modelId: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): AsyncGenerator<{ chunk?: string; reasoningChunk?: string; httpStatus?: number }, void, unknown> {
  const url = buildApiUrl(provider.endpoint, '/chat/completions')
  
  const requestBody = {
    model: modelId,
    messages,
    stream: true,
    ...(provider.requestParams || {}),
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  yield { httpStatus: response.status }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6))
            const delta = json.choices?.[0]?.delta
            const message = json.choices?.[0]?.message
            
            if (delta?.reasoning_content || message?.reasoning_content) {
              yield { reasoningChunk: delta?.reasoning_content || message?.reasoning_content }
            }
            
            if (delta?.content || message?.content) {
              yield { chunk: delta?.content || message?.content }
            }
          } catch (e) {
            console.warn('Failed to parse SSE:', trimmed)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function calculateTPS(tokens: number, startTime: number, endTime: number): number {
  const durationMs = endTime - startTime
  if (durationMs <= 0) return 0
  return (tokens / durationMs) * 1000
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}
