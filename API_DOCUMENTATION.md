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

**Provider:** Google OAuth 2.0

#### Configuration
- **NextAuth Adapter:** MongoDB Adapter
- **Session Strategy:** Database sessions
- **Custom Pages:**
  - Sign In: `/login`
  - Error: `/login`

#### Features
- Account selection prompt on every sign-in (`prompt: "select_account"`)
- Session includes user ID in callbacks
- Debug mode enabled in development

#### Environment Variables Required
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Built-in NextAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/signin` | Displays sign-in page |
| POST | `/api/auth/signin/google` | Initiates Google OAuth flow |
| GET/POST | `/api/auth/callback/google` | OAuth callback handler |
| GET | `/api/auth/signout` | Signs out user |
| POST | `/api/auth/signout` | Confirms sign out |
| GET | `/api/auth/session` | Returns current session |
| GET | `/api/auth/csrf` | Returns CSRF token |
| GET | `/api/auth/providers` | Lists configured providers |

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

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional error details (optional)"
}
```

### Common Error Scenarios

#### 1. Database Connection Errors
```json
{
  "success": false,
  "error": "Failed to fetch elements"
}
```

#### 2. Authentication Errors
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### 3. Validation Errors
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

#### 4. Not Found Errors
```json
{
  "success": false,
  "error": "Element with symbol \"Xx\" not found"
}
```

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

### 1. Client Initiates Sign-In
```javascript
import { signIn } from "next-auth/react"

signIn("google")
```

### 2. OAuth Flow
1. Redirects to Google OAuth consent screen
2. User selects account (forced by `prompt: "select_account"`)
3. User grants permissions
4. Redirects to `/api/auth/callback/google`

### 3. Session Creation
- NextAuth creates database session via MongoDB Adapter
- Session cookie set automatically
- User ID added to session in callback

### 4. Protected API Calls
```javascript
// Client-side
import { useSession } from "next-auth/react"

const { data: session } = useSession()

if (session) {
  fetch("/api/compounds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(compoundData)
  })
}

// Server-side (in API route)
import { getServerSession } from "next-auth"

const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
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
