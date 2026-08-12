import { trackEvent } from '@/lib/analytics/ga';

export type SubscribeResult = {
  success: boolean;
  message: string;
};

export async function subscribeEmail(
  email: string,
  source: string = 'website',
  name?: string
): Promise<SubscribeResult> {

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
    };
  }

  const formspreeUrl = 
    process.env.NEXT_PUBLIC_FORMSPREE_URL;

  if (!formspreeUrl) {
    console.error(
      'FORMSPREE_URL not configured. ' +
      'Add NEXT_PUBLIC_FORMSPREE_URL to environment variables.'
    );
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
    };
  }

  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('name', name || 'Not provided');
    formData.append('source', source);
    formData.append('page', typeof window !== 'undefined' ? window.location.pathname : 'unknown');
    formData.append('submittedAt', new Date().toISOString());

    const response = await fetch(formspreeUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (response.ok) {
      // Track conversion
      trackEvent('email_signup', 'conversion', source);

      // Mark this browser as having submitted
      // so we do not show the form again
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'tilawah_email_captured', 
          'true'
        );
      }

      return {
        success: true,
        message: 'JazakAllah Khair! You are on the list.',
      };
    } else {
      const errorData = await response.json().catch(() => null);
      console.error('Formspree error:', errorData);
      return {
        success: false,
        message: 'Something went wrong. Please try again.',
      };
    }
  } catch (err) {
    console.error('Email submission network error:', err);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
}

// Check if user already submitted email
export function hasSubmittedEmail(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('tilawah_email_captured') === 'true';
}
