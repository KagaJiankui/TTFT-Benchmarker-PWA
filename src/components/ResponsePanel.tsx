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
    <Card className="p-4 flex flex-col h-[600px]">
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

      <div className="mb-3 pb-3 border-b">
        {response.status === 'idle' ? (
          <p className="text-xs text-muted-foreground">No metrics yet</p>
        ) : (
          <MetricsDisplay metrics={response.metrics} />
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
  )
}
