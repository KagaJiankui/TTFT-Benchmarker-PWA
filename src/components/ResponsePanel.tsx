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
      <div className="mb-3 flex items-center justify-between border-b-2 border-foreground pb-2">
        <h3 className="font-semibold text-sm font-mono">{displayName}</h3>
        {response.status === 'streaming' && (
          <Badge className="bg-accent text-accent-foreground border-2 border-foreground animate-pulse">
            {response.metrics.httpStatus ? `HTTP ${response.metrics.httpStatus} · ` : ''}Streaming...
          </Badge>
        )}
        {response.status === 'complete' && (
          <Badge variant="outline" className="border-2 border-foreground">
            {response.metrics.httpStatus ? `HTTP ${response.metrics.httpStatus} · ` : ''}Complete ✓
          </Badge>
        )}
        {response.status === 'aborted' && (
          <Badge variant="secondary" className="border-2 border-foreground">
            {response.metrics.httpStatus ? `HTTP ${response.metrics.httpStatus} · ` : ''}Aborted
          </Badge>
        )}
        {response.status === 'error' && (
          <Badge variant="destructive" className="border-2 border-destructive">
            {response.metrics.httpStatus ? `HTTP ${response.metrics.httpStatus} · ` : ''}Error
          </Badge>
        )}
      </div>

      <div className="flex-1 flex gap-0 overflow-hidden border-2 border-foreground">
        <ScrollArea className="flex-1">
          <div className="pr-4 p-4">
            {(response.status === 'error' || response.status === 'aborted') && response.error && (
              <div className="bg-destructive text-destructive-foreground border-2 border-destructive p-3 text-sm">
                {response.error}
              </div>
            )}

            {response.status === 'idle' && (
              <div className="text-muted-foreground text-sm text-center py-8">
                Waiting to start...
              </div>
            )}

            {response.thinking && (
              <div className="relative mb-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold border-b border-foreground pb-1">
                  CoT (Chain of Thought)
                </div>
                <div 
                  className={`bg-muted/50 p-4 text-sm whitespace-pre-wrap border-l-4 transition-all duration-300 ${
                    response.status === 'streaming' ? 'border-accent animate-pulse' : 'border-foreground'
                  }`}
                  style={{
                    backgroundImage: response.status === 'streaming' 
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, oklch(0.90 0 0) 10px, oklch(0.90 0 0) 20px)' 
                      : 'none'
                  }}
                >
                  {response.thinking}
                </div>
              </div>
            )}

            {response.content && (
              <div className={response.thinking ? 'mt-0' : ''}>
                <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold border-b border-foreground pb-1">
                  Response
                </div>
                <div 
                  className={`bg-background p-4 text-sm whitespace-pre-wrap border-l-4 transition-all duration-300 ${
                    response.status === 'streaming' ? 'border-accent animate-pulse' : 'border-foreground'
                  }`}
                  style={{
                    backgroundImage: response.status === 'streaming' 
                      ? 'repeating-linear-gradient(90deg, transparent, transparent 10px, oklch(0.96 0 0) 10px, oklch(0.96 0 0) 20px)' 
                      : 'none'
                  }}
                >
                  {response.content}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-col border-l-2 border-foreground w-24 flex-shrink-0 bg-muted/10">
          <div className="flex-1 flex flex-col items-center justify-start gap-6 py-4 px-2">
            {ttft !== null && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-mono font-bold whitespace-nowrap">
                  TTFT
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatDuration(ttft)}
                </div>
              </div>
            )}

            {response.thinking && cotDuration !== null && (
              <div className="flex-1 flex flex-col items-center justify-center border-t-2 border-b-2 border-foreground py-4 min-h-[100px] relative w-full">
                <div className="absolute top-2 text-[10px] font-mono font-bold whitespace-nowrap">
                  CoT
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
                    <div className="text-[10px] font-mono font-bold whitespace-nowrap text-center">
                      正文TTFT
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {formatDuration(contentTTFT)}
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center border-t-2 border-b-2 border-foreground py-4 min-h-[120px] relative w-full">
                  <div className="absolute top-2 text-[10px] font-mono font-bold whitespace-nowrap text-center">
                    正文
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
              <div className="flex flex-col items-center gap-1 mt-auto pt-4 border-t-2 border-foreground w-full">
                <div className="text-[10px] font-mono font-bold whitespace-nowrap">
                  总时长
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatDuration(totalDuration)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
