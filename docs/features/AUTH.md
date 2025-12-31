# Authentication Documentation

## User Model

```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  provider: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Authentication Providers

The application supports two OAuth providers:
- **Google OAuth** - For all users
- **Microsoft Azure AD** - For organizational (school/work) accounts only

---

## Google OAuth Setup

### 1. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (if not already done)
6. Application type: **Web application**
7. Add Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add to `.env.local`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_OAUTH_CONFIGURED=true
```

---

## Microsoft Azure AD Setup

### 1. Create Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)
3. Go to **App registrations** → **New registration**
4. Configure application:
   - **Name:** Reaction Hub
   - **Supported account types:**
     - Select **"Accounts in any organizational directory (Any Azure AD directory - Multitenant)"**
     - ⚠️ **IMPORTANT:** Do NOT select "Personal Microsoft accounts"
   - **Redirect URI:**
     - Platform: **Web**
     - URI: `http://localhost:3000/api/auth/callback/azure-ad`
5. Click **Register**

### 2. Configure Application Secrets

1. After registration, note the **Application (client) ID**
2. Note the **Directory (tenant) ID**
3. Go to **Certificates & secrets**
4. Click **New client secret**
5. Add description (e.g., "Reaction Hub Production")
6. Set expiration (recommended: 24 months)
7. Click **Add**
8. **Copy the secret value immediately** (it won't be shown again)

### 3. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add the following permissions:
   - `openid` - Required for OpenID Connect
   - `profile` - Basic profile information
   - `email` - Email address
   - `User.Read` - Read user profile
6. Click **Add permissions**
7. (Optional) Click **Grant admin consent** if you have admin privileges

### 4. Add Production Redirect URI

1. Go to **Authentication** (in your app registration)
2. Under **Platform configurations** → **Web**
3. Add redirect URIs:
   - Production: `https://yourdomain.com/api/auth/callback/azure-ad`
4. Click **Save**

### 5. Configure Environment Variables

Add to `.env.local`:

```env
# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=your_application_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=common
NEXT_PUBLIC_MICROSOFT_OAUTH_CONFIGURED=true

# Email Domain Restrictions
ALLOWED_EMAIL_DOMAINS=
BLOCKED_EMAIL_DOMAINS=outlook.com,hotmail.com,live.com,msn.com,passport.com
```

### 6. Tenant Configuration

**For Multi-Organization Support (Recommended):**
```env
AZURE_AD_TENANT_ID=common
```
- Allows users from any organization to login
- Personal Microsoft accounts are blocked by email validation

**For Single Organization Only:**
```env
AZURE_AD_TENANT_ID=your_specific_tenant_id
```
- Only users from your specific Azure AD tenant can login
- Replace `your_specific_tenant_id` with your Directory (tenant) ID

---

## Email Domain Restrictions (Microsoft SSO)

Microsoft SSO includes email validation to ensure only organizational accounts can access the application.

### Default Behavior

**Blocked by default:**
- Personal Microsoft accounts:
  - `@outlook.com`
  - `@hotmail.com`
  - `@live.com`
  - `@msn.com`
  - `@passport.com`

**Allowed by default:**
- All organizational/school/work email domains
- Example: `student@university.edu`, `employee@company.com`

### Whitelist Specific Domains (Optional)

To restrict access to specific organizational domains only:

```env
ALLOWED_EMAIL_DOMAINS=university.edu,mycompany.com,school.org
```

When whitelist is configured:
- ✅ Only emails from whitelisted domains can login
- ❌ All other emails are rejected (including other organizational accounts)

### Custom Blocklist

To block additional domains:

```env
BLOCKED_EMAIL_DOMAINS=outlook.com,hotmail.com,live.com,msn.com,passport.com,spam-domain.com
```

### Error Messages

**Personal account rejected:**
> "Personal Microsoft accounts are not allowed. Please use your school or work email."

**Domain not whitelisted:**
> "This email domain is not authorized. Please contact your administrator."

---

## General Environment Variables

Required for all authentication:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string
```

**Generate NEXTAUTH_SECRET:**
```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## NextAuth Configuration

**Location:** `app/api/auth/[...nextauth]/route.ts`

**Configuration includes:**
- **MongoDBAdapter** for session storage
- **GoogleProvider** for Google OAuth
- **AzureADProvider** for Microsoft OAuth
- **signIn callback** for email validation (Microsoft only)
- **Session callbacks** for user data

### Key Features

**Email Validation (Microsoft SSO):**
- Automatically validates organizational vs personal accounts
- Rejects personal Microsoft accounts with clear error message
- Supports whitelist/blocklist configuration
- Logs validation results for debugging

**Account Flexibility:**
- Users can login with either Google or Microsoft
- Same email from different providers creates separate user entries
- Session management is consistent across providers

## Protected Routes

**Routes requiring authentication:**
- `/compounds/create` - Create compound page
- `/organic-chemistry/create` - Create organic structure page

**Public routes:**
- `/` - Landing page
- `/periodic-table` - Periodic table grid
- `/elements/[symbol]` - Element detail pages
- `/compounds` - Compounds library
- `/organic-chemistry` - Organic structures library
- `/organic-chemistry/[id]` - Structure detail pages

## Components

**Auth Components:**
- `LoginButton` - Login/logout button
- `UserMenu` - User profile menu
- `AuthGuard` - Route protection wrapper

## Session Management

Use `useSession()` hook for client-side session state:

```typescript
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
```

## API Route Protection

Protect API routes by checking session:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Protected logic here
}
```

---

## Error Messages

The authentication system provides detailed error messages for different failure scenarios. Each error includes:
- **Title**: Clear identification of the error type
- **Message**: Detailed explanation of what went wrong
- **Suggestion**: Actionable steps to resolve the issue
- **Visual indicators**: Color-coded severity (error, warning, info)

### Error Types

#### 1. Personal Account Not Allowed
**Error Code:** `personal_account`
**Severity:** Error (Red)
**Icon:** Lock

**When it occurs:**
- User attempts to login with personal Microsoft account (@outlook.com, @hotmail.com, @live.com, @msn.com, @passport.com)

**Message:**
> Personal Microsoft accounts (@outlook.com, @hotmail.com, etc.) are not permitted. Please use your school or work email address.

**Suggestion:**
> If you have a school or work email, try signing in with that instead. Otherwise, use Google Sign-In.

**Resolution:**
- Use organizational email address (e.g., student@university.edu)
- Or use Google Sign-In instead

---

#### 2. Email Domain Not Authorized
**Error Code:** `domain_not_authorized`
**Severity:** Error (Red)
**Icon:** Lock

**When it occurs:**
- User's email domain is not in the whitelist (when `ALLOWED_EMAIL_DOMAINS` is configured)
- User's email domain is in the blocklist

**Message:**
> Your email domain is not authorized to access this application.

**Suggestion:**
> Please contact your administrator to request access, or try signing in with a different email address.

**Resolution:**
- Admin: Add domain to `ALLOWED_EMAIL_DOMAINS` in `.env.local`
- User: Contact administrator or use different email

---

#### 3. Access Denied (Sign-In Cancelled)
**Error Code:** `access_denied`
**Severity:** Warning (Yellow)
**Icon:** Warning Triangle

**When it occurs:**
- User cancels OAuth login flow
- User denies permission for the app to access their profile

**Message:**
> You cancelled the sign-in process or denied access to your account information.

**Suggestion:**
> To sign in, please click the sign-in button again and allow access when prompted.

**Resolution:**
- Try signing in again and click "Allow" when prompted

---

#### 4. Configuration Error
**Error Code:** `configuration`
**Severity:** Error (Red)
**Icon:** Error Circle

**When it occurs:**
- OAuth credentials are missing or invalid
- Azure AD/Google OAuth not properly configured

**Message:**
> There is a problem with the authentication server configuration.

**Suggestion:**
> Please try again later. If the problem persists, contact support.

**Resolution:**
- Admin: Verify environment variables are set correctly
- Admin: Check Azure Portal / Google Console configuration
- User: Wait and try again, or contact support

---

#### 5. Authentication Provider Error
**Error Code:** `provider_error`
**Severity:** Error (Red)
**Icon:** Error Circle

**When it occurs:**
- Microsoft/Google authentication service is down
- OAuth callback fails
- Email not provided by provider

**Message:**
> The authentication provider encountered an error. This may be a temporary issue.

**Suggestion:**
> Please wait a moment and try again. If the problem persists, try a different sign-in method.

**Resolution:**
- Wait a few minutes and try again
- Try alternative sign-in method (Google vs Microsoft)
- Check provider status pages

---

#### 6. Verification Failed
**Error Code:** `verification`
**Severity:** Error (Red)
**Icon:** Error Circle

**When it occurs:**
- Email verification link is expired
- Verification link already used
- Invalid verification token

**Message:**
> The verification link is invalid, expired, or has already been used.

**Suggestion:**
> Please try signing in again to receive a new verification link.

**Resolution:**
- Request new verification email
- Try signing in again

---

#### 7. Session Expired
**Error Code:** `session_required`
**Severity:** Info (Blue)
**Icon:** Info Circle

**When it occurs:**
- User session has expired
- User tries to access protected route without active session

**Message:**
> Your session has expired. Please sign in again.

**Suggestion:**
> Click the sign-in button below to authenticate.

**Resolution:**
- Sign in again to create new session

---

#### 8. Network Connection Error
**Error Code:** `network_error`
**Severity:** Warning (Yellow)
**Icon:** Warning Triangle

**When it occurs:**
- No internet connection
- Cannot reach authentication server
- Firewall blocking requests

**Message:**
> Unable to connect to the authentication server. Please check your internet connection.

**Suggestion:**
> Verify your connection and try again.

**Resolution:**
- Check internet connection
- Disable VPN/proxy if causing issues
- Check firewall settings

---

#### 9. Callback Error
**Error Code:** `callback`
**Severity:** Error (Red)
**Icon:** Error Circle

**When it occurs:**
- OAuth callback URL mismatch
- State parameter validation fails
- CSRF token issues

**Message:**
> An error occurred while processing your sign-in request.

**Suggestion:**
> Please try signing in again. If the problem continues, try clearing your browser cache.

**Resolution:**
- Try signing in again
- Clear browser cache and cookies
- Admin: Verify redirect URIs match in OAuth console

---

#### 10. General Authentication Error
**Error Code:** `default` (or any unrecognized error)
**Severity:** Error (Red)
**Icon:** Error Circle

**When it occurs:**
- Unknown or unexpected error
- Uncaught exception during authentication

**Message:**
> An unexpected error occurred during authentication. Please try again.

**Suggestion:**
> If the problem continues, try clearing your browser cache or using a different browser.

**Resolution:**
- Try again
- Clear browser cache
- Use different browser
- Contact support if persists

---

## Troubleshooting

### ALLOWED_EMAIL_DOMAINS Not Working

**Problem:** Whitelist isn't blocking/allowing the expected domains

**Common Causes & Solutions:**

#### 1. Server Not Restarted
**Solution:**
```bash
# Stop the server (Ctrl+C)
npm run dev
```
Environment variables are only loaded when the server starts!

#### 2. Wrong Environment File
**Check:**
- Are you editing `.env.local`? (This is the correct file)
- NOT `.env` or `.env.development`

**Solution:**
```bash
# Verify file exists
cat .env.local
# or on Windows:
type .env.local
```

#### 3. Syntax Errors in Configuration

**❌ Wrong:**
```env
ALLOWED_EMAIL_DOMAINS = university.edu, company.com  # Spaces around =
ALLOWED_EMAIL_DOMAINS="university.edu,company.com"   # Quotes not needed
ALLOWED_EMAIL_DOMAINS=university.edu, company.com    # Space after comma
```

**✅ Correct:**
```env
ALLOWED_EMAIL_DOMAINS=university.edu,company.com
```

**Rules:**
- No spaces around `=`
- No quotes
- No spaces after commas
- Comma-separated only

#### 4. Testing the Configuration

**Use the test script:**
```bash
# Test specific emails
node scripts/test-email-validation.js student@university.edu
node scripts/test-email-validation.js user@company.com

# Test multiple at once
node scripts/test-email-validation.js user@outlook.com student@university.edu employee@company.com
```

**Expected output:**
```
📋 Email Domain Validation Tester
================================================================================

🔧 Configuration:
   ALLOWED_EMAIL_DOMAINS = "university.edu,company.com"
   BLOCKED_EMAIL_DOMAINS = "(not set - using defaults)"

🧪 Testing Emails
================================================================================

📧 Testing: student@university.edu
📍 Domain: university.edu
🚫 Blocked domains: outlook.com, hotmail.com, live.com, msn.com, passport.com
✅ Whitelist configured: YES
✅ Allowed domains: university.edu, company.com
✅ APPROVED: Domain "university.edu" IS in whitelist

📊 Summary
================================================================================
✅ student@university.edu - ALLOWED
❌ user@company.org - BLOCKED
```

#### 5. Check Logs During Login

**Enable development logging:**

The application automatically logs validation details in development mode.

**Watch console output when testing Microsoft login:**
```
[Email Validation] Checking email: student@university.edu
[Email Validation] Domain: university.edu
[Email Validation] Blocked domains: [ 'outlook.com', 'hotmail.com', ... ]
[Email Validation] Whitelist env var: "university.edu,company.com"
[Email Validation] Whitelist configured: true
[Email Validation] Allowed domains: [ 'university.edu', 'company.com' ]
[Email Validation] ✅ Domain "university.edu" IS in whitelist
```

**If you don't see these logs:**
- Server may not be in development mode
- Check `NODE_ENV=development` in `.env.local`

#### 6. Environment Variable Not Loading

**Check if env vars are loaded:**

Create a test API route `app/api/test-env/route.ts`:
```typescript
export async function GET() {
  return Response.json({
    ALLOWED_EMAIL_DOMAINS: process.env.ALLOWED_EMAIL_DOMAINS || 'NOT SET',
    BLOCKED_EMAIL_DOMAINS: process.env.BLOCKED_EMAIL_DOMAINS || 'NOT SET',
  });
}
```

Visit: `http://localhost:3000/api/test-env`

**If it shows "NOT SET":**
- File `.env.local` doesn't exist or has wrong name
- Syntax error in `.env.local`
- Server needs restart

#### 7. Production vs Development

**Production configuration:**

In production (Vercel, AWS, etc.), set environment variables through the platform:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add `ALLOWED_EMAIL_DOMAINS` with value `university.edu,company.com`
3. Redeploy

**Do NOT commit `.env.local` to git!**

---

### Microsoft SSO Issues

**Error: "Personal Microsoft accounts are not allowed"**
- **Cause:** User is trying to login with a personal Microsoft account (@outlook.com, @hotmail.com, etc.)
- **Solution:** Use a school or work email address instead

**Error: "This email domain is not authorized"**
- **Cause:** User's email domain is not in the whitelist
- **Solution:**
  - Admin: Add domain to `ALLOWED_EMAIL_DOMAINS` in `.env.local`
  - Admin: Restart server
  - User: Contact administrator

**Error: "Configuration error"**
- **Cause:** Azure AD credentials are missing or invalid
- **Solution:**
  - Verify `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` are set
  - Check values match Azure Portal configuration
  - Ensure `NEXT_PUBLIC_MICROSOFT_OAUTH_CONFIGURED=true`

**Microsoft login button not showing:**
- **Cause:** Environment variable not set
- **Solution:** Set `NEXT_PUBLIC_MICROSOFT_OAUTH_CONFIGURED=true` in `.env.local`

**Redirect URI mismatch:**
- **Cause:** Redirect URI in Azure AD doesn't match application URL
- **Solution:**
  - Development: Ensure `http://localhost:3000/api/auth/callback/azure-ad` is added
  - Production: Ensure `https://yourdomain.com/api/auth/callback/azure-ad` is added

### Google SSO Issues

**Google login button not showing:**
- **Cause:** Environment variable not set
- **Solution:** Set `NEXT_PUBLIC_GOOGLE_OAUTH_CONFIGURED=true` in `.env.local`

**Error: "redirect_uri_mismatch"**
- **Cause:** Redirect URI in Google Cloud Console doesn't match
- **Solution:** Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs

### General Issues

**No login options available:**
- **Cause:** Neither Google nor Microsoft is configured
- **Solution:** Configure at least one OAuth provider (see setup sections above)

**Session not persisting:**
- **Cause:** MongoDB connection issue or `NEXTAUTH_SECRET` not set
- **Solution:**
  - Verify `MONGODB_URI` is correct and MongoDB is running
  - Ensure `NEXTAUTH_SECRET` is set

**"Access denied" after successful login:**
- **Cause:** Database or adapter issue
- **Solution:** Check MongoDB connection and logs

---

## Testing

### Testing Google SSO

1. Start development server: `npm run dev`
2. Navigate to `/login`
3. Click "Sign in with Google"
4. Login with any Google account
5. Should redirect to home page with authenticated session

### Testing Microsoft SSO (Organizational Account)

1. Navigate to `/login`
2. Click "Sign in with Microsoft"
3. Login with school/work email (e.g., `student@university.edu`)
4. Should redirect to home page with authenticated session

### Testing Microsoft SSO (Personal Account - Should Fail)

1. Navigate to `/login`
2. Click "Sign in with Microsoft"
3. Login with personal email (e.g., `user@outlook.com`)
4. Should see error message: "Personal Microsoft accounts are not allowed"
5. Should remain on login page

### Testing Email Whitelist

1. Set `ALLOWED_EMAIL_DOMAINS=university.edu` in `.env.local`
2. Restart development server
3. Try logging in with `student@university.edu` - ✅ Should succeed
4. Try logging in with `employee@company.com` - ❌ Should fail with "domain not authorized" error

### Debugging

Enable debug mode in development:

```env
NODE_ENV=development
```

NextAuth will log detailed authentication information to the console, including:
- OAuth callback URLs
- Token exchanges
- Session creation
- Email validation results

---

## Security Best Practices

### Production Checklist

- [ ] Use strong `NEXTAUTH_SECRET` (minimum 32 characters)
- [ ] Never commit `.env.local` to version control
- [ ] Use environment variables in production deployment
- [ ] Configure proper redirect URIs for production domain
- [ ] Enable HTTPS in production (required by OAuth)
- [ ] Rotate client secrets periodically (every 6-12 months)
- [ ] Monitor authentication logs for suspicious activity
- [ ] Keep NextAuth.js and dependencies updated

### Email Domain Security

**For maximum security:**
- Use whitelist (`ALLOWED_EMAIL_DOMAINS`) instead of just blocklist
- Regularly review allowed domains
- Remove access for domains no longer needed

**For flexibility:**
- Use blocklist only (default)
- Allows any organizational account
- Blocks known personal account domains

---

## Additional Resources

### Documentation
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Azure AD Provider](https://next-auth.js.org/providers/azure-ad)
- [Google Provider](https://next-auth.js.org/providers/google)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)

### Useful Links
- [Azure Portal](https://portal.azure.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

*Last Updated: Dec 22, 2025 - Added Microsoft SSO support with organizational email restrictions*
