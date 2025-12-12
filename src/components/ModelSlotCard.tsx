import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from '@phosphor-icons/react'
import { ModelSlot } from '@/lib/types'

interface ModelSlotCardProps {
  slot: ModelSlot
  onRemove: (slotId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (slotId: string) => void
}

export function ModelSlotCard({ slot, onRemove, onDragOver, onDrop }: ModelSlotCardProps) {
  const isEmpty = !slot.provider || !slot.modelId

  return (
    <Card
      className={`p-3 transition-all ${
        isEmpty
          ? 'border-dashed border-2 border-muted-foreground/30 bg-muted/20'
          : 'border-accent/50 bg-accent/5'
      }`}
      onDragOver={onDragOver}
      onDrop={() => onDrop(slot.id)}
    >
      {isEmpty ? (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Drag model here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="mb-1 text-xs">
                {slot.provider?.name}
              </Badge>
              <p className="text-xs font-mono truncate">{slot.modelId}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={() => onRemove(slot.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
