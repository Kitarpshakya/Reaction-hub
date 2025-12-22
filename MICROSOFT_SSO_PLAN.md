# Microsoft SSO Implementation Plan

## Overview

Add Microsoft Single Sign-On (SSO) authentication with restrictions to allow only registered school/work email accounts to access the application.

**Goal:** Enable users to login using their Microsoft organizational accounts (school/work emails) while blocking personal Microsoft accounts (e.g., @outlook.com, @hotmail.com).

## Requirements

### Functional Requirements

1. **Microsoft SSO Integration**
   - Users can click "Sign in with Microsoft" button
   - Redirects to Microsoft login page
   - Authenticates via Microsoft Azure AD / Entra ID
   - Returns user profile information

2. **Email Domain Restrictions**
   - Only allow organizational/work/school email domains
   - Block personal Microsoft accounts (@outlook.com, @hotmail.com, @live.com, etc.)
   - Configurable whitelist of allowed domains (optional)
   - Clear error messages for unauthorized domains

3. **User Experience**
   - Dual login options: Google SSO + Microsoft SSO
   - Consistent login flow for both providers
   - Account linking (if user exists with same email from different provider)
   - Graceful error handling for rejected logins

### Non-Functional Requirements

1. **Security**
   - Secure OAuth 2.0 flow
   - Validate tenant ID for organizational accounts
   - Session management consistent with existing auth
   - CSRF protection (handled by NextAuth)

2. **Performance**
   - No degradation to existing Google SSO
   - Fast authentication flow

3. **Maintainability**
   - Clean separation of provider logic
   - Reusable email validation utilities
   - Well-documented configuration

## Technical Architecture

### Technology Stack

- **NextAuth.js** - Already in use, supports Microsoft provider
- **Microsoft Azure AD / Entra ID** - Identity provider
- **AzureADProvider** from `next-auth/providers/azure-ad`
- MongoDB - Existing user storage

### Authentication Flow

```
User clicks "Sign in with Microsoft"
    ↓
NextAuth redirects to Microsoft login
    ↓
User authenticates with Microsoft
    ↓
Microsoft returns authorization code
    ↓
NextAuth exchanges code for tokens
    ↓
NextAuth retrieves user profile
    ↓
Custom signIn callback validates email domain
    ↓
If valid organizational email:
    - Check if user exists in database
    - Create new user OR link to existing user
    - Create session
    - Redirect to app
    ↓
If personal Microsoft account:
    - Reject login
    - Show error message
    - Redirect to login page
```

## Implementation Plan

### Phase 1: Azure AD Setup

**Duration:** 1-2 hours

**Steps:**

1. **Create Azure AD Application**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to Azure Active Directory (Entra ID)
   - Go to "App registrations" → "New registration"
   - Name: "Reaction Hub"
   - Supported account types: "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
     - ⚠️ **CRITICAL:** Select "Multitenant" to support multiple school/work organizations
     - Do NOT select "Personal Microsoft accounts"
   - Redirect URI: Web → `http://localhost:3000/api/auth/callback/azure-ad`
   - Click "Register"

2. **Configure Application Settings**
   - Note down "Application (client) ID"
   - Note down "Directory (tenant) ID"
   - Go to "Certificates & secrets"
   - Create new client secret
   - Note down the secret value immediately (only shown once)

3. **Configure API Permissions**
   - Go to "API permissions"
   - Add permissions:
     - Microsoft Graph → Delegated permissions
     - `openid` (required for OpenID Connect)
     - `profile` (basic profile info)
     - `email` (email address)
     - `User.Read` (read user profile)
   - Click "Grant admin consent" (if you have admin rights)

4. **Production Setup**
   - Add production redirect URI: `https://yourdomain.com/api/auth/callback/azure-ad`
   - Configure branding (optional): logo, terms of service, privacy statement

**Outputs:**
- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET`
- `AZURE_AD_TENANT_ID`

---

### Phase 2: Environment Configuration

**Duration:** 15 minutes

**Steps:**

1. **Update `.env.local`**

Add the following variables:

```env
# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=your_application_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=common  # Use "common" for multitenant, or specific tenant ID

# Email Domain Restrictions (optional whitelist)
ALLOWED_EMAIL_DOMAINS=example.edu,university.edu,company.com
# Leave empty to allow all organizational accounts

# Personal Microsoft Account Domains (blocklist)
BLOCKED_EMAIL_DOMAINS=outlook.com,hotmail.com,live.com,msn.com
```

2. **Update `.env.example`** (for team documentation)

```env
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=common
ALLOWED_EMAIL_DOMAINS=
BLOCKED_EMAIL_DOMAINS=outlook.com,hotmail.com,live.com,msn.com
```

---

### Phase 3: Database Schema Updates

**Duration:** 30 minutes

**Changes Needed:**

The existing `User` model already supports multiple providers, but we should verify it handles:

**Current User Model (no changes needed):**
```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  provider: string;           // Will be "azure-ad" for Microsoft
  providerId: string;         // Microsoft user ID
  createdAt: Date;
  updatedAt: Date;
}
```

**Considerations:**

1. **Account Linking**
   - If user with email `john@school.edu` exists from Google provider
   - User tries to login with same email from Microsoft provider
   - Should we:
     - A) Allow separate accounts (current behavior)
     - B) Link accounts to same user (recommended)

   **Recommendation:** Implement account linking by email

2. **Migration Strategy**
   - No migration needed for existing users
   - Microsoft users will be created on first login
   - If implementing account linking, add logic to NextAuth callbacks

---

### Phase 4: NextAuth Configuration

**Duration:** 2-3 hours

**File:** `app/api/auth/[...nextauth]/route.ts`

**Changes:**

1. **Add AzureADProvider**

```typescript
import AzureADProvider from "next-auth/providers/azure-ad";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // NEW: Microsoft Azure AD Provider
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
      authorization: {
        params: {
          scope: "openid profile email User.Read",
          // Restrict to organizational accounts only
          prompt: "select_account",
        },
      },
    }),
  ],
  // ... rest of config
};
```

2. **Add Email Validation Utility**

**File:** `lib/utils/email-validation.ts` (new file)

```typescript
/**
 * Validates if email is from an organizational account
 * @param email - Email address to validate
 * @returns true if valid organizational email, false otherwise
 */
export function isOrganizationalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) return false;

  // Blocklist: Personal Microsoft account domains
  const blockedDomains = process.env.BLOCKED_EMAIL_DOMAINS?.split(',') || [
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
  ];

  if (blockedDomains.includes(domain)) {
    return false;
  }

  // Whitelist: If configured, only allow specific domains
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',').map(d => d.trim());

  if (allowedDomains && allowedDomains.length > 0) {
    return allowedDomains.includes(domain);
  }

  // If no whitelist configured, allow all organizational emails
  // (already blocked personal accounts above)
  return true;
}

/**
 * Get user-friendly error message for rejected email
 */
export function getEmailRejectionMessage(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase();

  const blockedDomains = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'];

  if (blockedDomains.includes(domain)) {
    return 'Personal Microsoft accounts are not allowed. Please use your school or work email.';
  }

  return 'This email domain is not authorized. Please contact your administrator.';
}
```

3. **Update NextAuth Callbacks**

Add validation to the `signIn` callback:

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // Only validate Microsoft SSO logins
    if (account?.provider === "azure-ad") {
      const email = user.email;

      if (!email) {
        console.error("Microsoft SSO: No email provided");
        return false;
      }

      // Validate organizational email
      if (!isOrganizationalEmail(email)) {
        console.warn(`Microsoft SSO: Rejected personal account - ${email}`);
        // NextAuth will redirect to error page
        return `/login?error=unauthorized&message=${encodeURIComponent(
          getEmailRejectionMessage(email)
        )}`;
      }

      console.log(`Microsoft SSO: Approved organizational account - ${email}`);
    }

    // Allow all Google logins (existing behavior)
    return true;
  },

  async jwt({ token, account, profile }) {
    // Store provider info in token
    if (account) {
      token.provider = account.provider;
      token.providerId = account.providerAccountId;
    }
    return token;
  },

  async session({ session, token }) {
    // Add provider info to session
    if (session.user) {
      session.user.provider = token.provider;
      session.user.providerId = token.providerId;
    }
    return session;
  },
},
```

---

### Phase 5: UI Components

**Duration:** 1-2 hours

**File:** `components/auth/LoginButton.tsx`

**Changes:**

1. **Update LoginButton Component**

```typescript
import { signIn } from 'next-auth/react';

export function LoginButton() {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        {/* Google Icon */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          {/* Google SVG path */}
        </svg>
        <span className="text-gray-700 font-medium">
          Sign in with Google
        </span>
      </button>

      {/* NEW: Microsoft Login Button */}
      <button
        onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
        className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        {/* Microsoft Icon */}
        <svg className="w-5 h-5" viewBox="0 0 23 23">
          <path fill="#f25022" d="M0 0h11v11H0z" />
          <path fill="#00a4ef" d="M12 0h11v11H12z" />
          <path fill="#7fba00" d="M0 12h11v11H0z" />
          <path fill="#ffb900" d="M12 12h11v11H12z" />
        </svg>
        <span className="text-gray-700 font-medium">
          Sign in with Microsoft
        </span>
      </button>

      <p className="text-sm text-gray-500 text-center mt-2">
        Use your school or work email to sign in
      </p>
    </div>
  );
}
```

2. **Create Error Display Component**

**File:** `components/auth/AuthError.tsx` (new file)

```typescript
'use client';

import { useSearchParams } from 'next/navigation';

export function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  if (!error) return null;

  const errorMessages: Record<string, string> = {
    unauthorized: message || 'You are not authorized to access this application.',
    configuration: 'There is a problem with the server configuration.',
    accessdenied: 'Access denied. Please contact your administrator.',
    verification: 'The verification link is invalid or has expired.',
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-600 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h3 className="text-sm font-medium text-red-800">
            Authentication Error
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {errorMessages[error] || 'An unexpected error occurred.'}
          </p>
        </div>
      </div>
    </div>
  );
}
```

3. **Update Login Page**

**File:** `app/login/page.tsx`

```typescript
import { AuthError } from '@/components/auth/AuthError';
import { LoginButton } from '@/components/auth/LoginButton';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          Sign in to Reaction Hub
        </h1>

        {/* Error display */}
        <AuthError />

        {/* Login buttons */}
        <LoginButton />
      </div>
    </div>
  );
}
```

---

### Phase 6: Testing Strategy

**Duration:** 2-3 hours

**Test Cases:**

1. **Organizational Email Login (Happy Path)**
   - User with school email (e.g., `student@university.edu`)
   - Should successfully authenticate
   - Should create user in database
   - Should redirect to home page

2. **Personal Microsoft Account (Rejection)**
   - User with personal email (e.g., `user@outlook.com`)
   - Should be rejected during authentication
   - Should show error message
   - Should remain on login page

3. **Account Linking (if implemented)**
   - User exists with Google provider (`john@school.edu`)
   - Same user tries to login with Microsoft
   - Should link accounts OR show appropriate message

4. **Whitelist Validation (if configured)**
   - User with non-whitelisted organizational email
   - Should be rejected
   - Should show error message

5. **Session Management**
   - User logs in with Microsoft
   - Session should persist across page refreshes
   - Logout should work correctly

6. **Error Handling**
   - Invalid credentials
   - Network errors
   - Microsoft service downtime

**Testing Tools:**
- Manual testing with real Microsoft accounts
- Automated tests with Jest (mock NextAuth responses)
- Test both localhost and production environments

---

### Phase 7: Documentation Updates

**Duration:** 1 hour

**Files to Update:**

1. **AUTH.md**
   - Add Microsoft SSO setup instructions
   - Document email domain restrictions
   - Add troubleshooting guide

2. **README.md** (if exists)
   - Update setup instructions
   - List new environment variables

3. **CLAUDE.md**
   - Update authentication feature description

**Example Addition to AUTH.md:**

```markdown
## Microsoft SSO Setup

### Azure AD Configuration

1. Create Azure AD application (see MICROSOFT_SSO_PLAN.md for detailed steps)
2. Configure environment variables:
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_CLIENT_SECRET`
   - `AZURE_AD_TENANT_ID`

### Email Domain Restrictions

**Blocking Personal Accounts:**
Personal Microsoft accounts (@outlook.com, @hotmail.com, etc.) are automatically blocked.

**Whitelist Configuration (Optional):**
To restrict to specific organizational domains, set:

```env
ALLOWED_EMAIL_DOMAINS=university.edu,company.com
```

If not set, all organizational accounts are allowed (personal accounts still blocked).

### Troubleshooting

**Error: "Personal Microsoft accounts are not allowed"**
- User is trying to login with @outlook.com, @hotmail.com, etc.
- Solution: Use school or work email

**Error: "This email domain is not authorized"**
- Email domain is not in the whitelist
- Solution: Contact administrator to add domain to whitelist
```

---

### Phase 8: Security Considerations

**Duration:** Review and implement

**Security Checklist:**

1. **Environment Variables**
   - Never commit secrets to version control
   - Use `.env.local` for local development
   - Use secure environment variable storage in production (Vercel, AWS, etc.)

2. **Token Validation**
   - NextAuth automatically validates tokens
   - Ensure `NEXTAUTH_SECRET` is strong and unique

3. **CSRF Protection**
   - NextAuth provides CSRF protection by default
   - Ensure CSRF tokens are validated

4. **Session Security**
   - Sessions expire after inactivity (configurable in NextAuth)
   - Secure cookies (httpOnly, sameSite, secure in production)

5. **Rate Limiting** (Future Enhancement)
   - Implement rate limiting on auth endpoints
   - Prevent brute force attacks

6. **Audit Logging** (Future Enhancement)
   - Log successful/failed authentication attempts
   - Monitor for suspicious activity

---

### Phase 9: Deployment

**Duration:** 1-2 hours

**Steps:**

1. **Update Production Environment Variables**
   - Add `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
   - Add `ALLOWED_EMAIL_DOMAINS` (if using whitelist)

2. **Update Azure AD Redirect URIs**
   - Add production URL: `https://yourdomain.com/api/auth/callback/azure-ad`

3. **Test Production Deployment**
   - Test Microsoft SSO in production
   - Verify email restrictions work
   - Test error handling

4. **Monitor Logs**
   - Watch for authentication errors
   - Monitor successful logins

---

## Configuration Options

### Option 1: Allow All Organizational Accounts (Recommended)

**Setup:**
- Set `AZURE_AD_TENANT_ID=common`
- Leave `ALLOWED_EMAIL_DOMAINS` empty
- Set `BLOCKED_EMAIL_DOMAINS` to block personal accounts

**Behavior:**
- ✅ Any school/work email can login
- ❌ Personal Microsoft accounts blocked

### Option 2: Whitelist Specific Domains

**Setup:**
- Set `AZURE_AD_TENANT_ID=common`
- Set `ALLOWED_EMAIL_DOMAINS=university.edu,company.com`
- Set `BLOCKED_EMAIL_DOMAINS` to block personal accounts

**Behavior:**
- ✅ Only whitelisted organizational emails can login
- ❌ Other organizational emails blocked
- ❌ Personal Microsoft accounts blocked

### Option 3: Single Organization Only

**Setup:**
- Set `AZURE_AD_TENANT_ID=your-specific-tenant-id`
- Leave `ALLOWED_EMAIL_DOMAINS` empty

**Behavior:**
- ✅ Only users from your specific Azure AD tenant can login
- ❌ All other accounts blocked (including other organizations)

**Recommendation:** Use Option 1 for maximum flexibility, unless you have strict security requirements.

---

## Migration Strategy

### Existing Users

**Scenario:** Existing users have Google accounts

**Strategy:**
1. No migration needed
2. Users can continue using Google SSO
3. If same email exists on Microsoft, implement account linking (optional)

### Account Linking Logic

**File:** `lib/utils/account-linking.ts` (new file)

```typescript
/**
 * Links Microsoft account to existing user if email matches
 */
export async function linkAccountIfExists(
  email: string,
  provider: string,
  providerId: string
) {
  // Find existing user by email
  const existingUser = await User.findOne({ email });

  if (existingUser && existingUser.provider !== provider) {
    // User exists with different provider
    console.log(`Linking ${provider} account to existing user: ${email}`);

    // Strategy A: Update provider to most recent
    await User.updateOne(
      { email },
      {
        provider,
        providerId,
        updatedAt: new Date()
      }
    );

    // OR Strategy B: Store multiple providers (requires schema change)
    // await User.updateOne(
    //   { email },
    //   {
    //     $addToSet: {
    //       providers: { provider, providerId }
    //     }
    //   }
    // );
  }

  return existingUser;
}
```

---

## Rollback Plan

If issues arise after deployment:

1. **Quick Rollback:**
   - Remove `AzureADProvider` from NextAuth config
   - Remove Microsoft login button from UI
   - Deploy previous version

2. **Data Cleanup:**
   - Identify users created via Microsoft SSO
   - Decide whether to keep or remove them

3. **Communication:**
   - Notify users if Microsoft SSO is temporarily unavailable
   - Provide alternative (Google SSO)

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Azure AD Setup | 1-2 hours | Azure account access |
| Environment Config | 15 mins | Azure credentials |
| Database Schema | 30 mins | None |
| NextAuth Config | 2-3 hours | Environment config |
| UI Components | 1-2 hours | NextAuth config |
| Testing | 2-3 hours | All above complete |
| Documentation | 1 hour | Implementation complete |
| Security Review | 1 hour | Implementation complete |
| Deployment | 1-2 hours | All testing complete |

**Total Estimated Time:** 10-15 hours

---

## Success Metrics

Post-deployment, track:

1. **Authentication Success Rate**
   - % of successful Microsoft SSO logins
   - % of rejected personal accounts

2. **User Adoption**
   - Number of users using Microsoft SSO vs Google SSO
   - New user registrations via Microsoft

3. **Error Rate**
   - Authentication errors
   - Configuration errors

4. **Performance**
   - Authentication latency
   - Session creation time

---

## Future Enhancements

1. **Multi-Provider Account Linking**
   - Allow users to link both Google and Microsoft accounts
   - Single user profile with multiple login methods

2. **Admin Dashboard**
   - Manage allowed email domains via UI
   - View authentication logs
   - User management

3. **Advanced Email Validation**
   - Verify email ownership (send verification email)
   - Check against external email validation API

4. **Role-Based Access Control (RBAC)**
   - Assign roles based on email domain
   - Different permissions for different organizations

5. **Single Logout (SLO)**
   - Logout from Microsoft when logging out from app
   - Revoke tokens on logout

---

## References

- [NextAuth.js Azure AD Provider](https://next-auth.js.org/providers/azure-ad)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [OAuth 2.0 Authorization Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

---

*Last Updated: Dec 22, 2025 - Initial plan for Microsoft SSO implementation*
