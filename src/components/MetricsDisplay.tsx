import { Badge } from '@/components/ui/badge'
import { TimingMetrics } from '@/lib/types'
import { formatDuration, calculateTPS } from '@/lib/api'

interface MetricsDisplayProps {
  metrics: TimingMetrics
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const ttft = metrics.firstToken && metrics.requestSent
    ? metrics.firstToken - metrics.requestSent
    : null

  const cotDuration = metrics.cotStart && metrics.cotEnd
    ? metrics.cotEnd - metrics.cotStart
    : null

  const cotTPS = cotDuration && metrics.cotTokens
    ? calculateTPS(metrics.cotTokens, metrics.cotStart!, metrics.cotEnd!)
    : null

  const contentTTFT = metrics.contentStart && metrics.requestSent
    ? metrics.contentStart - metrics.requestSent
    : null

  const contentDuration = metrics.contentStart && metrics.contentEnd
    ? metrics.contentEnd - metrics.contentStart
    : null

  const contentTPS = contentDuration && metrics.contentTokens
    ? calculateTPS(metrics.contentTokens, metrics.contentStart!, metrics.contentEnd!)
    : null

  const totalDuration = metrics.requestSent && metrics.contentEnd
    ? metrics.contentEnd - metrics.requestSent
    : null

  return (
    <div className="space-y-2 text-xs font-mono">
      {ttft !== null && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">TTFT:</span>
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
            {formatDuration(ttft)}
          </Badge>
        </div>
      )}

      {cotDuration !== null && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">CoT Time:</span>
            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
              {formatDuration(cotDuration)}
            </Badge>
          </div>
          {cotTPS !== null && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">CoT TPS:</span>
              <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                {cotTPS.toFixed(1)} t/s
              </Badge>
            </div>
          )}
        </>
      )}

      {contentTTFT !== null && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Content TTFT:</span>
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
            {formatDuration(contentTTFT)}
          </Badge>
        </div>
      )}

      {contentTPS !== null && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Content TPS:</span>
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
            {contentTPS.toFixed(1)} t/s
          </Badge>
        </div>
      )}

      {totalDuration !== null && (
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-muted-foreground">Total:</span>
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
            {formatDuration(totalDuration)}
          </Badge>
        </div>
      )}
    </div>
  )
}
