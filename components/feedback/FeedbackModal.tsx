'use client';
import { useState } from 'react';
import { trackEvent } from '@/lib/analytics/ga';

type FeedbackType = 'bug' | 'suggestion' | 'praise' | 'other';

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    const formspreeUrl =
      process.env.NEXT_PUBLIC_FEEDBACK_FORMSPREE_URL ||
      'https://formspree.io/f/xoeqeaon';

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('message', message.trim());
      
      // If email is provided, validate; if not, pass clean text or omit invalid formats
      const cleanEmail = email.trim();
      if (cleanEmail) {
        formData.append('email', cleanEmail);
      }
      
      formData.append('page', typeof window !== 'undefined' ? window.location.pathname : 'unknown');
      formData.append('userAgent', typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown');
      formData.append('submittedAt', new Date().toISOString());

      const response = await fetch(formspreeUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        trackEvent('feedback_submitted', 'feedback', type);
        setStatus('success');
        setTimeout(() => onClose(), 2200);
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Feedback Formspree error:', errorData);
        setStatus('error');
        setErrorMessage('Could not send feedback. Please try again.');
      }
    } catch (err) {
      console.error('Feedback network error:', err);
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="feedback-modal-overlay" onClick={onClose}>
        <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
          <div className="feedback-success">
            <span className="feedback-success__icon">🤲</span>
            <p className="font-bold text-base text-[#1e5e4a] dark:text-emerald-300">
              JazakAllah Khair! Your feedback means a lot.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal__header">
          <h3>Help improve Tilawah</h3>
          <button onClick={onClose} className="feedback-modal__close" aria-label="Close feedback modal">×</button>
        </div>
        
        <p className="feedback-modal__subtitle">
          Found a bug? Have an idea? Tell me directly — 
          I read every single message.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="feedback-type-selector">
            <button
              type="button"
              className={type === 'bug' ? 'active' : ''}
              onClick={() => setType('bug')}
            >
              🐛 Bug
            </button>
            <button
              type="button"
              className={type === 'suggestion' ? 'active' : ''}
              onClick={() => setType('suggestion')}
            >
              💡 Suggestion
            </button>
            <button
              type="button"
              className={type === 'praise' ? 'active' : ''}
              onClick={() => setType('praise')}
            >
              🌟 Praise
            </button>
            <button
              type="button"
              className={type === 'other' ? 'active' : ''}
              onClick={() => setType('other')}
            >
              💬 Other
            </button>
          </div>

          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === 'bug' 
                ? 'What went wrong? Which page, what happened...' 
                : type === 'suggestion'
                ? 'What would make Tilawah better for you?'
                : "Tell me what's on your mind..."
            }
            required
            rows={4}
            className="feedback-textarea"
          />

          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email (optional, in case I need to follow up)"
            className="feedback-email-input"
          />

          {status === 'error' && (
            <p className="feedback-error">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !message.trim()}
            className="feedback-submit"
          >
            {status === 'loading' ? 'Sending...' : 'Send Feedback 🤲'}
          </button>
        </form>
      </div>
    </div>
  );
}
