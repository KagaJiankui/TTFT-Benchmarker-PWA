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
  const [isExpanded, setIsExpanded] = useState(true)

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
    <Card className="p-4 border-2 border-foreground">
      <div className="flex items-start justify-between mb-3">
        <div 
          className="flex-1 cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="font-semibold text-sm group-hover:animate-[blink_0.5s_ease-in-out]">{provider.name}</h3>
          <p className="text-xs text-muted-foreground truncate max-w-[200px] group-hover:animate-[blink_0.5s_ease-in-out]">
            {provider.endpoint}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 border border-foreground/20 transition-all active:scale-95"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(provider)
            }}
          >
            <GearSix className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 border border-destructive/20 text-destructive transition-all active:scale-95"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(provider.id)
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full border-2 transition-all active:scale-95"
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
                    className="text-xs pl-7 pr-7 border-2"
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
                  className="h-8 w-8 border-2 transition-all active:scale-95"
                  onClick={() => setSortAlphabetically(!sortAlphabetically)}
                >
                  <SortAscending className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-48 border-2 border-foreground p-2">
                <div className="flex flex-wrap gap-1.5">
                  {filteredAndSortedModels.map((modelId) => (
                    <Badge
                      key={modelId}
                      draggable
                      onDragStart={() => onDragStart(provider, modelId)}
                      variant="secondary"
                      className="cursor-move hover:bg-accent hover:text-accent-foreground transition-all active:scale-95 text-xs px-2 py-1 font-mono border border-foreground/20"
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
              className="text-xs border-2"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddManualModel}
              disabled={!manualModel.trim()}
              className="border-2 transition-all active:scale-95"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {isExpanded && (
        <RequestParamsCard
          providerId={provider.id}
          params={provider.requestParams || {}}
          onUpdate={onUpdateParams}
        />
      )}
    </Card>
  )
}
