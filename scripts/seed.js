/**
 * Database Seeding Script
 *
 * This script seeds the MongoDB database with all 118 chemical elements.
 * Run with: node scripts/seed.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Element Schema (must match the Mongoose model)
const IsotopeSchema = new mongoose.Schema({
  massNumber: { type: Number, required: true },
  symbol: { type: String, required: true },
  abundance: { type: Number, default: null },
  halfLife: { type: String, default: null },
  isStable: { type: Boolean, required: true },
});

const ElementSchema = new mongoose.Schema(
  {
    atomicNumber: { type: Number, required: true, unique: true },
    symbol: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    atomicMass: { type: Number, required: true },
    category: { type: String, required: true },
    group: { type: Number, default: null },
    period: { type: Number, required: true },
    block: { type: String, required: true },
    electronConfiguration: { type: String, required: true },
    electronsPerShell: { type: [Number], required: true },
    phase: { type: String, required: true },
    meltingPoint: { type: Number, default: null },
    boilingPoint: { type: Number, default: null },
    density: { type: Number, default: null },
    electronegativity: { type: Number, default: null },
    atomicRadius: { type: Number, default: null },
    ionizationEnergy: { type: Number, default: null },
    oxidationStates: { type: [Number], default: [] },
    discoveredBy: { type: String, default: null },
    yearDiscovered: { type: Number, default: null },
    isRadioactive: { type: Boolean, required: true },
    halfLife: { type: String, default: null },
    color: { type: String, required: true },
    cpkColor: { type: String, default: null },
    summary: { type: String, required: true },
    gridRow: { type: Number, required: true },
    gridColumn: { type: Number, required: true },
    isotopes: { type: [IsotopeSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

const Element = mongoose.models.Element || mongoose.model('Element', ElementSchema);

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Load elements data
    const elementsPath = path.join(__dirname, '..', 'lib', 'data', 'elements.json');

    if (!fs.existsSync(elementsPath)) {
      console.error('❌ Error: elements.json not found at', elementsPath);
      process.exit(1);
    }

    const elementsData = JSON.parse(fs.readFileSync(elementsPath, 'utf-8'));
    console.log(`📦 Loaded ${elementsData.length} elements from elements.json`);

    // Clear existing data
    console.log('🗑️  Clearing existing elements...');
    await Element.deleteMany({});
    console.log('✅ Cleared existing elements');

    // Insert new data
    console.log('💾 Inserting elements...');
    const inserted = await Element.insertMany(elementsData);
    console.log(`✅ Successfully seeded ${inserted.length} elements`);

    // Display some stats
    const count = await Element.countDocuments();
    console.log(`\n📊 Database Statistics:`);
    console.log(`   Total Elements: ${count}`);

    const categories = await Element.distinct('category');
    console.log(`   Categories: ${categories.length}`);
    categories.forEach(category => {
      console.log(`      - ${category}`);
    });

    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
