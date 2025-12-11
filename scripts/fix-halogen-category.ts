/**
 * Migration script to fix halogen element categories
 * Run with: npx tsx scripts/fix-halogen-category.ts
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Halogen elements (Group 17)
const HALOGENS = ['F', 'Cl', 'Br', 'I', 'At', 'Ts'];

async function fixHalogenCategories() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const elementsCollection = db.collection('elements');

    console.log('📊 Updating halogen element categories...');

    const result = await elementsCollection.updateMany(
      { symbol: { $in: HALOGENS } },
      { $set: { category: 'halogen' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} elements`);

    // Verify the changes
    console.log('\n🔍 Verifying halogen elements:');
    const halogens = await elementsCollection
      .find({ symbol: { $in: HALOGENS } })
      .project({ symbol: 1, name: 1, category: 1 })
      .toArray();

    halogens.forEach((el: any) => {
      const status = el.category === 'halogen' ? '✅' : '❌';
      console.log(`${status} ${el.symbol} (${el.name}): category = '${el.category}'`);
    });

    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixHalogenCategories();
