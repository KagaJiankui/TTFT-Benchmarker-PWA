import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ModelResponse } from '@/lib/types'
import { formatDuration, calculateTPS } from '@/lib/api'

interface ResponsePanelProps {
  response: ModelResponse
  displayName: string
}

export function ResponsePanel({ response, displayName }: ResponsePanelProps) {
  const ttft = response.metrics.firstToken && response.metrics.requestSent
    ? response.metrics.firstToken - response.metrics.requestSent
    : null

  const cotDuration = response.metrics.cotStart && response.metrics.cotEnd
    ? response.metrics.cotEnd - response.metrics.cotStart
    : null

  const contentTTFT = response.metrics.contentStart && response.metrics.requestSent
    ? response.metrics.contentStart - response.metrics.requestSent
    : null

  const contentDuration = response.metrics.contentStart && response.metrics.contentEnd
    ? response.metrics.contentEnd - response.metrics.contentStart
    : null

  const contentTPS = contentDuration && response.metrics.contentTokens
    ? calculateTPS(response.metrics.contentTokens, response.metrics.contentStart!, response.metrics.contentEnd!)
    : null

  const totalDuration = response.metrics.requestSent && response.metrics.contentEnd
    ? response.metrics.contentEnd - response.metrics.requestSent
    : null

  return (
    <div className="flex flex-col h-[600px]">
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

      <div className="flex-1 flex gap-0 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="pr-4">
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

            {response.thinking && (
              <div className="relative">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  若有CoT，显示CoT
                </div>
                <div className="bg-muted/30 rounded-md p-4 text-sm whitespace-pre-wrap border-l-2 border-purple-400">
                  {response.thinking}
                </div>
              </div>
            )}

            {response.content && (
              <div className={response.thinking ? 'mt-0' : ''}>
                <div className="bg-background rounded-md p-4 text-sm whitespace-pre-wrap">
                  {response.content}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-col border-l border-border w-24 flex-shrink-0">
          <div className="flex-1 flex flex-col items-center justify-start gap-6 py-4 px-2">
            {ttft !== null && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-mono text-blue-600 font-semibold whitespace-nowrap">
                  TTFT
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatDuration(ttft)}
                </div>
              </div>
            )}

            {response.thinking && cotDuration !== null && (
              <div className="flex-1 flex flex-col items-center justify-center border-t border-b border-purple-200 py-4 min-h-[100px] relative">
                <div className="absolute top-2 text-[10px] font-mono text-purple-600 font-semibold whitespace-nowrap">
                  CoT Duration
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-4">
                  {formatDuration(cotDuration)}
                </div>
              </div>
            )}

            {response.content && (
              <>
                {contentTTFT !== null && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-[10px] font-mono text-green-600 font-semibold whitespace-nowrap text-center">
                      正文TTFT
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {formatDuration(contentTTFT)}
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center border-t border-b border-green-200 py-4 min-h-[120px] relative">
                  <div className="absolute top-2 text-[10px] font-mono text-green-600 font-semibold whitespace-nowrap text-center">
                    正文持续时间
                  </div>
                  {contentDuration !== null && (
                    <div className="text-xs font-mono text-muted-foreground mt-4">
                      {formatDuration(contentDuration)}
                    </div>
                  )}
                </div>
              </>
            )}

            {totalDuration !== null && (
              <div className="flex flex-col items-center gap-1 mt-auto pt-4 border-t">
                <div className="text-[10px] font-mono text-red-600 font-semibold whitespace-nowrap">
                  总时长
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatDuration(totalDuration)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col border-l border-border w-20 flex-shrink-0 bg-muted/20">
          <div className="flex-1 flex flex-col items-center justify-start py-4 px-2">
            {response.metrics.httpStatus && (
              <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] font-mono text-muted-foreground text-center leading-tight">
                  显示HTTP<br/>返回码
                </div>
                <div className={`text-sm font-bold font-mono ${
                  response.metrics.httpStatus === 200 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {response.metrics.httpStatus}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
