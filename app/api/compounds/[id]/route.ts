import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db/mongodb";
import CompoundModel from "@/lib/db/models/Compound";

// GET compound by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const compound = await CompoundModel.findById(id).lean();

    if (!compound) {
      return NextResponse.json(
        {
          success: false,
          error: `Compound with ID "${id}" not found`,
        },
        { status: 404 }
      );
    }

    // Transform _id to id for easier client-side usage
    const transformedCompound = {
      ...compound,
      id: compound._id.toString(),
    };

    return NextResponse.json(
      {
        success: true,
        compound: transformedCompound,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching compound:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch compound",
      },
      { status: 500 }
    );
  }
}

// PUT update compound (Phase 3)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
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

    // Find existing compound
    const existingCompound = await CompoundModel.findById(id);

    if (!existingCompound) {
      return NextResponse.json(
        {
          success: false,
          error: "Compound not found",
        },
        { status: 404 }
      );
    }

    // Update compound
    const updatedCompound = await CompoundModel.findByIdAndUpdate(
      id,
      {
        name,
        formula,
        description: description || null,
        molarMass: molarMass || 0,
        elements: elements.map((el: any) => ({
          elementId: el.elementId,
          symbol: el.symbol,
          count: el.count,
          position: el.position,
        })),
        bonds: bonds || [],
        externalFactors: externalFactors || {},
        canvasData: canvasData || null,
      },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        compound: updatedCompound,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating compound:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update compound",
      },
      { status: 500 }
    );
  }
}

// DELETE compound
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await connectDB();

    // Find existing compound
    const existingCompound = await CompoundModel.findById(id);

    if (!existingCompound) {
      return NextResponse.json(
        {
          success: false,
          error: "Compound not found",
        },
        { status: 404 }
      );
    }

    // Check if user owns the compound
    if (existingCompound.createdBy !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - You can only delete your own compounds",
        },
        { status: 403 }
      );
    }

    // Delete compound
    await CompoundModel.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Compound deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting compound:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete compound",
      },
      { status: 500 }
    );
  }
}
