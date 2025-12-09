import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import ElementModel from "@/lib/db/models/Element";
import elementsData from "@/lib/data/elements.json";

// POST - Seed database with elements
export async function POST() {
  try {
    await connectDB();

    // Clear existing data
    await ElementModel.deleteMany({});

    // Insert new data
    const elements = await ElementModel.insertMany(elementsData);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully seeded ${elements.length} elements`,
        count: elements.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET - Check seed status
export async function GET() {
  try {
    await connectDB();

    const count = await ElementModel.countDocuments();

    return NextResponse.json(
      {
        success: true,
        message:
          count > 0
            ? `Database has ${count} elements`
            : "Database is empty. Send POST request to seed.",
        count,
        isSeed: count > 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking seed status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check database status",
      },
      { status: 500 }
    );
  }
}
