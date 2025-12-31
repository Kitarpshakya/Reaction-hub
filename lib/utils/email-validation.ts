/**
 * Email validation utilities for Microsoft SSO
 * Validates organizational vs personal Microsoft accounts
 */

/**
 * Validates if email is from an organizational account
 * @param email - Email address to validate
 * @returns true if valid organizational email, false otherwise
 */
export function isOrganizationalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) {
    console.log('[Email Validation] No domain found in email');
    return false;
  }

  // Blocklist: Personal Microsoft account domains
  const blockedDomainsEnv = process.env.BLOCKED_EMAIL_DOMAINS || '';
  const blockedDomains = blockedDomainsEnv
    ? blockedDomainsEnv.split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
    : [
        'outlook.com',
        'hotmail.com',
        'live.com',
        'msn.com',
        'passport.com',
      ];

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Email Validation] Checking email: ${email}`);
    console.log(`[Email Validation] Domain: ${domain}`);
    console.log(`[Email Validation] Blocked domains:`, blockedDomains);
  }

  if (blockedDomains.includes(domain)) {
    console.log(`[Email Validation] ❌ Domain "${domain}" is in blocklist`);
    return false;
  }

  // Whitelist: If configured, only allow specific domains
  const allowedDomainsEnv = process.env.ALLOWED_EMAIL_DOMAINS || '';
  const allowedDomains = allowedDomainsEnv
    ? allowedDomainsEnv.split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
    : [];

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Email Validation] Whitelist env var: "${allowedDomainsEnv}"`);
    console.log(`[Email Validation] Whitelist configured:`, allowedDomains.length > 0);
    console.log(`[Email Validation] Allowed domains:`, allowedDomains);
  }

  if (allowedDomains.length > 0) {
    const isAllowed = allowedDomains.includes(domain);
    console.log(`[Email Validation] ${isAllowed ? '✅' : '❌'} Domain "${domain}" ${isAllowed ? 'IS' : 'IS NOT'} in whitelist`);
    return isAllowed;
  }

  // If no whitelist configured, allow all organizational emails
  // (already blocked personal accounts above)
  console.log(`[Email Validation] ✅ No whitelist configured, allowing organizational domain: ${domain}`);
  return true;
}

/**
 * Get user-friendly error message for rejected email
 * @param email - Rejected email address
 * @returns Error message string
 */
export function getEmailRejectionMessage(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase();

  const blockedDomainsEnv = process.env.BLOCKED_EMAIL_DOMAINS || '';
  const blockedDomains = blockedDomainsEnv
    ? blockedDomainsEnv.split(',').map(d => d.trim().toLowerCase())
    : [
        'outlook.com',
        'hotmail.com',
        'live.com',
        'msn.com',
        'passport.com',
      ];

  if (domain && blockedDomains.includes(domain)) {
    return 'Personal Microsoft accounts are not allowed. Please use your school or work email.';
  }

  return 'This email domain is not authorized. Please contact your administrator.';
}

/**
 * Get email domain from email address
 * @param email - Email address
 * @returns Domain string or null
 */
export function getEmailDomain(email: string): string | null {
  return email.split('@')[1]?.toLowerCase() || null;
}

/**
 * Check if email is a personal Microsoft account
 * @param email - Email address to check
 * @returns true if personal account, false otherwise
 */
export function isPersonalMicrosoftAccount(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;

  const personalDomains = [
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'passport.com',
  ];

  return personalDomains.includes(domain);
}
