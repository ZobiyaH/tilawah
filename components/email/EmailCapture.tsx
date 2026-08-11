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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c8993c" className="w-6 h-6 text-gold animate-pulse mb-1">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
        </svg>
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
