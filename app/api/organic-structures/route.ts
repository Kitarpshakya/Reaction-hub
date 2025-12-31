import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db/mongodb";
import OrganicStructureModel from "@/lib/db/models/OrganicStructure";

// GET all organic structures with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;

    // Build filter from query params
    const filter: any = {};

    const category = searchParams.get("category");
    if (category) {
      filter.category = category;
    }

    const search = searchParams.get("search");
    if (search) {
      filter.$text = { $search: search };
    }

    const functionalGroup = searchParams.get("functionalGroup");
    if (functionalGroup) {
      filter["functionalGroups.name"] = functionalGroup;
    }

    const minWeight = searchParams.get("minWeight");
    if (minWeight) {
      filter.molecularWeight = { ...filter.molecularWeight, $gte: parseFloat(minWeight) };
    }

    const maxWeight = searchParams.get("maxWeight");
    if (maxWeight) {
      filter.molecularWeight = { ...filter.molecularWeight, $lte: parseFloat(maxWeight) };
    }

    const createdBy = searchParams.get("createdBy");
    if (createdBy) {
      filter.createdBy = createdBy;
    }

    const isPublic = searchParams.get("isPublic");
    if (isPublic !== null) {
      filter.isPublic = isPublic === "true";
    }

    const isTemplate = searchParams.get("isTemplate");
    if (isTemplate !== null) {
      filter.isTemplate = isTemplate === "true";
    }

    const templateCategory = searchParams.get("templateCategory");
    if (templateCategory) {
      filter.templateCategory = templateCategory;
    }

    const tag = searchParams.get("tag");
    if (tag) {
      filter.tags = tag;
    }

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Fetch structures
    const structures = await OrganicStructureModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await OrganicStructureModel.countDocuments(filter);

    // Transform _id to id
    const transformedStructures = structures.map((structure: any) => ({
      ...structure,
      id: structure._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      count: transformedStructures.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      structures: transformedStructures,
    });
  } catch (error) {
    console.error("Error fetching organic structures:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch organic structures",
      },
      { status: 500 }
    );
  }
}

// POST create new organic structure (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please sign in to create structures",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      iupacName,
      commonName,
      category,
      smiles,
      molFile,
      inchi,
      atoms,
      bonds,
      functionalGroups,
      molecularFormula,
      molecularWeight,
      logP,
      pKa,
      isTemplate,
      templateCategory,
      renderData,
      isPublic,
      tags,
    } = body;

    // Validate required fields
    if (!name || !category || !smiles || !molecularFormula || !molecularWeight) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, category, smiles, molecularFormula, molecularWeight",
        },
        { status: 400 }
      );
    }

    if (!atoms || atoms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Structure must contain at least one atom",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Create organic structure
    const structure = await OrganicStructureModel.create({
      name,
      iupacName: iupacName || null,
      commonName: commonName || null,
      category,
      smiles,
      molFile: molFile || null,
      inchi: inchi || null,
      atoms: atoms || [],
      bonds: bonds || [],
      functionalGroups: functionalGroups || [],
      molecularFormula,
      molecularWeight,
      logP: logP || null,
      pKa: pKa || null,
      isTemplate: isTemplate || false,
      templateCategory: templateCategory || null,
      renderData: renderData || {
        bondLength: 50,
        angle: 120,
        showHydrogens: false,
        colorScheme: "cpk",
      },
      createdBy: session.user.id,
      createdByName: session.user.name || "Unknown",
      isPublic: isPublic !== undefined ? isPublic : true,
      tags: tags || [],
    });

    return NextResponse.json(
      {
        success: true,
        structure: {
          ...structure.toJSON(),
          id: structure._id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating organic structure:", error);

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
        error: "Failed to create organic structure",
      },
      { status: 500 }
    );
  }
}
