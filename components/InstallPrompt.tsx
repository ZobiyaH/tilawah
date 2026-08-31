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
        // Show after a brief delay
        const timer = setTimeout(() => setShowPrompt(true), 4000);
        return () => clearTimeout(timer);
      }
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Only show if user hasn't dismissed before
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    const handleManualOpen = () => {
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('open-install-prompt', handleManualOpen);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('open-install-prompt', handleManualOpen);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('install_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
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
  );
}
