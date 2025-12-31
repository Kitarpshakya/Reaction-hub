# Reaction Hub - Interactive Periodic Table & Compound Builder

A modern, interactive periodic table application with drag-and-drop compound builder and 3D visualizations. Features beautiful animations, real-time chemical validation, intelligent bonding, and detailed information about all 118 chemical elements.

![Reaction Hub](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Three.js](https://img.shields.io/badge/Three.js-3D-orange) ![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)

## ✨ Features

### 🔬 Interactive Periodic Table
- **Complete 118 Elements** - All elements from Hydrogen to Oganesson
- **Category Color Coding** - Visual distinction between 10 element categories
- **Smooth Animations** - Staggered entrance animations powered by Framer Motion
- **Responsive Grid** - 18-column CSS Grid layout adapts to all screen sizes
- **Quick Navigation** - Click any element to view detailed information

### ⚛️ 3D Element Visualization
- **3D Bohr Model** - Interactive rotating atomic models with realistic lighting
  - Physically accurate electron shells and nucleus
  - Glossy materials with clearcoat finish
  - Multiple light sources for depth (key, fill, rim lights)
  - Environment mapping for realistic reflections
- **Comprehensive Properties**:
  - Physical properties (melting point, boiling point, density, phase)
  - Chemical properties (electronegativity, ionization energy, oxidation states)
  - Electron configuration and shell distribution
  - Atomic structure (radius, mass, number)
  - Discovery history and interesting facts
  - Isotopes with abundance and stability data
- **Interactive Controls** - Drag to rotate, scroll to zoom, seamless element navigation

### 🧪 Advanced Compound Builder
- **Interactive Canvas** - Drag-and-drop compound creation system
  - Searchable element library with all 118 elements
  - Smart element sizing based on atomic mass
  - Auto-bonding when elements are close (120px threshold)
  - Click-to-bond system with duplicate prevention
  - Real-time bond visualization

- **Intelligent Chemistry**
  - **6 Bond Types**: Single, Double, Triple, Ionic, Covalent, Metallic
  - **Smart Suggestions**: O-O→double, N-N→triple, Metal+Nonmetal→ionic
  - **Valency Validation**: Real-time checking with visual feedback (🟢🟡🔴)
  - **Expanded Octets**: Sulfur (6 bonds), Phosphorus (5 bonds), Halogens (7 bonds)
  - **Chemical Formula**: IUPAC-compliant ordering
    - Ionic: Metal before nonmetal (NaCl, not ClNa)
    - Covalent: Electronegativity-based (SO₂, not O₂S)
    - Hydrides: NH₃, H₂O (special rules for hydrogen)
    - Organic: Hill system (CH₄, C₂H₆O)

- **Canvas Controls**
  - Element repositioning with dynamic bond updates
  - Collision detection and auto-spread
  - Zoom, pan, and canvas state persistence
  - External factors (temperature, pressure, catalyst, heat, light)
  - Auto-calculated molar mass

### 🎨 3D Compound Visualization
- **Interactive 3D Models** - WebGL-based molecular viewer
  - **Ball-and-Stick Mode**: Atoms separated, bonds visible
  - **Space-Filling Mode**: Overlapping atoms, realistic sizes
  - **CPK Color Scheme**: Standard atom coloring (C=dark gray, O=red, H=white, etc.)
  - **Multiple Bond Types**: Visual distinction for single, double, triple bonds
  - Toggle between visualization modes
  - VSEPR-based molecular geometry
  - Real-time rendering with smooth controls

### 🔐 Authentication & User Management
- **Google OAuth 2.0** - Secure sign-in with Google accounts
- **Account Selection** - Choose account on every sign-in
- **User Sessions** - Persistent authentication via NextAuth.js
- **Protected Routes** - Compound creation/editing requires authentication
- **Ownership Control** - Edit and delete only your own compounds

### ✅ Chemical Validation
- **Real-time Validation** - IUPAC-compliant compound checking
- **Polyatomic Ion Detection** - Recognizes sulfate, nitrate, phosphate, etc.
- **Charge Balance** - Validates ionic compound stoichiometry
- **Diatomic Molecules** - Special handling for H₂, O₂, N₂, etc.
- **Noble Gas Prevention** - Blocks unreactive element bonding
- **Valency Enforcement** - Prevents impossible bond configurations

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **Drag & Drop**: @dnd-kit/core
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js (Google OAuth)
- **State Management**: Zustand (compound canvas)
- **Deployment**: Vercel-ready

## 📋 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- Google Cloud Console account (for OAuth)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd reaction-hub

# Install dependencies
npm install

# Set up environment variables (see below)
# Create .env.local file

# Seed database
npm run dev
curl -X POST http://localhost:3000/api/elements/seed

# Open browser
open http://localhost:3000
```

### Environment Variables

Create `.env.local` in root:

```env
# MongoDB
MONGODB_URI="mongodb://localhost:27017/reaction-hub"
# OR MongoDB Atlas:
# MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/reaction-hub"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"  # Generate: openssl rand -base64 32

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Copy Client ID and Client Secret to `.env.local`

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

### Core Documentation
- **[CLAUDE.md](./CLAUDE.md)** - Project architecture and development guide
- **[docs/README.md](./docs/README.md)** - Documentation index

### Feature Specifications
- **[Authentication](./docs/features/AUTH.md)** - OAuth setup and session management
- **[Periodic Table](./docs/features/PERIODIC_TABLE.md)** - Element grid and detail pages
- **[Compound Builder](./docs/features/COMPOUND.md)** - Canvas system and bonding
- **[Organic Chemistry](./docs/features/ORGANIC.md)** - Organic molecule builder

### User Guides
- **[Compound Bonding Guide](./docs/guides/COMPOUND_BONDING_GUIDE.md)** - Complete bonding system reference

### API Reference
- **[API Documentation](./docs/API.md)** - Complete endpoint reference

## 🔌 API Endpoints

### Elements
```
GET  /api/elements          # All 118 elements
GET  /api/elements/[symbol] # Single element (e.g., /api/elements/O)
POST /api/elements/seed     # Seed database
```

### Compounds
```
GET    /api/compounds       # All compounds (optional ?userId filter)
POST   /api/compounds       # Create (auth required)
GET    /api/compounds/[id]  # Single compound
PUT    /api/compounds/[id]  # Update (owner only)
DELETE /api/compounds/[id]  # Delete (owner only)
```

### Authentication
```
GET /api/auth/signin        # Sign-in page
GET /api/auth/signout       # Sign-out
GET /api/auth/session       # Current session
```

## 🧪 Chemical Intelligence

### Bond Type Determination
- **Ionic**: Metal + Nonmetal (electronegativity diff > 1.7)
- **Metallic**: Metal + Metal
- **Double/Triple**: O-O, N-N, C-C based on common patterns
- **Single**: Default for covalent bonds

### Valency Rules (Updated)
| Element | Max Bonds | Examples |
|---------|-----------|----------|
| H | 1 | H₂, H₂O, NH₃ |
| C | 4 | CH₄, CO₂ |
| N | 3-5 | NH₃, HNO₃ |
| O | 2 | H₂O, CO₂ |
| S | 2-6 | H₂S, SO₂, H₂SO₄ |
| P | 3-5 | PH₃, H₃PO₄ |
| F, Cl, Br, I | 1-7 | HCl, ClO₄⁻ |
| Metals | Varies | Na: 1, Ca: 2, Fe: 3 |

### Validation States
- 🟢 **Valid** - Chemically stable, common compound
- 🟡 **Warning** - Rare but possible (e.g., SF₆, hypervalent)
- 🔴 **Invalid** - Valency exceeded, impossible combination

## 🎮 Usage

### Creating Compounds
1. **Sign In** with Google
2. Navigate to **Compounds** → **Create Compound**
3. **Drag elements** from panel onto canvas
4. **Create bonds**:
   - Auto-bond: Drag elements close together
   - Manual: Click element 1, then element 2
5. **Adjust**: Reposition elements, change bond types
6. **Validate**: Check real-time chemical validation
7. **Save**: Enter name and description

### Viewing 3D Models
- **Elements**: Click any element → See 3D Bohr model
- **Compounds**: Open compound → Toggle 2D/3D view
- **Controls**:
  - Drag to rotate
  - Scroll to zoom
  - Right-click to pan (compounds only)
  - Toggle "Show Bonds" (compounds only)

## 📁 Project Structure

```
reaction-hub/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── periodic-table/      # Periodic table grid
│   ├── elements/[symbol]/   # Element detail pages
│   ├── compounds/           # Compound pages
│   │   ├── create/         # Compound builder
│   │   └── [id]/           # Detail & edit
│   └── api/                # API routes
│       ├── auth/           # NextAuth endpoints
│       ├── elements/       # Elements API
│       └── compounds/      # Compounds API
│
├── components/              # React components
│   ├── periodic-table/     # Grid, cards, legend
│   ├── element-detail/     # Bohr models, properties
│   ├── compounds/          # Builder, canvas, visualization
│   │   ├── create/         # Builder components
│   │   └── visualization3d/# 3D rendering
│   └── auth/               # Auth components
│
├── lib/                    # Core libraries
│   ├── db/                 # MongoDB & models
│   ├── stores/             # Zustand stores
│   ├── utils/              # Helper functions
│   │   ├── chemistry-helpers.ts      # Bond logic
│   │   ├── chemical-validation.ts    # Validation
│   │   ├── molecular-geometry.ts     # VSEPR
│   │   └── organic-helpers.ts        # 3D rendering
│   └── types/              # TypeScript types
│
├── docs/                   # Documentation
│   ├── features/           # Feature specs
│   ├── guides/             # User guides
│   └── archive/            # Implementation logs
│
└── scripts/seed.js         # Database seeding
```

## 🎨 Element Categories

| Category | Color | Elements |
|----------|-------|----------|
| **Nonmetal** | Teal `#4ECDC4` | H, C, N, O, P, S |
| **Noble Gas** | Mint `#95E1D3` | He, Ne, Ar, Kr, Xe, Rn |
| **Alkali Metal** | Coral `#F38181` | Li, Na, K, Rb, Cs, Fr |
| **Alkaline Earth** | Yellow `#FDCB6E` | Be, Mg, Ca, Sr, Ba, Ra |
| **Transition Metal** | Purple `#A29BFE` | Fe, Cu, Ag, Au, Zn |
| **Post-Transition** | Blue `#74B9FF` | Al, Ga, In, Sn, Pb |
| **Metalloid** | Pink `#FD79A8` | B, Si, Ge, As, Sb, Te |
| **Halogen** | Red `#FF7675` | F, Cl, Br, I, At |
| **Lanthanide** | Lt. Yellow `#FFEAA7` | La-Lu |
| **Actinide** | Gray `#DFE6E9` | Ac-Lr |

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git add . && git commit -m "Deploy" && git push

# 2. Import to Vercel
# - Go to vercel.com
# - Import GitHub repository
# - Add environment variables (see .env.local)

# 3. Update Google OAuth
# Add production redirect:
# https://your-app.vercel.app/api/auth/callback/google

# 4. Seed production database
curl -X POST https://your-app.vercel.app/api/elements/seed
```

## 🐛 Troubleshooting

### Elements Not Showing
```bash
# Seed the database
curl -X POST http://localhost:3000/api/elements/seed
```

### MongoDB Connection Error
- Check `MONGODB_URI` in `.env.local`
- For Atlas: Whitelist your IP in Network Access
- Ensure MongoDB service is running (local)

### OAuth Not Working
- Verify all auth variables in `.env.local`
- Check redirect URI matches exactly in Google Console
- Clear cookies and try again

### 3D Models Not Loading
- Check browser supports WebGL
- Clear `.next` cache: `rm -rf .next && npm run dev`
- Try Chrome or Firefox

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Enhanced chemical validation
- More bond types and visualization modes
- Performance optimizations
- Additional element data
- Unit tests

**Process:**
1. Fork repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/name`
5. Open Pull Request

## 📄 License

MIT License - Free to use for learning and personal projects

## 🙏 Acknowledgments

- **Design Inspiration**: [Google Arts Experiments](https://artsexperiments.withgoogle.com/periodic-table/)
- **Element Data**: [Periodic Table JSON](https://github.com/Bowserinator/Periodic-Table-JSON)
- **Technologies**: Next.js, React, Three.js, MongoDB, NextAuth.js
- **Community**: Thanks to all contributors

---

**Made with ⚛️ chemistry and ❤️**

*Explore the periodic table, build compounds, and learn chemistry interactively!*

📚 **[Read Full Documentation](./docs/README.md)** | 🔬 **[View Demo](https://your-app.vercel.app)** | 🐛 **[Report Issues](https://github.com/your-username/reaction-hub/issues)**
