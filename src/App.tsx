import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Play } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { ProviderDialog } from '@/components/ProviderDialog'
import { ProviderCard } from '@/components/ProviderCard'
import { ModelSlotCard } from '@/components/ModelSlotCard'
import { ResponsePanel } from '@/components/ResponsePanel'
import { Provider, ModelSlot, ModelResponse } from '@/lib/types'
import { streamChatCompletion, estimateTokenCount } from '@/lib/api'

function App() {
  const [providers, setProviders] = useKV<Provider[]>('llm-providers', [])
  const [availableModels, setAvailableModels] = useKV<Record<string, string[]>>('provider-models', {})
  const [modelSlots, setModelSlots] = useKV<ModelSlot[]>('model-slots', [
    { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' },
    { id: '5' }, { id: '6' }, { id: '7' }, { id: '8' },
  ])
  
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [responses, setResponses] = useState<ModelResponse[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | undefined>()
  const [systemPromptExpanded, setSystemPromptExpanded] = useState(false)
  
  const dragDataRef = useRef<{ provider: Provider; modelId: string } | null>(null)

  const handleSaveProvider = (providerData: Omit<Provider, 'id'>) => {
    setProviders((current) => {
      const currentProviders = current || []
      if (editingProvider) {
        return currentProviders.map(p => p.id === editingProvider.id ? { ...providerData, id: p.id } : p)
      } else {
        return [...currentProviders, { ...providerData, id: Date.now().toString() }]
      }
    })
    setEditingProvider(undefined)
  }

  const handleDeleteProvider = (providerId: string) => {
    setProviders((current) => (current || []).filter(p => p.id !== providerId))
    setAvailableModels((current) => {
      const updated = { ...(current || {}) }
      delete updated[providerId]
      return updated
    })
    setModelSlots((current) =>
      (current || []).map(slot =>
        slot.provider?.id === providerId ? { id: slot.id } : slot
      )
    )
  }

  const handleFetchModels = (providerId: string, models: string[]) => {
    setAvailableModels((current) => ({
      ...(current || {}),
      [providerId]: models,
    }))
  }

  const handleDragStart = (provider: Provider, modelId: string) => {
    dragDataRef.current = { provider, modelId }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (slotId: string) => {
    if (!dragDataRef.current) return

    const { provider, modelId } = dragDataRef.current
    
    setModelSlots((current) =>
      (current || []).map(slot =>
        slot.id === slotId
          ? {
              id: slot.id,
              provider,
              modelId,
              displayName: `${provider.name} / ${modelId}`,
            }
          : slot
      )
    )

    dragDataRef.current = null
  }

  const handleRemoveSlot = (slotId: string) => {
    setModelSlots((current) =>
      (current || []).map(slot => (slot.id === slotId ? { id: slot.id } : slot))
    )
  }

  const detectThinkingSection = (text: string): { thinking: string; content: string } | null => {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i)
    if (thinkMatch) {
      const thinking = thinkMatch[1].trim()
      const content = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim()
      return { thinking, content }
    }
    return null
  }

  const handleRunComparison = async () => {
    const activeSlots = (modelSlots || []).filter(slot => slot.provider && slot.modelId)
    
    if (activeSlots.length === 0) {
      toast.error('Please configure at least one model')
      return
    }

    if (!userPrompt.trim()) {
      toast.error('Please enter a user prompt')
      return
    }

    setIsRunning(true)
    
    const initialResponses: ModelResponse[] = activeSlots.map(slot => ({
      slotId: slot.id,
      content: '',
      thinking: '',
      metrics: { requestSent: Date.now() },
      status: 'streaming',
    }))
    
    setResponses(initialResponses)

    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: userPrompt },
    ]

    const streamPromises = activeSlots.map(async (slot) => {
      try {
        const response = initialResponses.find(r => r.slotId === slot.id)!
        let fullText = ''
        let thinkingText = ''
        let contentText = ''
        let inThinking = false
        let thinkingProcessed = false

        for await (const chunk of streamChatCompletion(slot.provider!, slot.modelId!, messages)) {
          fullText += chunk

          if (!response.metrics.firstToken) {
            response.metrics.firstToken = Date.now()
          }

          if (!thinkingProcessed) {
            const detected = detectThinkingSection(fullText)
            if (detected) {
              thinkingText = detected.thinking
              contentText = detected.content
              thinkingProcessed = true
              
              if (!response.metrics.cotStart) {
                response.metrics.cotStart = response.metrics.firstToken
              }
              if (!response.metrics.cotEnd) {
                response.metrics.cotEnd = Date.now()
                response.metrics.cotTokens = estimateTokenCount(thinkingText)
              }
              if (contentText && !response.metrics.contentStart) {
                response.metrics.contentStart = Date.now()
              }
            } else {
              if (fullText.includes('<think>')) {
                inThinking = true
                if (!response.metrics.cotStart) {
                  response.metrics.cotStart = Date.now()
                }
              }
            }
          } else {
            contentText += chunk
          }

          if (thinkingProcessed && contentText) {
            if (!response.metrics.contentStart) {
              response.metrics.contentStart = Date.now()
            }
          }

          setResponses((current) =>
            current.map(r =>
              r.slotId === slot.id
                ? {
                    ...r,
                    thinking: thinkingText,
                    content: thinkingProcessed ? contentText : fullText,
                  }
                : r
            )
          )
        }

        const finalDetected = detectThinkingSection(fullText)
        if (finalDetected) {
          thinkingText = finalDetected.thinking
          contentText = finalDetected.content
        } else {
          contentText = fullText
        }

        response.metrics.contentEnd = Date.now()
        response.metrics.contentTokens = estimateTokenCount(contentText)
        if (thinkingText && !response.metrics.cotTokens) {
          response.metrics.cotTokens = estimateTokenCount(thinkingText)
        }

        setResponses((current) =>
          current.map(r =>
            r.slotId === slot.id
              ? {
                  ...r,
                  thinking: thinkingText,
                  content: contentText,
                  status: 'complete',
                  metrics: response.metrics,
                }
              : r
          )
        )
      } catch (error) {
        setResponses((current) =>
          current.map(r =>
            r.slotId === slot.id
              ? {
                  ...r,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Unknown error',
                }
              : r
          )
        )
      }
    })

    await Promise.all(streamPromises)
    setIsRunning(false)
  }

  const activeSlots = (modelSlots || []).filter(slot => slot.provider && slot.modelId)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">LLM Benchmark</h1>
          <p className="text-sm text-muted-foreground">
            Precision model comparison with first token latency and TPS metrics
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-4">
            <Card className="p-4">
              <Label htmlFor="system-prompt" className="text-sm font-semibold">
                System Prompt
              </Label>
              <Textarea
                id="system-prompt"
                placeholder="Enter system prompt (optional)"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                onFocus={() => setSystemPromptExpanded(true)}
                onBlur={() => setSystemPromptExpanded(false)}
                className={`mt-2 resize-none transition-all duration-300 ${
                  systemPromptExpanded ? 'min-h-32' : 'min-h-10'
                }`}
              />
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Model Configuration</h3>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(modelSlots || []).map((slot) => (
                  <ModelSlotCard
                    key={slot.id}
                    slot={slot}
                    onRemove={handleRemoveSlot}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>

              <div className="pt-3 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Providers</h4>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingProvider(undefined)
                      setProviderDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-3">
                    {(providers || []).map((provider) => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        availableModels={(availableModels || {})[provider.id] || []}
                        onEdit={(p) => {
                          setEditingProvider(p)
                          setProviderDialogOpen(true)
                        }}
                        onDelete={handleDeleteProvider}
                        onFetchModels={handleFetchModels}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <Label htmlFor="user-prompt" className="text-sm font-semibold">
                User Prompt
              </Label>
              <Textarea
                id="user-prompt"
                placeholder="Enter your prompt to compare across models"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="mt-2 min-h-24 resize-none"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleRunComparison}
                  disabled={isRunning || activeSlots.length === 0}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" weight="fill" />
                  {isRunning ? 'Running...' : 'Run Comparison'}
                </Button>
              </div>
            </Card>

            {responses.length > 0 && (
              <Tabs defaultValue={activeSlots[0]?.id} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  {activeSlots.map((slot) => (
                    <TabsTrigger key={slot.id} value={slot.id} className="text-xs font-mono">
                      {slot.displayName}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {activeSlots.map((slot) => {
                  const response = responses.find(r => r.slotId === slot.id)
                  return (
                    <TabsContent key={slot.id} value={slot.id} className="mt-4">
                      {response && (
                        <ResponsePanel
                          response={response}
                          displayName={slot.displayName || ''}
                        />
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            )}
          </div>
        </div>
      </div>

      <ProviderDialog
        open={providerDialogOpen}
        onClose={() => {
          setProviderDialogOpen(false)
          setEditingProvider(undefined)
        }}
        onSave={handleSaveProvider}
        provider={editingProvider}
      />

      <Toaster />
    </div>
  )
}

export default App
