'use client';

import { useState } from 'react';
import { subscribeEmail, hasSubmittedEmail } from '@/lib/email/subscribe';

interface EmailCaptureProps {
  variant: 'banner' | 'popup' | 'footer' | 'inline';
  source: string;
  heading?: string;
  subheading?: string;
  onSuccess?: () => void;
}

export function EmailCapture({
  variant,
  source,
  heading,
  subheading,
  onSuccess,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    const result = await subscribeEmail(email, source);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setEmail('');
      onSuccess?.();
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  // Do not show popup if already submitted before
  if (variant === 'popup' && hasSubmittedEmail()) {
    return null;
  }

  if (status === 'success') {
    return (
      <div className={`email-capture email-capture--${variant} email-capture--success`}>
        <span className="email-capture__icon">🤲</span>
        <p className="email-capture__success-msg">{message}</p>
      </div>
    );
  }

  return (
    <div className={`email-capture email-capture--${variant}`}>
      {heading && (
        <h3 className="email-capture__heading">{heading}</h3>
      )}
      {subheading && (
        <p className="email-capture__subheading">{subheading}</p>
      )}
      <form onSubmit={handleSubmit} className="email-capture__form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={status === 'loading'}
          className="email-capture__input"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email}
          className="email-capture__button"
        >
          {status === 'loading' ? 'Sending...' : 'Notify me'}
        </button>
      </form>
      {status === 'error' && (
        <p className="email-capture__error">{message}</p>
      )}
      <p className="email-capture__privacy">
        No spam. We only email about Tilawah updates.
      </p>
    </div>
  );
}
