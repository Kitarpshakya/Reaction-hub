/**
 * Authentication error types and messages
 */

export type AuthErrorType =
  | 'unauthorized'
  | 'personal_account'
  | 'domain_not_authorized'
  | 'configuration'
  | 'access_denied'
  | 'verification'
  | 'callback'
  | 'session_required'
  | 'provider_error'
  | 'network_error'
  | 'default';

export interface AuthErrorDetails {
  title: string;
  message: string;
  suggestion?: string;
  severity: 'error' | 'warning' | 'info';
  icon: 'error' | 'warning' | 'info' | 'lock';
}

/**
 * Get error details for a given error type
 */
export function getAuthErrorDetails(
  errorType: string,
  customMessage?: string
): AuthErrorDetails {
  const errorMap: Record<string, AuthErrorDetails> = {
    // Microsoft SSO - Personal Account
    personal_account: {
      title: 'Personal Account Not Allowed',
      message:
        customMessage ||
        'Personal Microsoft accounts (@outlook.com, @hotmail.com, etc.) are not permitted. Please use your school or work email address.',
      suggestion:
        'If you have a school or work email, try signing in with that instead. Otherwise, use Google Sign-In.',
      severity: 'error',
      icon: 'lock',
    },

    // Microsoft SSO - Domain Not Authorized
    domain_not_authorized: {
      title: 'Email Domain Not Authorized',
      message:
        customMessage ||
        'Your email domain is not authorized to access this application.',
      suggestion:
        'Please contact your administrator to request access, or try signing in with a different email address.',
      severity: 'error',
      icon: 'lock',
    },

    // Generic Unauthorized
    unauthorized: {
      title: 'Access Denied',
      message:
        customMessage ||
        'You are not authorized to access this application with the provided credentials.',
      suggestion:
        'Please ensure you are using an authorized account. If you believe this is an error, contact your administrator.',
      severity: 'error',
      icon: 'lock',
    },

    // OAuth Configuration Error
    configuration: {
      title: 'Configuration Error',
      message:
        customMessage ||
        'There is a problem with the authentication server configuration.',
      suggestion:
        'Please try again later. If the problem persists, contact support.',
      severity: 'error',
      icon: 'error',
    },

    // Access Denied (OAuth)
    access_denied: {
      title: 'Sign-In Cancelled',
      message:
        customMessage ||
        'You cancelled the sign-in process or denied access to your account information.',
      suggestion:
        'To sign in, please click the sign-in button again and allow access when prompted.',
      severity: 'warning',
      icon: 'warning',
    },

    // Verification Error
    verification: {
      title: 'Verification Failed',
      message:
        customMessage ||
        'The verification link is invalid, expired, or has already been used.',
      suggestion:
        'Please try signing in again to receive a new verification link.',
      severity: 'error',
      icon: 'error',
    },

    // Callback Error
    callback: {
      title: 'Authentication Callback Error',
      message:
        customMessage ||
        'An error occurred while processing your sign-in request.',
      suggestion:
        'Please try signing in again. If the problem continues, try clearing your browser cache.',
      severity: 'error',
      icon: 'error',
    },

    // Session Required
    session_required: {
      title: 'Session Expired',
      message:
        customMessage || 'Your session has expired. Please sign in again.',
      suggestion: 'Click the sign-in button below to authenticate.',
      severity: 'info',
      icon: 'info',
    },

    // Provider Error (Google/Microsoft)
    provider_error: {
      title: 'Authentication Provider Error',
      message:
        customMessage ||
        'The authentication provider encountered an error. This may be a temporary issue.',
      suggestion:
        'Please wait a moment and try again. If the problem persists, try a different sign-in method.',
      severity: 'error',
      icon: 'error',
    },

    // Network Error
    network_error: {
      title: 'Network Connection Error',
      message:
        customMessage ||
        'Unable to connect to the authentication server. Please check your internet connection.',
      suggestion: 'Verify your connection and try again.',
      severity: 'warning',
      icon: 'warning',
    },

    // Default/Unknown Error
    default: {
      title: 'Authentication Error',
      message:
        customMessage ||
        'An unexpected error occurred during authentication. Please try again.',
      suggestion:
        'If the problem continues, try clearing your browser cache or using a different browser.',
      severity: 'error',
      icon: 'error',
    },
  };

  // Check if error type exists, otherwise use default
  const normalizedType = errorType.toLowerCase();
  return (
    errorMap[normalizedType] ||
    errorMap.default
  );
}

/**
 * Detect error type from custom message or error code
 */
export function detectErrorType(
  errorCode?: string,
  message?: string
): AuthErrorType {
  if (!errorCode && !message) return 'default';

  const lowercaseMessage = message?.toLowerCase() || '';
  const lowercaseCode = errorCode?.toLowerCase() || '';

  // Check message content for specific patterns
  if (
    lowercaseMessage.includes('personal') &&
    lowercaseMessage.includes('microsoft')
  ) {
    return 'personal_account';
  }

  if (
    lowercaseMessage.includes('domain') &&
    lowercaseMessage.includes('authorized')
  ) {
    return 'domain_not_authorized';
  }

  if (lowercaseMessage.includes('outlook.com') || lowercaseMessage.includes('hotmail.com')) {
    return 'personal_account';
  }

  // Check error codes
  switch (lowercaseCode) {
    case 'unauthorized':
      return 'unauthorized';
    case 'accessdenied':
    case 'access_denied':
      return 'access_denied';
    case 'configuration':
      return 'configuration';
    case 'verification':
      return 'verification';
    case 'callback':
      return 'callback';
    case 'sessionrequired':
    case 'session_required':
      return 'session_required';
    case 'oauthsignin':
    case 'oauthcallback':
    case 'oauthcreateaccount':
    case 'emailcreateaccount':
    case 'emailsignin':
      return 'provider_error';
    default:
      return 'default';
  }
}

/**
 * Format error for display
 */
export function formatAuthError(
  errorCode?: string,
  customMessage?: string
): AuthErrorDetails {
  const errorType = detectErrorType(errorCode, customMessage);
  return getAuthErrorDetails(errorType, customMessage);
}
