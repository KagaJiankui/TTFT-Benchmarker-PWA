import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Provider } from '@/lib/types'

interface ProviderDialogProps {
  open: boolean
  onClose: () => void
  onSave: (provider: Omit<Provider, 'id'>) => void
  provider?: Provider
}

export function ProviderDialog({ open, onClose, onSave, provider }: ProviderDialogProps) {
  const [name, setName] = useState(provider?.name || '')
  const [endpoint, setEndpoint] = useState(provider?.endpoint || '')
  const [apiKey, setApiKey] = useState(provider?.apiKey || '')

  useEffect(() => {
    if (provider) {
      setName(provider.name)
      setEndpoint(provider.endpoint)
      setApiKey(provider.apiKey)
    } else {
      setName('')
      setEndpoint('')
      setApiKey('')
    }
  }, [provider, open])

  const handleSave = () => {
    if (!name || !endpoint || !apiKey) return
    
    onSave({ name, endpoint, apiKey })
    handleClose()
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{provider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider-name">Provider Name</Label>
            <Input
              id="provider-name"
              placeholder="e.g., OpenAI, Anthropic"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="provider-endpoint">API Endpoint</Label>
            <Input
              id="provider-endpoint"
              placeholder="https://api.openai.com"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Base URL. Include /v4 for custom versions, defaults to /v1
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="provider-api-key">API Key</Label>
            <Input
              id="provider-api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name || !endpoint || !apiKey}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
