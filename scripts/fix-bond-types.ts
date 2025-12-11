/**
 * Migration script to fix bond types in existing compounds
 * Run with: npx tsx scripts/fix-bond-types.ts
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface Element {
  symbol: string;
  electronegativity?: number;
  category: string;
  atomicMass: number;
}

interface Bond {
  id: string;
  fromElementId: string;
  toElementId: string;
  bondType: 'single' | 'double' | 'triple' | 'ionic' | 'covalent' | 'metallic';
}

interface CompoundElement {
  elementId: string;
  symbol: string;
  count: number;
}

interface Compound {
  _id: any;
  name: string;
  formula: string;
  elements: CompoundElement[];
  bonds: Bond[];
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Element data needed for bond type determination
const ELEMENT_DATA: Record<string, { electronegativity: number; category: string }> = {
  H: { electronegativity: 2.20, category: 'nonmetal' },
  O: { electronegativity: 3.44, category: 'nonmetal' },
  N: { electronegativity: 3.04, category: 'nonmetal' },
  C: { electronegativity: 2.55, category: 'nonmetal' },
  F: { electronegativity: 3.98, category: 'halogen' },
  Cl: { electronegativity: 3.16, category: 'halogen' },
  Br: { electronegativity: 2.96, category: 'halogen' },
  I: { electronegativity: 2.66, category: 'halogen' },
  S: { electronegativity: 2.58, category: 'nonmetal' },
  P: { electronegativity: 2.19, category: 'nonmetal' },
  Na: { electronegativity: 0.93, category: 'alkali-metal' },
  K: { electronegativity: 0.82, category: 'alkali-metal' },
  Ca: { electronegativity: 1.00, category: 'alkaline-earth-metal' },
  Mg: { electronegativity: 1.31, category: 'alkaline-earth-metal' },
  Al: { electronegativity: 1.61, category: 'post-transition-metal' },
  Fe: { electronegativity: 1.83, category: 'transition-metal' },
  Cu: { electronegativity: 1.90, category: 'transition-metal' },
};

function isMetal(category: string): boolean {
  const metalCategories = [
    'alkali-metal',
    'alkaline-earth-metal',
    'transition-metal',
    'post-transition-metal',
    'lanthanide',
    'actinide',
  ];
  return metalCategories.includes(category);
}

function estimateBondOrder(symbol1: string, symbol2: string): number {
  const tripleBondPairs = [
    ['N', 'N'], // N≡N
    ['C', 'N'], // C≡N
    ['C', 'C'], // C≡C (alkynes)
  ];

  const doubleBondPairs = [
    ['O', 'O'], // O=O
    ['C', 'O'], // C=O
    ['C', 'C'], // C=C (alkenes)
    ['S', 'O'], // S=O
    ['N', 'O'], // N=O
  ];

  for (const [a, b] of tripleBondPairs) {
    if ((symbol1 === a && symbol2 === b) || (symbol1 === b && symbol2 === a)) {
      return 3;
    }
  }

  for (const [a, b] of doubleBondPairs) {
    if ((symbol1 === a && symbol2 === b) || (symbol1 === b && symbol2 === a)) {
      return 2;
    }
  }

  return 1;
}

function determineBondType(symbol1: string, symbol2: string): Bond['bondType'] {
  const el1 = ELEMENT_DATA[symbol1];
  const el2 = ELEMENT_DATA[symbol2];

  if (!el1 || !el2) {
    console.warn(`⚠️  Unknown element: ${symbol1} or ${symbol2}, defaulting to single`);
    return 'single';
  }

  const enDiff = Math.abs(el1.electronegativity - el2.electronegativity);
  const isMetal1 = isMetal(el1.category);
  const isMetal2 = isMetal(el2.category);

  // Metallic bond: both are metals
  if (isMetal1 && isMetal2) {
    return 'metallic';
  }

  // Ionic bond: large electronegativity difference (> 1.7)
  if (enDiff > 1.7) {
    return 'ionic';
  }

  // Covalent bonds: check for multiple bonds
  const bondOrder = estimateBondOrder(symbol1, symbol2);

  if (bondOrder === 3) return 'triple';
  if (bondOrder === 2) return 'double';
  return 'single';
}

async function fixBondTypes() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const compoundsCollection = db.collection('compounds');
    const elementsCollection = db.collection('elements');

    // Get all elements for lookup
    const elements = await elementsCollection.find({}).toArray();
    const elementMap = new Map(elements.map((el: any) => [el.symbol, el]));

    console.log('📊 Fetching compounds...');
    const compounds = await compoundsCollection.find({}).toArray() as any[];

    console.log(`Found ${compounds.length} compounds\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const compound of compounds) {
      try {
        if (!compound.bonds || compound.bonds.length === 0) {
          console.log(`⏭️  Skipping "${compound.name}" (no bonds)`);
          continue;
        }

        let hasChanges = false;
        const updatedBonds = compound.bonds.map((bond: Bond) => {
          // Find the two elements involved in this bond
          const fromEl = compound.elements.find((e: CompoundElement) => e.elementId === bond.fromElementId);
          const toEl = compound.elements.find((e: CompoundElement) => e.elementId === bond.toElementId);

          if (!fromEl || !toEl) {
            console.warn(`⚠️  Bond in "${compound.name}" has invalid element IDs`);
            return bond;
          }

          const correctBondType = determineBondType(fromEl.symbol, toEl.symbol);

          if (bond.bondType !== correctBondType) {
            console.log(
              `  🔧 Fixing bond in "${compound.name}": ${fromEl.symbol}-${toEl.symbol} ` +
              `from "${bond.bondType}" to "${correctBondType}"`
            );
            hasChanges = true;
            return { ...bond, bondType: correctBondType };
          }

          return bond;
        });

        if (hasChanges) {
          await compoundsCollection.updateOne(
            { _id: compound._id },
            { $set: { bonds: updatedBonds } }
          );
          updatedCount++;
          console.log(`✅ Updated "${compound.name}"\n`);
        } else {
          console.log(`✓  "${compound.name}" already has correct bond types\n`);
        }
      } catch (error) {
        console.error(`❌ Error processing "${compound.name}":`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Summary:');
    console.log(`   Total compounds: ${compounds.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
fixBondTypes()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
