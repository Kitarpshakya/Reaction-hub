import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import ElementModel from "@/lib/db/models/Element";

// GET element by symbol
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    await connectDB();

    const element = await ElementModel.findOne({
      symbol: { $regex: new RegExp(`^${symbol}$`, 'i') },
    }).lean();

    if (!element) {
      return NextResponse.json(
        {
          success: false,
          error: `Element with symbol "${symbol}" not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        element,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching element:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch element",
      },
      { status: 500 }
    );
  }
}
