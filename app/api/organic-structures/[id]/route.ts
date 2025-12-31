import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db/mongodb";
import OrganicStructureModel from "@/lib/db/models/OrganicStructure";
import mongoose from "mongoose";

// GET single organic structure by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid structure ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const structure = await OrganicStructureModel.findById(id).lean();

    if (!structure) {
      return NextResponse.json(
        {
          success: false,
          error: "Structure not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      structure: {
        ...structure,
        id: structure._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching organic structure:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch organic structure",
      },
      { status: 500 }
    );
  }
}

// PUT update organic structure by ID (requires authentication and ownership)
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

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid structure ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      iupacName,
      commonName,
      category,
      smiles,
      atoms,
      bonds,
      functionalGroups,
      molecularFormula,
      molecularWeight,
      renderData,
      isPublic,
      tags,
      logP,
      pKa,
    } = body;

    if (!name || !atoms || atoms.length === 0 || !bonds) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if structure exists and user owns it
    const existingStructure = await OrganicStructureModel.findById(id);

    if (!existingStructure) {
      return NextResponse.json(
        {
          success: false,
          error: "Structure not found",
        },
        { status: 404 }
      );
    }

    if (existingStructure.createdBy !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - You can only update your own structures",
        },
        { status: 403 }
      );
    }

    // Update the structure
    const updatedStructure = await OrganicStructureModel.findByIdAndUpdate(
      id,
      {
        name,
        iupacName: iupacName || null,
        commonName: commonName || null,
        category,
        smiles,
        atoms,
        bonds,
        functionalGroups: functionalGroups || [],
        molecularFormula,
        molecularWeight,
        renderData: renderData || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        tags: tags || [],
        logP: logP !== undefined ? logP : null,
        pKa: pKa !== undefined ? pKa : null,
      },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json(
      {
        success: true,
        structure: {
          ...updatedStructure,
          id: updatedStructure!._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating organic structure:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update organic structure",
      },
      { status: 500 }
    );
  }
}

// DELETE organic structure by ID (requires authentication and ownership)
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
          error: "Unauthorized - Please sign in to delete structures",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid structure ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if structure exists and user owns it
    const existingStructure = await OrganicStructureModel.findById(id);

    if (!existingStructure) {
      return NextResponse.json(
        {
          success: false,
          error: "Structure not found",
        },
        { status: 404 }
      );
    }

    if (existingStructure.createdBy !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - You can only delete your own structures",
        },
        { status: 403 }
      );
    }

    // Delete the structure
    await OrganicStructureModel.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Structure deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting organic structure:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete organic structure",
      },
      { status: 500 }
    );
  }
}
