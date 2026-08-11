'use client';

import { useState } from 'react';

export default function AdminEmailsPage() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const ADMIN_PASSWORD = 'tilawah2025'; 
  // User should change this

  if (!unlocked) {
    return (
      <div style={{ padding: 40, maxWidth: 400, margin: '0 auto' }}>
        <h2>Admin Access</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          style={{ 
            width: '100%', 
            padding: 12, 
            marginTop: 12,
            marginBottom: 12,
            border: '1px solid #ccc',
            borderRadius: 8,
          }}
        />
        <button
          onClick={() => {
            if (password === ADMIN_PASSWORD) {
              setUnlocked(true);
            }
          }}
          style={{
            padding: '12px 24px',
            background: '#1e5e4a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Enter
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
      <h2>Email Collection Status</h2>
      <p>
        Emails are collected via Formspree.
      </p>
      <p>
        To view all submitted emails, visit:
      </p>
      <a 
        href="https://formspree.io/forms" 
        target="_blank"
        style={{ color: '#1e5e4a', fontWeight: 700 }}
      >
        Open Formspree Dashboard →
      </a>
      <p style={{ marginTop: 24, fontSize: 14, color: '#666' }}>
        Every submission also sends you 
        an instant email notification 
        to your registered Formspree email.
      </p>
    </div>
  );
}
