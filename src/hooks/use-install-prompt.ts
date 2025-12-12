import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const FIRST_VISIT_KEY = 'llm-benchmark-first-visit'
const INSTALL_DISMISSED_KEY = 'llm-benchmark-install-dismissed'

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      
      const isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY)
      const wasDismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true'
      
      if (isFirstVisit && !wasDismissed) {
        setShowInstallBanner(true)
        localStorage.setItem(FIRST_VISIT_KEY, 'true')
      }
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      setShowInstallBanner(false)
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setShowInstallBanner(false)
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
    }
  }

  const dismissBanner = () => {
    setShowInstallBanner(false)
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
  }

  return { installPrompt, isInstalled, promptInstall, showInstallBanner, dismissBanner }
}
