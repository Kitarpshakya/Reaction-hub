import { NextRequest, NextResponse } from "next/server";
import { loadOrganicTemplates, getTemplatesByCategory, getTemplatesByTemplateCategory } from "@/lib/utils/organic-helpers";

// GET all organic chemistry templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const category = searchParams.get("category");
    const templateCategory = searchParams.get("templateCategory");

    let templates;

    if (category) {
      templates = getTemplatesByCategory(category);
    } else if (templateCategory) {
      templates = getTemplatesByTemplateCategory(templateCategory);
    } else {
      templates = loadOrganicTemplates();
    }

    return NextResponse.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error) {
    console.error("Error fetching organic templates:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch organic templates",
      },
      { status: 500 }
    );
  }
}
