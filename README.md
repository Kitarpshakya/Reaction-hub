# Reaction Hub - Interactive Periodic Table & Compound Builder

A modern, interactive periodic table application with drag-and-drop compound builder, built with Next.js 15. Features beautiful animations, 3D Bohr model visualizations, intelligent chemical bonding, and detailed information about all 118 chemical elements.

![Reaction Hub](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Three.js](https://img.shields.io/badge/Three.js-3D-orange) ![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)

## ✨ Features

### 🔬 Interactive Periodic Table
- **Complete 118 Elements** - All elements from Hydrogen to Oganesson
- **Category Color Coding** - Visual distinction between 10 element categories
- **Smooth Animations** - Staggered entrance animations powered by Framer Motion
- **Responsive Grid** - 18-column CSS Grid layout with proper spacing
- **Quick Navigation** - Click any element to view detailed information

### ⚛️ Element Detail Pages
- **3D Bohr Model Visualization** - Interactive rotating atomic models with electron shells
- **Comprehensive Properties**:
  - Physical properties (melting point, boiling point, density, phase)
  - Chemical properties (electronegativity, ionization energy, oxidation states)
  - Electron configuration and shells
  - Atomic structure (radius, mass, number)
  - Discovery history and facts
  - Isotopes with abundance and stability data
- **Navigation Controls** - Browse between elements seamlessly

### 🧪 Compound Management (Phase 3)
- **Browse Compounds** - Public gallery of user-created compounds
- **Advanced Compound Builder** - Interactive drag-and-drop canvas
  - Drag elements from searchable panel onto canvas
  - Intelligent bubble sizing based on atomic mass
  - Click-to-connect bonding system with 6 bond types
  - Smart bond type suggestions (O-O→double, N-N→triple, Metal+Nonmetal→ionic)
  - Real-time valency validation (green/yellow/red status)
  - Collision detection and element repositioning
  - Auto-spread button for optimal element distribution
  - External factors (temperature, pressure, catalyst, heat, light)
  - Auto-calculated formula and molar mass
  - Canvas zoom, pan, and state persistence
- **Compound CRUD** - Create, view, update, and delete your compounds

### 🔐 Authentication
- **Google OAuth 2.0** - Secure sign-in with Google accounts
- **Account Selection** - Choose account on every sign-in
- **User Sessions** - Persistent authentication via NextAuth.js
- **Protected Routes** - Compound creation requires authentication

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **3D Graphics**: Three.js, React Three Fiber (@react-three/fiber), Drei (@react-three/drei)
- **Drag & Drop**: @dnd-kit/core
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with MongoDB Adapter
- **OAuth Provider**: Google
- **State Management**: Zustand (for compound canvas)
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- **Node.js** 18+ installed
- **MongoDB** instance (local or MongoDB Atlas free tier)
- **Google Cloud Console** account (for OAuth credentials)
- **npm** or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd reaction-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
# Default connection: mongodb://localhost:27017/reaction-hub
```

**Option B: MongoDB Atlas (Free - Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" → "Connect your application"
5. Copy your connection string
6. Replace `<password>` with your database user password

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Select **Web application** as application type
7. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. Copy your **Client ID** and **Client Secret**

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI="mongodb://localhost:27017/reaction-hub"
# OR for MongoDB Atlas:
# MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/reaction-hub?retryWrites=true&w=majority"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl"
# Generate secret: openssl rand -base64 32

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 6. Seed the Database

Start the development server:

```bash
npm run dev
```

Seed the database with all 118 elements:

**Option A: Using curl**
```bash
curl -X POST http://localhost:3000/api/elements/seed
```

**Option B: Using browser**
Navigate to: `http://localhost:3000/api/elements/seed`

**Option C: Using Node.js script**
```bash
node scripts/seed.js
```

You should see a success message: `"Successfully seeded 118 elements"`

### 7. View the Application

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 📁 Project Structure

```
reaction-hub/
├── app/
│   ├── page.tsx                               # Landing page
│   ├── layout.tsx                             # Root layout with Header
│   ├── globals.css                            # Global styles
│   ├── periodic-table/page.tsx                # Periodic table grid (118 elements)
│   ├── elements/[symbol]/page.tsx             # Element detail pages
│   ├── compounds/
│   │   ├── page.tsx                           # Compounds list (public)
│   │   ├── create/page.tsx                    # Compound builder (auth required)
│   │   └── [id]/
│   │       ├── page.tsx                       # Compound detail page
│   │       └── edit/page.tsx                  # Edit compound (auth required)
│   ├── login/page.tsx                         # Login page
│   └── api/
│       ├── auth/[...nextauth]/route.ts        # NextAuth configuration
│       ├── elements/
│       │   ├── route.ts                       # GET all elements
│       │   ├── [symbol]/route.ts              # GET element by symbol
│       │   └── seed/route.ts                  # POST seed database
│       └── compounds/
│           ├── route.ts                       # GET all, POST create
│           └── [id]/route.ts                  # GET, PUT, DELETE by ID
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                         # Navigation header with auth
│   │   └── Footer.tsx                         # Footer component
│   ├── home/
│   │   ├── Hero.tsx                           # Landing page hero
│   │   ├── FeatureCard.tsx                    # Feature cards
│   │   └── LandingPageLinks.tsx               # Quick links
│   ├── periodic-table/
│   │   ├── PeriodicTableGrid.tsx              # 18-column grid layout
│   │   ├── ElementCard.tsx                    # Individual element cards
│   │   ├── TableLegend.tsx                    # Category legend
│   │   └── TableHeader.tsx                    # Table title & controls
│   ├── element-detail/
│   │   ├── ElementHero.tsx                    # Element header card
│   │   ├── BohrModel3D.tsx                    # 3D Bohr model (Three.js)
│   │   ├── PropertyGrid.tsx                   # Property sections
│   │   ├── IsotopesSection.tsx                # Isotopes table
│   │   ├── DiscoverySection.tsx               # Discovery info
│   │   └── NavigationButtons.tsx              # Prev/Next controls
│   ├── compounds/
│   │   ├── CompoundsList.tsx                  # Compound grid
│   │   ├── CompoundCard.tsx                   # Compound preview cards
│   │   ├── CompoundFilters.tsx                # Filter controls
│   │   └── create/
│   │       ├── ElementsPanel.tsx              # Searchable element library
│   │       ├── CompoundCanvas.tsx             # Drag-drop canvas (@dnd-kit)
│   │       ├── ElementBubble.tsx              # Draggable element bubbles
│   │       ├── BondConnector.tsx              # Bond rendering (SVG lines)
│   │       ├── ExternalFactors.tsx            # Reaction conditions panel
│   │       └── CompoundDetails.tsx            # Name, formula, molar mass
│   ├── auth/
│   │   ├── LoginButton.tsx                    # Google sign-in button
│   │   ├── UserMenu.tsx                       # User dropdown menu
│   │   └── AuthGuard.tsx                      # Protected route wrapper
│   └── ui/
│       ├── Card.tsx                           # Reusable card component
│       ├── Badge.tsx                          # Badge component
│       ├── Button.tsx                         # Button component
│       └── Skeleton.tsx                       # Loading skeleton
│
├── lib/
│   ├── db/
│   │   ├── mongodb.ts                         # MongoDB connection (Mongoose)
│   │   ├── mongodb-client.ts                  # MongoDB client (NextAuth adapter)
│   │   └── models/
│   │       ├── Element.ts                     # Element schema
│   │       ├── User.ts                        # User schema
│   │       └── Compound.ts                    # Compound schema (Phase 3)
│   ├── auth/
│   │   ├── nextauth.config.ts                 # Auth configuration
│   │   └── auth-helpers.ts                    # Auth utility functions
│   ├── stores/
│   │   └── useCompoundCanvasStore.ts          # Zustand store for canvas state
│   ├── utils/
│   │   ├── element-helpers.ts                 # Element utility functions
│   │   ├── compound-helpers.ts                # Compound calculations
│   │   ├── chemical-validation.ts             # Valency & bond validation
│   │   └── chemistry-helpers.ts               # Bond type suggestions
│   ├── types/
│   │   ├── element.ts                         # Element TypeScript interfaces
│   │   ├── compound.ts                        # Compound TypeScript interfaces
│   │   └── user.ts                            # User TypeScript interfaces
│   └── data/
│       └── elements.json                      # All 118 elements data
│
├── hooks/
│   ├── useElements.ts                         # Fetch all elements
│   ├── useElement.ts                          # Fetch single element
│   ├── useCompounds.ts                        # Fetch all compounds
│   ├── useCompound.ts                         # Fetch single compound
│   └── useAuth.ts                             # Auth state management
│
├── scripts/
│   ├── seed.js                                # Database seeding script
│   ├── fix-bond-types.ts                      # Utility script
│   └── fix-halogen-category.ts                # Utility script
│
├── styles/
│   └── periodic-table.css                     # Periodic table custom styles
│
├── public/
│   └── (static assets)
│
├── CLAUDE.md                                  # Project documentation
├── API_DOCUMENTATION.md                       # Complete API reference
└── README.md                                  # This file
```

## 🎨 Element Categories & Colors

The periodic table uses distinct colors for each of the 10 element categories:

| Category | Color | Hex Code | Examples |
|----------|-------|----------|----------|
| **Nonmetal** | Teal | `#4ECDC4` | H, C, N, O, P, S |
| **Noble Gas** | Mint | `#95E1D3` | He, Ne, Ar, Kr, Xe, Rn |
| **Alkali Metal** | Coral | `#F38181` | Li, Na, K, Rb, Cs, Fr |
| **Alkaline Earth Metal** | Yellow | `#FDCB6E` | Be, Mg, Ca, Sr, Ba, Ra |
| **Transition Metal** | Purple | `#A29BFE` | Fe, Cu, Ag, Au, Zn |
| **Post-Transition Metal** | Blue | `#74B9FF` | Al, Ga, In, Sn, Pb |
| **Metalloid** | Pink | `#FD79A8` | B, Si, Ge, As, Sb, Te |
| **Halogen** | Red | `#FF7675` | F, Cl, Br, I, At |
| **Lanthanide** | Light Yellow | `#FFEAA7` | La, Ce, Pr, Nd, ... |
| **Actinide** | Gray | `#DFE6E9` | Ac, Th, Pa, U, ... |

## 🔌 API Endpoints

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Reference

#### Elements
- `GET /api/elements` - Get all 118 elements (basic properties)
- `GET /api/elements/[symbol]` - Get element details (e.g., `/api/elements/O`)
- `GET /api/elements/seed` - Check database seed status
- `POST /api/elements/seed` - Seed database with all 118 elements

#### Compounds
- `GET /api/compounds` - Get all compounds (optional `?userId=...` filter)
- `POST /api/compounds` - Create compound (auth required)
- `GET /api/compounds/[id]` - Get compound details
- `PUT /api/compounds/[id]` - Update compound (auth required)
- `DELETE /api/compounds/[id]` - Delete compound (owner only)

#### Authentication
- `GET /api/auth/signin` - Sign-in page
- `GET /api/auth/signout` - Sign-out
- `GET /api/auth/session` - Current session
- Built-in NextAuth.js endpoints for OAuth flow

## 🧪 Chemical Bonding Intelligence

The compound builder features intelligent bonding suggestions based on chemistry principles:

### Bond Type Suggestions
- **Diatomic Elements**: H-H, O-O→double bond, N-N→triple bond
- **Halogens**: F-F, Cl-Cl→single bond
- **Ionic Bonds**: Metal + Nonmetal with electronegativity difference >1.7
- **Covalent Bonds**: Default for nonmetal combinations

### Valency Rules
- **H**: 1 bond
- **C**: 4 bonds
- **N**: 3 or 5 bonds
- **O**: 2 bonds
- **Halogens (F, Cl, Br, I)**: 1 bond
- **S**: 2, 4, or 6 bonds
- **P**: 3 or 5 bonds
- **Alkali Metals**: 1 bond
- **Alkaline Earth Metals**: 2 bonds
- **Noble Gases**: 0 bonds (inert)

### Validation States
- 🟢 **Green**: Chemically stable, common patterns
- 🟡 **Yellow**: Rare but possible (e.g., SF₆, PCl₅)
- 🔴 **Red**: Valency exceeded, noble gas bonds, impossible combinations

## 🎮 Usage Guide

### Periodic Table
1. Navigate to the periodic table page
2. Hover over element cards to see animations
3. Click any element to view detailed information
4. Use the color-coded legend to identify categories

### Element Detail Page
- **3D Bohr Model**:
  - Drag to rotate the model
  - Scroll to zoom in/out
  - Auto-rotation by default
- **Navigation**: Use ← / → buttons to browse elements
- **Return**: Click "← Back to Table" to return to periodic table

### Creating Compounds
1. **Sign In**: Click "Sign In" and authenticate with Google
2. **Navigate**: Go to "Compounds" → "Create Compound"
3. **Add Elements**:
   - Search elements in the left panel
   - Drag elements onto the canvas
   - Position elements by dragging
4. **Create Bonds**:
   - Click first element, then click second element
   - System suggests appropriate bond type
   - Manually change bond type if needed
   - View real-time valency status
5. **Set External Factors**: (Optional)
   - Temperature, pressure
   - Catalyst, heat, light
6. **Auto-spread**: Click to distribute elements optimally
7. **Save**: Enter compound name and save

### Managing Compounds
- **View**: Click any compound card to see details
- **Edit**: Click "Edit" on compounds you created
- **Delete**: Click "Delete" on compounds you own
- **Filter**: Use filters to find specific compounds

## 🎯 Implementation Status

### ✅ Completed Features

**Phase 1-2: Foundation**
- Next.js 15 setup with App Router
- MongoDB integration with Mongoose
- TypeScript configuration
- All 118 elements data structure

**Phase 3-4: Elements**
- Complete elements database schema
- API routes for elements
- Database seeding functionality

**Phase 5: Periodic Table**
- 18-column responsive grid layout
- Category color coding
- Smooth staggered animations
- Element cards with hover effects

**Phase 6: Element Details**
- Comprehensive property displays
- 3D Bohr model with Three.js
- Interactive rotation and zoom
- Isotopes section
- Discovery information
- Element navigation

**Phase 7: Authentication**
- NextAuth.js integration
- Google OAuth 2.0
- MongoDB session storage
- Protected routes
- User session management

**Phase 8: Compound System**
- Compound database schema
- Compound CRUD API
- Public compound browsing
- Compound detail pages

**Phase 9: Compound Builder (Phase 3)**
- @dnd-kit drag-and-drop integration
- Searchable elements panel
- Interactive canvas with zoom/pan
- Element bubbles (size based on atomic mass)
- Click-to-bond system with 6 bond types
- Smart bond type suggestions
- Real-time valency validation
- Collision detection
- Auto-spread algorithm
- External factors panel
- Auto-calculated formula and molar mass
- Canvas state persistence

### 🔄 Future Enhancements

- Element search and filtering
- Element comparison tool
- Advanced compound search
- Reaction equations
- Element quiz mode
- Export compound as image
- Share compounds via URL
- More external factors (pH, UV, etc.)
- 3D compound visualization
- Compound properties calculator

## 🐛 Troubleshooting

### Database Connection Error
```
Error: MongooseError: Cannot connect to MongoDB
```
**Solutions:**
- Ensure MongoDB is running (local) or cluster is active (Atlas)
- Check `MONGODB_URI` in `.env.local`
- For Atlas: Whitelist your IP address in Network Access
- Verify connection string format and credentials

### Elements Not Showing
```
Error: No elements found
```
**Solutions:**
- Seed the database: `curl -X POST http://localhost:3000/api/elements/seed`
- Check browser console for API errors
- Verify `/api/elements` returns data

### Authentication Not Working
```
Error: [next-auth][error][CLIENT_FETCH_ERROR]
```
**Solutions:**
- Verify all auth environment variables are set
- Check Google OAuth credentials are correct
- Ensure redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Clear browser cookies and try again

### 3D Model Not Loading
```
Error: THREE is not defined
```
**Solutions:**
- Ensure `@react-three/fiber` and `@react-three/drei` are installed
- Clear `.next` cache: `rm -rf .next && npm run dev`
- Try a different browser (Chrome/Firefox recommended)
- Check for WebGL support in browser

### Drag and Drop Not Working
```
Error: DndContext is not found
```
**Solutions:**
- Verify `@dnd-kit/core` is installed
- Check component is wrapped in `<DndContext>`
- Clear browser cache

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project settings

3. **Add Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://...
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Update Google OAuth**:
   - Add production redirect URI in Google Cloud Console:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

6. **Seed Production Database**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/elements/seed
   ```

### Environment-Specific Configuration

**Development**:
```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production**:
```env
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive project architecture and guidelines
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[Next.js Docs](https://nextjs.org/docs)** - Next.js framework documentation
- **[MongoDB Docs](https://www.mongodb.com/docs/)** - MongoDB database documentation
- **[NextAuth.js Docs](https://next-auth.js.org/)** - Authentication documentation

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Areas for Contribution
- Add more element data (images, videos, fun facts)
- Improve chemical validation logic
- Add new bond types or external factors
- Enhance 3D visualizations
- Implement new features (search, filters, comparisons)
- Fix bugs and improve performance
- Improve documentation

### Contribution Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - Feel free to use this project for learning, development, and personal projects.

## 🙏 Acknowledgments

- **Design Inspiration**: [Google Arts Experiments Periodic Table](https://artsexperiments.withgoogle.com/periodic-table/)
- **Element Data**: Compiled from [Periodic Table JSON](https://github.com/Bowserinator/Periodic-Table-JSON) and scientific sources
- **Technologies**: Built with Next.js, React, Three.js, MongoDB, NextAuth.js, and modern web technologies
- **Community**: Thanks to all contributors and users

## 📞 Support

Need help? Here are some resources:

- **Issues**: [GitHub Issues](https://github.com/your-username/reaction-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/reaction-hub/discussions)
- **Documentation**: Check [CLAUDE.md](./CLAUDE.md) and [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Next.js Help**: [Next.js Documentation](https://nextjs.org/docs)

---

**Made with ⚛️ chemistry and ❤️ by the Reaction Hub team**

*Explore the periodic table, build compounds, and learn chemistry in an interactive way!*
