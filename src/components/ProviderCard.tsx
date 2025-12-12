import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GearSix, Trash, Plus, ArrowsDownUp, MagnifyingGlass, SortAscending, X } from '@phosphor-icons/react'
import { Provider } from '@/lib/types'
import { fetchModelsFromProvider } from '@/lib/api'
import { toast } from 'sonner'
import { RequestParamsCard } from './RequestParamsCard'

interface ProviderCardProps {
  provider: Provider
  availableModels: string[]
  onEdit: (provider: Provider) => void
  onDelete: (providerId: string) => void
  onFetchModels: (providerId: string, models: string[]) => void
  onDragStart: (provider: Provider, modelId: string) => void
  onUpdateParams: (providerId: string, params: Record<string, any>) => void
}

export function ProviderCard({
  provider,
  availableModels,
  onEdit,
  onDelete,
  onFetchModels,
  onDragStart,
  onUpdateParams,
}: ProviderCardProps) {
  const [loading, setLoading] = useState(false)
  const [manualModel, setManualModel] = useState('')
  const [searchPattern, setSearchPattern] = useState('')
  const [sortAlphabetically, setSortAlphabetically] = useState(false)

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

  const filteredAndSortedModels = useMemo(() => {
    let models = [...availableModels]

    if (searchPattern.trim()) {
      try {
        const regex = new RegExp(searchPattern, 'i')
        models = models.filter(modelId => regex.test(modelId))
      } catch (error) {
        models = models.filter(modelId => 
          modelId.toLowerCase().includes(searchPattern.toLowerCase())
        )
      }
    }

    if (sortAlphabetically) {
      models.sort((a, b) => a.localeCompare(b))
    }

    return models
  }, [availableModels, searchPattern, sortAlphabetically])

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
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search (regex supported)"
                  value={searchPattern}
                  onChange={(e) => setSearchPattern(e.target.value)}
                  className="text-xs pl-7 pr-7"
                />
                {searchPattern && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchPattern('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button
                size="icon"
                variant={sortAlphabetically ? 'default' : 'outline'}
                className="h-8 w-8"
                onClick={() => setSortAlphabetically(!sortAlphabetically)}
              >
                <SortAscending className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="flex flex-wrap gap-1.5">
                {filteredAndSortedModels.map((modelId) => (
                  <Badge
                    key={modelId}
                    draggable
                    onDragStart={() => onDragStart(provider, modelId)}
                    variant="secondary"
                    className="cursor-move hover:bg-accent transition-colors text-xs px-2 py-1 font-mono"
                  >
                    {modelId}
                  </Badge>
                ))}
                {filteredAndSortedModels.length === 0 && (
                  <p className="text-xs text-muted-foreground w-full text-center py-4">
                    No models match your search
                  </p>
                )}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground text-center">
              {filteredAndSortedModels.length} / {availableModels.length} models
            </p>
          </div>
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

      <RequestParamsCard
        providerId={provider.id}
        params={provider.requestParams || {}}
        onUpdate={onUpdateParams}
      />
    </Card>
  )
}
