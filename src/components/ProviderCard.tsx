import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GearSix, Trash, Plus, ArrowsDownUp } from '@phosphor-icons/react'
import { Provider } from '@/lib/types'
import { fetchModelsFromProvider } from '@/lib/api'
import { toast } from 'sonner'

interface ProviderCardProps {
  provider: Provider
  availableModels: string[]
  onEdit: (provider: Provider) => void
  onDelete: (providerId: string) => void
  onFetchModels: (providerId: string, models: string[]) => void
  onDragStart: (provider: Provider, modelId: string) => void
}

export function ProviderCard({
  provider,
  availableModels,
  onEdit,
  onDelete,
  onFetchModels,
  onDragStart,
}: ProviderCardProps) {
  const [loading, setLoading] = useState(false)
  const [manualModel, setManualModel] = useState('')

  const handleFetchModels = async () => {
    setLoading(true)
    try {
      const models = await fetchModelsFromProvider(provider)
      onFetchModels(provider.id, models)
      toast.success(`Fetched ${models.length} models from ${provider.name}`)
    } catch (error) {
      toast.error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddManualModel = () => {
    if (!manualModel.trim()) return
    onFetchModels(provider.id, [...availableModels, manualModel.trim()])
    setManualModel('')
    toast.success('Model added manually')
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{provider.name}</h3>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {provider.endpoint}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onEdit(provider)}
          >
            <GearSix className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(provider.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleFetchModels}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Fetch Models'}
        </Button>

        {availableModels.length > 0 && (
          <ScrollArea className="h-32 border rounded-md p-2">
            <div className="space-y-1">
              {availableModels.map((modelId) => (
                <div
                  key={modelId}
                  draggable
                  onDragStart={() => onDragStart(provider, modelId)}
                  className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-move transition-colors"
                >
                  <ArrowsDownUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-mono flex-1 truncate">{modelId}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Manual model ID"
            value={manualModel}
            onChange={(e) => setManualModel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManualModel()}
            className="text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddManualModel}
            disabled={!manualModel.trim()}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
