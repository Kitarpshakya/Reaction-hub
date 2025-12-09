import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db/mongodb";
import CompoundModel from "@/lib/db/models/Compound";
import ElementModel from "@/lib/db/models/Element";

// GET all compounds (optionally filter by userId)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    // Build query filter
    const filter = userId ? { createdBy: userId } : {};

    const compounds = await CompoundModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Transform _id to id for easier client-side usage
    const transformedCompounds = compounds.map((compound: any) => ({
      ...compound,
      id: compound._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      count: transformedCompounds.length,
      compounds: transformedCompounds,
    });
  } catch (error) {
    console.error("Error fetching compounds:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch compounds",
      },
      { status: 500 }
    );
  }
}

// POST create compound (Phase 3 - with bonds, external factors, canvas data)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      formula,
      description,
      elements,
      molarMass,
      bonds,
      externalFactors,
      canvasData,
    } = body;

    if (!name || !formula || !elements || elements.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Create compound with Phase 3 data
    const compound = await CompoundModel.create({
      name,
      formula,
      description: description || null,
      molarMass: molarMass || 0,
      createdBy: session.user.id,
      createdByName: session.user.name || "Unknown",
      elements: elements.map((el: any) => ({
        elementId: el.elementId,
        symbol: el.symbol,
        count: el.count,
        position: el.position,
      })),
      bonds: bonds || [],
      externalFactors: externalFactors || {},
      canvasData: canvasData || null,
    });

    return NextResponse.json(
      {
        success: true,
        compound,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating compound:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create compound",
      },
      { status: 500 }
    );
  }
}
