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
    updateProvider(entries)
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

  return (
    <Card className="p-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Request Parameters</h4>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleAddParam}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No custom parameters. Click + to add.
          </p>
        ) : (
          entries.map((entry, index) => (
            <div key={index} className="flex gap-1.5 items-center">
              <Input
                id={`${providerId}-${index}-key`}
                value={entry.key}
                onChange={(e) => handleKeyChange(index, e.target.value)}
                onBlur={() => handleBlur(index)}
                onDoubleClick={() => handleDoubleClick(index, 'key')}
                placeholder="key"
                className="text-xs h-7 flex-1 font-mono"
              />
              <Input
                id={`${providerId}-${index}-value`}
                value={entry.value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                onBlur={() => handleBlur(index)}
                onDoubleClick={() => handleDoubleClick(index, 'value')}
                placeholder="value (JSON)"
                className="text-xs h-7 flex-[2] font-mono"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive"
                onClick={() => handleRemoveParam(index)}
              >
                <Trash className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
      
      <p className="text-[10px] text-muted-foreground mt-2">
        Double-click to edit. Values are parsed as JSON.
      </p>
    </Card>
  )
}
