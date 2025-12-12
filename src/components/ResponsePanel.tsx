import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ModelResponse } from '@/lib/types'
import { MetricsDisplay } from './MetricsDisplay'

interface ResponsePanelProps {
  response: ModelResponse
  displayName: string
}

export function ResponsePanel({ response, displayName }: ResponsePanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 h-full">
      <Card className="p-4 flex flex-col overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-sm font-mono">{displayName}</h3>
          {response.status === 'streaming' && (
            <Badge className="bg-accent text-accent-foreground animate-pulse">
              Streaming...
            </Badge>
          )}
          {response.status === 'complete' && (
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
              Complete
            </Badge>
          )}
          {response.status === 'error' && (
            <Badge variant="destructive">Error</Badge>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {response.thinking && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                      思考过程
                    </Badge>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">
                    {response.thinking}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {response.content && (
              <div>
                {response.thinking && (
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      回答内容
                    </Badge>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">
                  {response.content}
                </div>
              </div>
            )}

            {response.status === 'error' && response.error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {response.error}
              </div>
            )}

            {response.status === 'idle' && (
              <div className="text-muted-foreground text-sm text-center py-8">
                Waiting to start...
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-4 lg:w-48 shrink-0">
        <h4 className="font-semibold text-sm mb-3">Metrics</h4>
        {response.status === 'idle' ? (
          <p className="text-xs text-muted-foreground">No data yet</p>
        ) : (
          <MetricsDisplay metrics={response.metrics} />
        )}
      </Card>
    </div>
  )
}
