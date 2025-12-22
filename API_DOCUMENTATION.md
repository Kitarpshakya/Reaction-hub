# API Documentation - Reaction Hub

Complete reference for all API endpoints in the Reaction Hub application.

---

## Table of Contents

- [Authentication API](#authentication-api)
- [Elements API](#elements-api)
- [Compounds API](#compounds-api)
- [Error Handling](#error-handling)
- [Response Format](#response-format)

---

## Authentication API

### NextAuth OAuth Routes

**Base Route:** `/api/auth/[...nextauth]`

**Providers:**
- Google OAuth 2.0 (all users)
- Microsoft Azure AD (organizational accounts only)

#### Configuration
- **NextAuth Adapter:** MongoDB Adapter
- **Session Strategy:** Database sessions
- **Custom Pages:**
  - Sign In: `/login`
  - Error: `/login`

#### Features
- Dual OAuth providers (Google + Microsoft)
- Account selection prompt on every sign-in (`prompt: "select_account"`)
- Email domain validation for Microsoft SSO
- Session includes user ID in callbacks
- Debug mode enabled in development
- Comprehensive error messages with actionable suggestions

#### Environment Variables Required

**General (Required for all):**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

**Google OAuth:**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_OAUTH_CONFIGURED=true
```

**Microsoft Azure AD:**
```env
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=common
NEXT_PUBLIC_MICROSOFT_OAUTH_CONFIGURED=true
```

**Email Domain Restrictions (Microsoft SSO):**
```env
# Optional: Whitelist specific organizational domains
ALLOWED_EMAIL_DOMAINS=university.edu,company.com

# Blocklist: Personal Microsoft account domains (default if not set)
BLOCKED_EMAIL_DOMAINS=outlook.com,hotmail.com,live.com,msn.com,passport.com
```

#### Built-in NextAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/signin` | Displays sign-in page |
| POST | `/api/auth/signin/google` | Initiates Google OAuth flow |
| POST | `/api/auth/signin/azure-ad` | Initiates Microsoft OAuth flow |
| GET/POST | `/api/auth/callback/google` | Google OAuth callback handler |
| GET/POST | `/api/auth/callback/azure-ad` | Microsoft OAuth callback handler |
| GET | `/api/auth/signout` | Signs out user |
| POST | `/api/auth/signout` | Confirms sign out |
| GET | `/api/auth/session` | Returns current session |
| GET | `/api/auth/csrf` | Returns CSRF token |
| GET | `/api/auth/providers` | Lists configured providers |

#### Email Validation (Microsoft SSO)

Microsoft SSO includes automatic email validation to ensure only organizational accounts can access the application.

**Validation Rules:**
1. **Blocklist Check:** Rejects personal Microsoft accounts (@outlook.com, @hotmail.com, @live.com, @msn.com, @passport.com)
2. **Whitelist Check:** If `ALLOWED_EMAIL_DOMAINS` is configured, only those domains are allowed
3. **Default Behavior:** If no whitelist is configured, all organizational emails are allowed (personal accounts still blocked)

**Example Validation Flow:**
```
User logs in with: student@university.edu
↓
Check blocklist: ❌ Not in blocklist
↓
Check whitelist (if configured): ✅ In whitelist OR no whitelist configured
↓
Result: ✅ Login allowed
```

```
User logs in with: user@outlook.com
↓
Check blocklist: ✅ Found in blocklist (personal account)
↓
Result: ❌ Login rejected with error code "personal_account"
```

#### Authentication Error Codes

The authentication system returns specific error codes for different failure scenarios:

| Error Code | Severity | Description | When It Occurs |
|------------|----------|-------------|----------------|
| `personal_account` | Error (Red) | Personal Microsoft account blocked | User tries to login with @outlook.com, @hotmail.com, etc. |
| `domain_not_authorized` | Error (Red) | Email domain not in whitelist | Domain not authorized when whitelist is configured |
| `access_denied` | Warning (Yellow) | User cancelled OAuth flow | User clicks "Cancel" on OAuth consent screen |
| `configuration` | Error (Red) | OAuth credentials invalid | Azure AD/Google OAuth misconfigured |
| `provider_error` | Error (Red) | OAuth provider issue | Microsoft/Google service error or email not provided |
| `verification` | Error (Red) | Verification link invalid | Email verification failed (if implemented) |
| `callback` | Error (Red) | OAuth callback failed | Redirect URI mismatch or state validation failed |
| `session_required` | Info (Blue) | Session expired | User session timeout |
| `network_error` | Warning (Yellow) | Connection problem | Cannot reach authentication server |
| `default` | Error (Red) | Unknown error | Unexpected authentication failure |

**Error Response Format:**
```
/login?error=personal_account&message=Personal%20Microsoft%20accounts%20are%20not%20allowed
```

**Error Display:**
Each error shows:
- **Title:** Clear identification of the error type
- **Message:** Detailed explanation
- **Suggestion:** Actionable next steps
- **Visual Indicator:** Color-coded severity (red/yellow/blue) with icons

---

## Elements API

### 1. Get All Elements

**Endpoint:** `GET /api/elements`

**Description:** Retrieves all 118 periodic table elements with basic properties (optimized for periodic table grid display).

**Authentication:** Not required (public)

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "count": 118,
  "elements": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "atomicNumber": 1,
      "symbol": "H",
      "name": "Hydrogen",
      "atomicMass": 1.008,
      "category": "nonmetal",
      "categories": ["nonmetal", "diatomic-nonmetal"],
      "color": "#4ECDC4",
      "gridRow": 1,
      "gridColumn": 1
    }
    // ... 117 more elements
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

**File Location:** `app/api/elements/route.ts:6-35`

---

### 2. Get Element by Symbol

**Endpoint:** `GET /api/elements/[symbol]`

**Description:** Retrieves complete details for a single element by its chemical symbol (case-insensitive).

**Authentication:** Not required (public)

**Path Parameters:**
- `symbol` (string) - Chemical symbol (e.g., "H", "He", "Li")

**Example Request:**
```
GET /api/elements/O
GET /api/elements/au (case-insensitive)
```

**Response (Success):**
```json
{
  "success": true,
  "element": {
    "_id": "507f1f77bcf86cd799439011",
    "atomicNumber": 8,
    "symbol": "O",
    "name": "Oxygen",
    "atomicMass": 15.999,
    "category": "nonmetal",
    "categories": ["nonmetal", "diatomic-nonmetal"],
    "group": 16,
    "period": 2,
    "block": "p",
    "electronConfiguration": "[He] 2s² 2p⁴",
    "electronsPerShell": [2, 6],
    "phase": "gas",
    "meltingPoint": 54.36,
    "boilingPoint": 90.188,
    "density": 0.001429,
    "electronegativity": 3.44,
    "atomicRadius": 48,
    "ionizationEnergy": 13.618,
    "oxidationStates": [-2, -1, 1, 2],
    "valency": 2,
    "maxBonds": 2,
    "discoveredBy": "Carl Wilhelm Scheele",
    "yearDiscovered": 1774,
    "isRadioactive": false,
    "halfLife": null,
    "color": "#4ECDC4",
    "summary": "Oxygen is a highly reactive nonmetal...",
    "isotopes": [
      {
        "massNumber": 16,
        "abundance": 99.757,
        "isStable": true
      }
    ]
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "Element with symbol \"Xx\" not found"
}
```

**Status Codes:**
- `200 OK` - Element found
- `404 Not Found` - Element doesn't exist
- `500 Internal Server Error` - Database error

**File Location:** `app/api/elements/[symbol]/route.ts:6-45`

---

### 3. Seed Elements Database

**Endpoint:** `POST /api/elements/seed`

**Description:** Clears and reseeds the database with all 118 elements from `lib/data/elements.json`. Use for initial setup or database reset.

**Authentication:** Not required (should be restricted in production)

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Successfully seeded 118 elements",
  "count": 118
}
```

**Status Codes:**
- `201 Created` - Seed successful
- `500 Internal Server Error` - Seed failed

**File Location:** `app/api/elements/seed/route.ts:7-36`

**Warning:** This endpoint deletes all existing element data before seeding.

---

### 4. Check Seed Status

**Endpoint:** `GET /api/elements/seed`

**Description:** Checks if the elements database has been seeded and returns element count.

**Authentication:** Not required

**Query Parameters:** None

**Response (Seeded):**
```json
{
  "success": true,
  "message": "Database has 118 elements",
  "count": 118,
  "isSeed": true
}
```

**Response (Empty):**
```json
{
  "success": true,
  "message": "Database is empty. Send POST request to seed.",
  "count": 0,
  "isSeed": false
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

**File Location:** `app/api/elements/seed/route.ts:39-67`

---

## Compounds API

### 1. Get All Compounds

**Endpoint:** `GET /api/compounds`

**Description:** Retrieves all compounds, optionally filtered by user ID. Returns compounds in descending order by creation date.

**Authentication:** Not required (public browsing)

**Query Parameters:**
- `userId` (string, optional) - Filter compounds by creator

**Example Requests:**
```
GET /api/compounds
GET /api/compounds?userId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "compounds": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "507f1f77bcf86cd799439011",
      "name": "Water",
      "formula": "H₂O",
      "molarMass": 18.015,
      "description": "Essential for life",
      "elements": [
        {
          "elementId": "507f...",
          "symbol": "H",
          "count": 2,
          "position": { "x": 100, "y": 100 }
        },
        {
          "elementId": "507f...",
          "symbol": "O",
          "count": 1,
          "position": { "x": 200, "y": 100 }
        }
      ],
      "bonds": [
        {
          "id": "bond-1",
          "fromElementId": "507f...",
          "toElementId": "507f...",
          "bondType": "covalent"
        }
      ],
      "externalFactors": {
        "temperature": 25,
        "pressure": 1,
        "catalyst": null,
        "heat": false,
        "light": false
      },
      "canvasData": {
        "width": 800,
        "height": 600,
        "zoom": 1,
        "offset": { "x": 0, "y": 0 }
      },
      "createdBy": "user123",
      "createdByName": "John Doe",
      "createdAt": "2025-12-11T10:30:00.000Z",
      "updatedAt": "2025-12-11T10:30:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

**File Location:** `app/api/compounds/route.ts:9-44`

---

### 2. Create Compound

**Endpoint:** `POST /api/compounds`

**Description:** Creates a new compound with elements, bonds, external factors, and canvas data (Phase 3 features).

**Authentication:** **Required** (Google OAuth session)

**Request Headers:**
```
Content-Type: application/json
Cookie: next-auth.session-token=...
```

**Request Body:**
```json
{
  "name": "Water",
  "formula": "H₂O",
  "description": "Essential for life",
  "molarMass": 18.015,
  "elements": [
    {
      "elementId": "507f1f77bcf86cd799439011",
      "symbol": "H",
      "count": 2,
      "position": { "x": 100, "y": 100 }
    },
    {
      "elementId": "507f1f77bcf86cd799439012",
      "symbol": "O",
      "count": 1,
      "position": { "x": 200, "y": 100 }
    }
  ],
  "bonds": [
    {
      "id": "bond-1",
      "fromElementId": "507f1f77bcf86cd799439011",
      "toElementId": "507f1f77bcf86cd799439012",
      "bondType": "covalent"
    }
  ],
  "externalFactors": {
    "temperature": 25,
    "pressure": 1,
    "catalyst": null,
    "heat": false,
    "light": false
  },
  "canvasData": {
    "width": 800,
    "height": 600,
    "zoom": 1,
    "offset": { "x": 0, "y": 0 }
  }
}
```

**Required Fields:**
- `name` (string) - Compound name
- `formula` (string) - Chemical formula
- `elements` (array) - At least one element with `elementId`, `symbol`, `count`

**Optional Fields:**
- `description` (string)
- `molarMass` (number)
- `bonds` (array) - Element connections
- `externalFactors` (object) - Reaction conditions
- `canvasData` (object) - Canvas state

**Response (Success):**
```json
{
  "success": true,
  "compound": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Water",
    "formula": "H₂O",
    // ... full compound data
  }
}
```

**Response (Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Response (Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

**Status Codes:**
- `201 Created` - Compound created successfully
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Not signed in
- `500 Internal Server Error` - Database error

**File Location:** `app/api/compounds/route.ts:47-121`

---

### 3. Get Compound by ID

**Endpoint:** `GET /api/compounds/[id]`

**Description:** Retrieves complete details for a single compound by its database ID.

**Authentication:** Not required (public)

**Path Parameters:**
- `id` (string) - MongoDB ObjectID of the compound

**Example Request:**
```
GET /api/compounds/507f1f77bcf86cd799439011
```

**Response (Success):**
```json
{
  "success": true,
  "compound": {
    "_id": "507f1f77bcf86cd799439011",
    "id": "507f1f77bcf86cd799439011",
    "name": "Water",
    "formula": "H₂O",
    // ... full compound data
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "Compound with ID \"507f...\" not found"
}
```

**Status Codes:**
- `200 OK` - Compound found
- `404 Not Found` - Compound doesn't exist
- `500 Internal Server Error` - Database error

**File Location:** `app/api/compounds/[id]/route.ts:8-51`

---

### 4. Update Compound

**Endpoint:** `PUT /api/compounds/[id]`

**Description:** Updates an existing compound. Supports updating all fields including positions, bonds, and external factors.

**Authentication:** **Required** (Google OAuth session)

**Path Parameters:**
- `id` (string) - MongoDB ObjectID of the compound

**Request Headers:**
```
Content-Type: application/json
Cookie: next-auth.session-token=...
```

**Request Body:** Same format as Create Compound (all fields required)

**Response (Success):**
```json
{
  "success": true,
  "compound": {
    "_id": "507f1f77bcf86cd799439011",
    // ... updated compound data
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "Compound not found"
}
```

**Status Codes:**
- `200 OK` - Update successful
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Not signed in
- `404 Not Found` - Compound doesn't exist
- `500 Internal Server Error` - Database error

**File Location:** `app/api/compounds/[id]/route.ts:54-147`

**Note:** Currently does not check ownership - any authenticated user can update any compound.

---

### 5. Delete Compound

**Endpoint:** `DELETE /api/compounds/[id]`

**Description:** Deletes a compound. Only the creator can delete their own compounds.

**Authentication:** **Required** (Google OAuth session)

**Path Parameters:**
- `id` (string) - MongoDB ObjectID of the compound

**Request Headers:**
```
Cookie: next-auth.session-token=...
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Compound deleted successfully"
}
```

**Response (Forbidden):**
```json
{
  "success": false,
  "error": "Forbidden - You can only delete your own compounds"
}
```

**Status Codes:**
- `200 OK` - Delete successful
- `401 Unauthorized` - Not signed in
- `403 Forbidden` - Not the compound owner
- `404 Not Found` - Compound doesn't exist
- `500 Internal Server Error` - Database error

**File Location:** `app/api/compounds/[id]/route.ts:150-214`

---

## Error Handling

### API Error Format

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional error details (optional)"
}
```

### Authentication Error Format

Authentication errors use URL query parameters for user-facing display:

```
/login?error=error_code&message=Custom%20error%20message
```

**Error Components:**
- `error` - Error code (e.g., `personal_account`, `access_denied`)
- `message` - Custom error message (URL encoded, optional)

**Display Format:**
Each authentication error includes:
- **Title**: Clear error type identification
- **Message**: Detailed explanation
- **Suggestion**: Actionable next steps
- **Severity**: Color-coded (Red/Yellow/Blue)
- **Icon**: Visual indicator (Error ❌, Warning ⚠️, Info ℹ️, Lock 🔒)

### Common Error Scenarios

#### 1. Database Connection Errors
```json
{
  "success": false,
  "error": "Failed to fetch elements"
}
```

#### 2. API Authentication Errors
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### 3. OAuth Authentication Errors

**Personal Microsoft Account Blocked:**
```
/login?error=personal_account&message=Personal%20Microsoft%20accounts%20are%20not%20allowed
```
Display: 🔒 Red error with suggestion to use school/work email

**Domain Not Authorized:**
```
/login?error=domain_not_authorized&message=Your%20email%20domain%20is%20not%20authorized
```
Display: 🔒 Red error with suggestion to contact administrator

**User Cancelled Login:**
```
/login?error=access_denied
```
Display: ⚠️ Yellow warning with suggestion to try again

**Configuration Error:**
```
/login?error=configuration
```
Display: ❌ Red error indicating OAuth setup issue

**Provider Error:**
```
/login?error=provider_error&message=Microsoft%20did%20not%20provide%20an%20email%20address
```
Display: ❌ Red error with suggestion to try different sign-in method

**Session Expired:**
```
/login?error=session_required
```
Display: ℹ️ Blue info message to sign in again

#### 4. Validation Errors
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

#### 5. Not Found Errors
```json
{
  "success": false,
  "error": "Element with symbol \"Xx\" not found"
}
```

### Error Code Reference

See [Authentication Error Codes](#authentication-error-codes) section for complete list of authentication error codes, severity levels, and when they occur.

**Key Authentication Error Codes:**
- `personal_account` - Personal Microsoft account rejected
- `domain_not_authorized` - Email domain not in whitelist
- `access_denied` - User cancelled OAuth flow
- `configuration` - OAuth credentials invalid
- `provider_error` - OAuth service error
- `callback` - OAuth callback failed
- `session_required` - Session expired
- `network_error` - Connection problem

---

## Response Format

### Standard Success Response
```json
{
  "success": true,
  // ... resource-specific data
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Collection Response
```json
{
  "success": true,
  "count": 118,
  "elements": [ /* array of resources */ ]
}
```

---

## Authentication Flow

### Google OAuth Flow

#### 1. Client Initiates Sign-In
```javascript
import { signIn } from "next-auth/react"

// Sign in with Google
signIn("google", { callbackUrl: "/" })
```

#### 2. OAuth Flow
1. Redirects to Google OAuth consent screen
2. User selects account (forced by `prompt: "select_account"`)
3. User grants permissions
4. Redirects to `/api/auth/callback/google`

#### 3. Session Creation
- NextAuth creates database session via MongoDB Adapter
- Session cookie set automatically
- User ID added to session in callback

---

### Microsoft OAuth Flow (with Email Validation)

#### 1. Client Initiates Sign-In
```javascript
import { signIn } from "next-auth/react"

// Sign in with Microsoft
signIn("azure-ad", { callbackUrl: "/" })
```

#### 2. OAuth Flow
1. Redirects to Microsoft OAuth consent screen
2. User signs in with Microsoft account
3. User grants permissions
4. Redirects to `/api/auth/callback/azure-ad`

#### 3. Email Validation (Server-Side)
```javascript
// In NextAuth signIn callback
if (account?.provider === "azure-ad") {
  const email = user.email
  const domain = email.split('@')[1]?.toLowerCase()

  // Check 1: Block personal accounts
  if (['outlook.com', 'hotmail.com', 'live.com'].includes(domain)) {
    return `/login?error=personal_account&message=...`
  }

  // Check 2: Validate against whitelist (if configured)
  if (ALLOWED_EMAIL_DOMAINS && !ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return `/login?error=domain_not_authorized&message=...`
  }

  // Approved: Continue with session creation
  return true
}
```

#### 4. Session Creation (if approved)
- NextAuth creates database session via MongoDB Adapter
- Session cookie set automatically
- User ID added to session in callback

#### 5. Rejection Flow (if blocked)
- User redirected to `/login` with error code
- Error message displayed with:
  - Title (e.g., "Personal Account Not Allowed")
  - Message (e.g., "Personal Microsoft accounts are not permitted...")
  - Suggestion (e.g., "Use your school or work email instead")
  - Visual indicator (Red lock icon)

---

### Protected API Calls

#### Client-Side
```javascript
import { useSession } from "next-auth/react"

const { data: session, status } = useSession()

// Check authentication status
if (status === "loading") {
  return <div>Loading...</div>
}

if (status === "unauthenticated") {
  router.push("/login")
  return null
}

// Make authenticated request
if (session) {
  const response = await fetch("/api/compounds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(compoundData),
    credentials: "include" // Include session cookie
  })

  if (response.status === 401) {
    // Session expired, redirect to login
    router.push("/login?error=session_required")
  }
}
```

#### Server-Side (API Route)
```javascript
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  // Get session
  const session = await getServerSession(authOptions)

  // Check authentication
  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Session exists - proceed with authenticated logic
  const userId = session.user.id
  const userEmail = session.user.email

  // ... your protected logic here
}
```

---

### Testing Authentication

#### Test Google Login
```bash
# Visit login page
http://localhost:3000/login

# Click "Sign in with Google"
# Complete OAuth flow
# Should redirect to home page
```

#### Test Microsoft Login (Organizational Account)
```bash
# Visit login page
http://localhost:3000/login

# Click "Sign in with Microsoft"
# Use: student@university.edu
# Should succeed and redirect to home page
```

#### Test Microsoft Login (Personal Account - Should Fail)
```bash
# Visit login page
http://localhost:3000/login

# Click "Sign in with Microsoft"
# Use: user@outlook.com
# Should show error: "Personal Microsoft accounts are not allowed"
```

#### Test Email Whitelist
```bash
# Set in .env.local
ALLOWED_EMAIL_DOMAINS=university.edu

# Restart server
npm run dev

# Try: student@university.edu → ✅ Should work
# Try: employee@company.com → ❌ Should be blocked
```

#### Test Email Validation Script
```bash
# Test configuration without logging in
node scripts/test-email-validation.js student@university.edu
node scripts/test-email-validation.js user@outlook.com
```

---

## Best Practices

### Rate Limiting
Currently not implemented. Consider adding rate limiting for:
- Seed endpoint (`/api/elements/seed`)
- Create compound endpoint (`/api/compounds` POST)

### Security Recommendations
1. Add admin authentication for seed endpoint
2. Implement ownership checks on compound updates
3. Add input sanitization for user-generated content
4. Implement CORS restrictions for production
5. Add request validation middleware

### Performance Optimization
1. Add caching for elements endpoint (data rarely changes)
2. Implement pagination for compounds list
3. Add database indexes on frequently queried fields
4. Consider Redis for session storage in production

---

## Testing Examples

### Using cURL

```bash
# Get all elements
curl http://localhost:3000/api/elements

# Get element by symbol
curl http://localhost:3000/api/elements/O

# Check seed status
curl http://localhost:3000/api/elements/seed

# Seed database
curl -X POST http://localhost:3000/api/elements/seed

# Get all compounds
curl http://localhost:3000/api/compounds

# Get compounds by user
curl "http://localhost:3000/api/compounds?userId=user123"

# Get compound by ID
curl http://localhost:3000/api/compounds/507f1f77bcf86cd799439011
```

### Using JavaScript Fetch

```javascript
// Get all elements
const elementsResponse = await fetch('/api/elements')
const { elements } = await elementsResponse.json()

// Get element details
const elementResponse = await fetch('/api/elements/H')
const { element } = await elementResponse.json()

// Create compound (requires auth)
const compoundResponse = await fetch('/api/compounds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Water',
    formula: 'H₂O',
    elements: [
      { elementId: '...', symbol: 'H', count: 2 },
      { elementId: '...', symbol: 'O', count: 1 }
    ]
  })
})
const { compound } = await compoundResponse.json()
```

---

## API Versioning

Current version: **v1** (implicit, no version prefix)

Future considerations:
- Add `/api/v2/` prefix for breaking changes
- Maintain backward compatibility for v1 endpoints
- Document deprecation timeline

---

## Contact & Support

For API issues or questions:
- Check error logs in development mode
- Review MongoDB connection settings
- Verify environment variables are set correctly

---

**Last Updated:** December 11, 2025
**API Version:** 1.0
**Application:** Reaction Hub - Interactive Periodic Table
