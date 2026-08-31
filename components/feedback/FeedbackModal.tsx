'use client';
import { useState } from 'react';

type FeedbackType = 'bug' | 'suggestion' | 'praise' | 'other';

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');

    const formspreeUrl = process.env.NEXT_PUBLIC_FEEDBACK_FORMSPREE_URL || 'https://formspree.io/f/xoeqeaon';

    try {

      const response = await fetch(formspreeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          message: message,
          email: email || 'Not provided',
          page: typeof window !== 'undefined' ? window.location.pathname : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          submittedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => onClose(), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="feedback-modal-overlay" onClick={onClose}>
        <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
          <div className="feedback-success">
            <span className="feedback-success__icon">🤲</span>
            <p>JazakAllah Khair! Your feedback means a lot.</p>
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email (optional, in case I need to follow up)"
            className="feedback-email-input"
          />

          {status === 'error' && (
            <p className="feedback-error">
              Something went wrong. Please try again.
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
