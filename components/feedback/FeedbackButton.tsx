'use client';
import { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="feedback-fab"
        aria-label="Give feedback"
        title="Give feedback"
      >
        <span className="feedback-fab__icon">💬</span>
        <span className="feedback-fab__label">Feedback</span>
      </button>
      {isOpen && (
        <FeedbackModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
