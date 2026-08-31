'use client';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installedToast, setInstalledToast] = useState<{ show: boolean; text: string }>({
    show: false,
    text: '',
  });

  useEffect(() => {
    // Detect iOS
    const isIOSDevice =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !('MSStream' in window);

    // Check if already in standalone mode (already installed)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && Boolean((window.navigator as unknown as { standalone: boolean }).standalone)));

    if (isStandalone) {
      return;
    }

    const dismissed = localStorage.getItem('install_prompt_dismissed');

    if (isIOSDevice) {
      setIsIOS(true);
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 4000);
        return () => clearTimeout(timer);
      }
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    const handleManualOpen = () => {
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      const msg = isMobile
        ? 'Tilawah installed! You can now open it anytime from your home screen or apps folder.'
        : 'Tilawah installed! You can now access it from your applications menu or desktop.';
      
      setInstalledToast({ show: true, text: msg });
      setTimeout(() => {
        setInstalledToast({ show: false, text: '' });
      }, 4000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('open-install-prompt', handleManualOpen);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('open-install-prompt', handleManualOpen);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      const msg = isMobile
        ? 'Tilawah installed! Open it anytime from your home screen or apps folder.'
        : 'Tilawah installed! Access it from your desktop or applications menu.';
      
      setInstalledToast({ show: true, text: msg });
      setTimeout(() => {
        setInstalledToast({ show: false, text: '' });
      }, 4000);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('install_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  return (
    <>
      {/* Post-installation feedback toast */}
      {installedToast.show && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100000] max-w-sm w-[90%] bg-[#1e5e4a] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gold/40 flex items-center gap-3 animate-[slide-down_0.3s_ease-out]">
          <span className="text-2xl">📱</span>
          <p className="text-xs font-bold leading-relaxed">{installedToast.text}</p>
        </div>
      )}

      {/* Main Install Prompt Banner */}
      {showPrompt && (
        <div className="install-prompt-container">
          <div className="install-prompt">
            <div className="install-prompt__content">
              <span className="install-prompt__icon">📱</span>
              <div className="install-prompt__text">
                <p className="install-prompt__title">
                  Add Tilawah to your home screen
                </p>
                <p className="install-prompt__subtitle">
                  {isIOS ? (
                    <>
                      On iPhone: tap <strong>Share</strong> (
                      <span className="inline-block px-1">⎋</span>) →{' '}
                      <strong>Add to Home Screen</strong>
                    </>
                  ) : (
                    'Open it like an app, works offline with cached audio'
                  )}
                </p>
              </div>
            </div>
            <div className="install-prompt__actions">
              <button
                onClick={handleDismiss}
                className="install-prompt__skip"
                type="button"
              >
                Not now
              </button>
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="install-prompt__install"
                  type="button"
                >
                  Install
                </button>
              )}
              {isIOS && (
                <button
                  onClick={handleDismiss}
                  className="install-prompt__install"
                  type="button"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
