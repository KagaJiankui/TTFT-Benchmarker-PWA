import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface RequestParamsCardProps {
  providerId: string
  params: Record<string, any>
  onUpdate: (providerId: string, params: Record<string, any>) => void
}

export function RequestParamsCard({ providerId, params, onUpdate }: RequestParamsCardProps) {
  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>(
    Object.entries(params || {}).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
    }))
  )

  const handleAddParam = () => {
    setEntries([...entries, { key: '', value: '' }])
  }

  const handleRemoveParam = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index)
    setEntries(newEntries)
    updateProvider(newEntries)
  }

  const handleKeyChange = (index: number, key: string) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], key }
    setEntries(newEntries)
  }

  const handleValueChange = (index: number, value: string) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], value }
    setEntries(newEntries)
  }

  const handleDoubleClick = (index: number, field: 'key' | 'value') => {
    const input = document.getElementById(`${providerId}-${index}-${field}`) as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  }

  const handleBlur = (index: number) => {
    const entry = entries[index]
    if (!entry.key.trim() && !entry.value.trim()) {
      const newEntries = entries.filter((_, i) => i !== index)
      setEntries(newEntries)
      updateProvider(newEntries)
    } else {
      updateProvider(entries)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const target = e.target as HTMLInputElement
      target.blur()
    }
  }

  const updateProvider = (currentEntries: Array<{ key: string; value: string }>) => {
    try {
      const newParams: Record<string, any> = {}
      currentEntries.forEach(({ key, value }) => {
        if (key.trim()) {
          try {
            newParams[key] = JSON.parse(value)
          } catch {
            newParams[key] = value
          }
        }
      })
      onUpdate(providerId, newParams)
    } catch (error) {
      toast.error('Invalid parameter format')
    }
  }

  const handleClearAll = () => {
    setEntries([])
    updateProvider([])
  }

  return (
    <Card className="p-3 mt-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground flex-shrink-0">Request Params</h4>
        <div className="flex gap-1 flex-shrink-0">
          {entries.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={handleClearAll}
            >
              Clear
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={handleAddParam}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No custom params. Click + to add.
          </p>
        ) : (
          entries.map((entry, index) => (
            <div key={index} className="flex gap-1 items-center">
              <Input
                id={`${providerId}-${index}-key`}
                value={entry.key}
                onChange={(e) => handleKeyChange(index, e.target.value)}
                onBlur={() => handleBlur(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onDoubleClick={() => handleDoubleClick(index, 'key')}
                placeholder="key"
                className="text-xs h-7 min-w-0 w-20 font-mono"
              />
              <Input
                id={`${providerId}-${index}-value`}
                value={entry.value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                onBlur={() => handleBlur(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onDoubleClick={() => handleDoubleClick(index, 'value')}
                placeholder="value"
                className="text-xs h-7 min-w-0 flex-1 font-mono"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 flex-shrink-0 text-destructive"
                onClick={() => handleRemoveParam(index)}
              >
                <Trash className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
      
      <p className="text-[10px] text-muted-foreground mt-2">
        Double-click to select. Press Enter or blur to save. Leave empty to delete.
      </p>
    </Card>
  )
}
