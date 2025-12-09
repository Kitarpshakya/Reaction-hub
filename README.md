# Reaction Hub - Interactive Periodic Table

A modern, interactive periodic table application built with Next.js 15, featuring beautiful animations, 3D Bohr model visualizations, and detailed information about all 118 chemical elements.

![Reaction Hub](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Three.js](https://img.shields.io/badge/Three.js-3D-orange)

## ✨ Features

- **Interactive Periodic Table Grid** - Click any element to explore
- **3D Bohr Model Visualization** - Rotating atomic models with electron shells
- **Smooth Animations** - Powered by Framer Motion
- **Detailed Element Information**:
  - Physical and chemical properties
  - Electron configuration
  - Isotopes with abundance and half-life
  - Discovery history
  - And much more!
- **Responsive Design** - Works on all devices
- **Category Color Coding** - Visual distinction between element types
- **Navigation** - Easy browsing between elements

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **Database**: MongoDB (with Mongoose)
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or MongoDB Atlas free tier)
- npm or yarn package manager

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
# Make sure MongoDB is running locally
# Default connection: mongodb://localhost:27017/reaction-hub
```

**Option B: MongoDB Atlas (Free)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Get your connection string

### 4. Configure Environment Variables

Update the `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI="mongodb://localhost:27017/reaction-hub"
# OR for MongoDB Atlas:
# MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/reaction-hub?retryWrites=true&w=majority"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Seed the Database

Start the development server first:

```bash
npm run dev
```

Then seed the database with element data:

**Option A: Using curl**
```bash
curl -X POST http://localhost:3000/api/elements/seed
```

**Option B: Using browser**
Open your browser and visit:
```
http://localhost:3000/api/elements/seed
```

You should see a success message indicating the database has been seeded with elements.

### 6. View the Application

Open [http://localhost:3000](http://localhost:3000) in your browser to see the periodic table!

## 📁 Project Structure

```
reaction-hub/
├── app/
│   ├── page.tsx                          # Home page (Periodic Table)
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Global styles
│   ├── elements/[symbol]/page.tsx        # Element detail pages
│   └── api/
│       └── elements/
│           ├── route.ts                  # GET all elements
│           ├── [symbol]/route.ts         # GET element by symbol
│           └── seed/route.ts             # POST seed database
│
├── components/
│   ├── home/
│   │   ├── PeriodicTableGrid.tsx        # Main table grid
│   │   ├── ElementCard.tsx              # Individual element card
│   │   └── TableLegend.tsx              # Category legend
│   └── element-detail/
│       ├── ElementHero.tsx              # Element header
│       ├── BohrModel3D.tsx              # 3D atomic model
│       ├── PropertyGrid.tsx             # Properties display
│       ├── IsotopesSection.tsx          # Isotopes info
│       └── DiscoverySection.tsx         # Discovery info
│
├── lib/
│   ├── db/
│   │   ├── mongodb.ts                   # MongoDB connection
│   │   └── models/Element.ts            # Element schema
│   ├── types/element.ts                 # TypeScript types
│   └── data/elements.json               # Element data (18 samples)
│
├── claude.md                             # Project documentation
└── README.md                             # This file
```

## 🎨 Element Categories & Colors

The periodic table uses distinct colors for each element category:

- **Nonmetal** - Teal (#4ECDC4)
- **Noble Gas** - Mint (#95E1D3)
- **Alkali Metal** - Coral (#F38181)
- **Alkaline Earth Metal** - Yellow (#FDCB6E)
- **Transition Metal** - Purple (#A29BFE)
- **Post-Transition Metal** - Blue (#74B9FF)
- **Metalloid** - Pink (#FD79A8)
- **Halogen** - Red (#FF7675)
- **Lanthanide** - Light Yellow (#FFEAA7)
- **Actinide** - Gray (#DFE6E9)
- **Unknown** - Light Gray (#B2BEC3)

## 🔌 API Endpoints

### GET /api/elements
Fetch all elements (simplified data for grid display)

**Response:**
```json
{
  "success": true,
  "count": 18,
  "elements": [...]
}
```

### GET /api/elements/[symbol]
Fetch detailed information for a specific element

**Example:** `/api/elements/H` or `/api/elements/Au`

**Response:**
```json
{
  "success": true,
  "element": {
    "atomicNumber": 1,
    "symbol": "H",
    "name": "Hydrogen",
    ...
  }
}
```

### POST /api/elements/seed
Seed the database with element data

**Response:**
```json
{
  "success": true,
  "message": "Successfully seeded 18 elements",
  "count": 18
}
```

## 🎯 Current Implementation Status

✅ **Completed:**
- Home page with interactive periodic table grid
- 18 sample elements from different categories
- Element detail pages with full information
- 3D Bohr model with rotating electrons
- Smooth animations and hover effects
- Responsive design
- MongoDB integration
- API routes

🔄 **Next Steps (Optional):**
- Add remaining 100 elements to complete the periodic table
- Implement search functionality
- Add element comparison feature
- Add dark/light mode toggle
- Add more isotope data
- Implement element filtering by category
- Add quiz mode

## 📚 Adding More Elements

The current implementation includes 18 sample elements. To add more:

1. Edit `lib/data/elements.json`
2. Add element objects following the existing schema
3. Ensure each element has:
   - Proper grid position (`gridRow`, `gridColumn`)
   - Category-specific color
   - Complete property data
4. Re-seed the database:
   ```bash
   curl -X POST http://localhost:3000/api/elements/seed
   ```

## 🎮 Usage

### Home Page
- Hover over any element card to see animation
- Click an element to view detailed information
- Scroll through the legend to understand categories

### Element Detail Page
- Use **← Back to Table** to return to home
- Use **← / →** buttons to navigate between elements
- Interact with the 3D model:
  - **Drag** to rotate
  - **Scroll** to zoom in/out
  - Model auto-rotates by default

## 🐛 Troubleshooting

### Database connection error
- Ensure MongoDB is running
- Check your `MONGODB_URI` in `.env.local`
- For MongoDB Atlas, ensure your IP is whitelisted

### Elements not showing
- Make sure you've seeded the database
- Check browser console for errors
- Verify API endpoints are accessible

### 3D model not loading
- Check browser console for Three.js errors
- Ensure `@react-three/fiber` and `@react-three/drei` are installed
- Try a different browser (Chrome/Firefox recommended)

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `NEXT_PUBLIC_APP_URL` - Your deployed URL
5. Deploy!

After deployment, remember to seed the database:
```bash
curl -X POST https://your-app.vercel.app/api/elements/seed
```

## 📖 Documentation

For detailed architectural information, see [`claude.md`](./claude.md)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add more element data
- Improve 3D visualizations
- Add new features
- Fix bugs
- Improve documentation

## 📄 License

MIT License - Feel free to use this project for learning and development.

## 🙏 Acknowledgments

- Design inspired by [Google Arts Experiments Periodic Table](https://artsexperiments.withgoogle.com/periodic-table/)
- Element data compiled from various scientific sources
- Built with Next.js, React, Three.js, and modern web technologies

---

**Made with ⚛️ by the Reaction Hub team**

Need help? Check out the [Next.js documentation](https://nextjs.org/docs) or open an issue!
