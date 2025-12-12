import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Plus, Play, X, Download } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { ProviderDialog } from '@/components/ProviderDialog'
import { ProviderCard } from '@/components/ProviderCard'
import { ResponsePanel } from '@/components/ResponsePanel'
import { Provider, ModelSlot, ModelResponse } from '@/lib/types'
import { streamChatCompletion, estimateTokenCount } from '@/lib/api'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

function App() {
  const [providers, setProviders] = useKV<Provider[]>('llm-providers', [])
  const [availableModels, setAvailableModels] = useKV<Record<string, string[]>>('provider-models', {})
  const [modelSlots, setModelSlots] = useKV<ModelSlot[]>('model-slots', [])
  
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [responses, setResponses] = useState<ModelResponse[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | undefined>()
  const [systemPromptExpanded, setSystemPromptExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('0')
  
  const dragDataRef = useRef<{ provider: Provider; modelId: string } | null>(null)
  const responsePanelRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const { installPrompt, isInstalled, promptInstall } = useInstallPrompt()

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
    e.currentTarget.classList.add('bg-accent/20')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-accent/20')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-accent/20')
    
    if (!dragDataRef.current) return

    const { provider, modelId } = dragDataRef.current
    
    const newSlot: ModelSlot = {
      id: Date.now().toString(),
      provider,
      modelId,
      displayName: `${provider.name} / ${modelId}`,
    }
    
    setModelSlots((currentSlots) => {
      const slots = currentSlots || []
      setActiveTab(slots.length.toString())
      return [...slots, newSlot]
    })
    
    dragDataRef.current = null
  }

  const handleRemoveSlot = (slotId: string) => {
    setModelSlots((current) =>
      (current || []).filter(slot => slot.id !== slotId)
    )
    
    setResponses((current) => 
      current.filter(r => r.slotId !== slotId)
    )
    
    const currentSlots = modelSlots || []
    const removingIndex = currentSlots.findIndex(s => s.id === slotId)
    if (activeTab === removingIndex.toString() && currentSlots.length > 1) {
      setActiveTab('0')
    }
  }

  const handleUpdateProviderParams = (providerId: string, params: Record<string, any>) => {
    setProviders((current) =>
      (current || []).map(p =>
        p.id === providerId ? { ...p, requestParams: params } : p
      )
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
    if (isRunning && abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsRunning(false)
      
      setResponses((current) =>
        current.map(r =>
          r.status === 'streaming'
            ? { ...r, status: 'aborted' as const, error: 'Request aborted by user' }
            : r
        )
      )
      
      toast.info('Comparison aborted')
      return
    }

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
    setActiveTab('0')
    
    abortControllerRef.current = new AbortController()
    
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
        let hasReasoningContent = false

        for await (const data of streamChatCompletion(slot.provider!, slot.modelId!, messages, abortControllerRef.current!.signal)) {
          if (data.httpStatus !== undefined) {
            response.metrics.httpStatus = data.httpStatus
            continue
          }

          if (data.reasoningChunk) {
            hasReasoningContent = true
            thinkingText += data.reasoningChunk
            
            if (!response.metrics.cotStart) {
              response.metrics.cotStart = response.metrics.firstToken || Date.now()
            }
            response.metrics.cotEnd = Date.now()
            
            setResponses((current) =>
              current.map(r =>
                r.slotId === slot.id
                  ? { ...r, thinking: thinkingText }
                  : r
              )
            )
          }

          if (!data.chunk && !data.reasoningChunk) continue
          
          const chunk = data.chunk || ''
          
          if (chunk) {
            fullText += chunk

            if (!response.metrics.firstToken) {
              response.metrics.firstToken = Date.now()
            }

            if (!hasReasoningContent && !thinkingProcessed) {
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
            } else if (hasReasoningContent) {
              contentText += chunk
              if (!response.metrics.contentStart) {
                response.metrics.contentStart = Date.now()
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
                      content: hasReasoningContent ? contentText : (thinkingProcessed ? contentText : fullText),
                    }
                  : r
              )
            )
          }
        }

        if (hasReasoningContent) {
          response.metrics.cotTokens = estimateTokenCount(thinkingText)
        } else {
          const finalDetected = detectThinkingSection(fullText)
          if (finalDetected) {
            thinkingText = finalDetected.thinking
            contentText = finalDetected.content
          } else {
            contentText = fullText
          }
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
        if (error instanceof Error && error.name === 'AbortError') {
          setResponses((current) =>
            current.map(r =>
              r.slotId === slot.id
                ? {
                    ...r,
                    status: 'aborted',
                    error: 'Request aborted by user',
                  }
                : r
            )
          )
        } else {
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
      }
    })

    await Promise.all(streamPromises)
    setIsRunning(false)
    abortControllerRef.current = null
  }

  const activeSlots = (modelSlots || []).filter(slot => slot.provider && slot.modelId)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <header className="border-b-2 border-foreground pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">LLM BENCHMARK</h1>
              <p className="text-sm text-muted-foreground">
                Precision model comparison with first token latency and TPS metrics
              </p>
            </div>
            {installPrompt && !isInstalled && (
              <Button
                onClick={promptInstall}
                variant="outline"
                size="sm"
                className="gap-2 border-2 border-foreground"
              >
                <Download className="h-4 w-4" weight="bold" />
                Install App
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <div className="space-y-4">
            <Card className="p-4 border-2 border-foreground">
              <Label htmlFor="system-prompt" className="text-sm font-semibold">System Prompt</Label>
              {systemPromptExpanded ? (
                <Textarea
                  id="system-prompt"
                  placeholder="Enter system prompt (optional)"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  onFocus={() => setSystemPromptExpanded(true)}
                  onBlur={() => setSystemPromptExpanded(false)}
                  className="mt-2 resize-none transition-all duration-300 min-h-32 border-2"
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => setSystemPromptExpanded(true)}
                  className="mt-2 w-full border-2 border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors cursor-text hover:border-ring overflow-hidden text-ellipsis"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '5.5rem',
                  }}
                >
                  {systemPrompt ? (
                    <span className="text-foreground whitespace-pre-wrap">
                      {systemPrompt}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Enter system prompt (optional)
                    </span>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-4 border-2 border-foreground">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Providers</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingProvider(undefined)
                    setProviderDialogOpen(true)
                  }}
                  className="transition-all active:scale-95 border-2 border-foreground"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <ScrollArea className="h-[600px] w-full">
                <div className="space-y-3 pr-2 w-full max-w-[320px]">
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
                      onUpdateParams={handleUpdateProviderParams}
                    />
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4 border-2 border-foreground">
              <Label htmlFor="user-prompt" className="text-sm font-semibold">
                User Prompt
              </Label>
              <Textarea
                id="user-prompt"
                placeholder="Enter your prompt to compare across models"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="mt-2 min-h-24 resize-none border-2"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleRunComparison}
                  disabled={activeSlots.length === 0}
                  className="gap-2 transition-all active:scale-95 border-2 border-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Play className="h-4 w-4" weight="fill" />
                  {isRunning ? 'Abort Comparison' : 'Run Comparison'}
                </Button>
              </div>
            </Card>

            <Card 
              ref={responsePanelRef}
              className="p-4 border-2 border-foreground min-h-[600px] transition-all duration-300"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {activeSlots.length === 0 ? (
                <div className="h-full min-h-[500px] flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                  <p className="text-muted-foreground text-center">
                    Drag models from providers to create comparison tabs
                  </p>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="w-full overflow-x-auto border-b-2 border-foreground mb-4">
                    <TabsList className="inline-flex h-auto flex-wrap min-w-full justify-start bg-transparent gap-0 p-0 border-0">
                      {activeSlots.map((slot, index) => {
                        const response = responses.find(r => r.slotId === slot.id)
                        const totalDuration = response?.metrics.requestSent && response?.metrics.contentEnd 
                          ? ((response.metrics.contentEnd - response.metrics.requestSent) / 1000).toFixed(2) 
                          : null
                        
                        return (
                          <TabsTrigger
                            key={slot.id}
                            value={index.toString()}
                            className="flex-shrink-0 group relative border-2 border-b-0 border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background px-3 py-2 h-auto"
                          >
                            <span className="truncate max-w-[200px] text-xs font-mono">{slot.displayName || `Model ${index + 1}`}</span>
                            {response?.status === 'streaming' && (
                              <span className="ml-2 inline-block w-2 h-2 bg-current animate-pulse" />
                            )}
                            {response?.status === 'complete' && totalDuration && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-2 cursor-help">✓</span>
                                </TooltipTrigger>
                                <TooltipContent className="border-2 border-foreground">
                                  <p className="font-mono">总时长: {totalDuration}s</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {response?.status === 'complete' && !totalDuration && (
                              <span className="ml-2">✓</span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveSlot(slot.id)
                              }}
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                  </div>
                  
                  <div className="mt-4">
                    {activeSlots.map((slot, index) => {
                      const response = responses.find(r => r.slotId === slot.id) || {
                        slotId: slot.id,
                        content: '',
                        thinking: '',
                        metrics: {},
                        status: 'idle' as const,
                      }
                      return (
                        <TabsContent key={slot.id} value={index.toString()} className="m-0">
                          <ResponsePanel
                            response={response}
                            displayName={slot.displayName || ''}
                          />
                        </TabsContent>
                      )
                    })}
                  </div>
                </Tabs>
              )}
            </Card>
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
  );
}

export default App
