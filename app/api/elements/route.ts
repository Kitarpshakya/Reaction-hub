import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import ElementModel from "@/lib/db/models/Element";

// GET all elements
export async function GET() {
  try {
    await connectDB();

    const elements = await ElementModel.find({})
      .select(
        "atomicNumber symbol name atomicMass category color gridRow gridColumn"
      )
      .sort({ atomicNumber: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: elements.length,
        elements,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching elements:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch elements",
      },
      { status: 500 }
    );
  }
}
