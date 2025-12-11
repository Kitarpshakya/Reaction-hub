import Link from "next/link";
import { notFound } from "next/navigation";
import { Element } from "@/lib/types/element";
import ElementHero from "@/components/element-detail/ElementHero";
import PropertyGrid from "@/components/element-detail/PropertyGrid";
import IsotopesSection from "@/components/element-detail/IsotopesSection";
import DiscoverySection from "@/components/element-detail/DiscoverySection";
import BohrModel3D from "@/components/element-detail/BohrModel3D";

async function getElement(symbol: string): Promise<Element | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/elements/${symbol}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.element;
  } catch (error) {
    console.error("Error fetching element:", error);
    return null;
  }
}

async function getAllElements(): Promise<Element[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/elements`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.elements || [];
  } catch (error) {
    console.error("Error fetching elements:", error);
    return [];
  }
}

// Generate static params for all elements
export async function generateStaticParams() {
  try {
    const elements = await getAllElements();
    return elements.map((element) => ({
      symbol: element.symbol,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function ElementDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const element = await getElement(symbol);

  if (!element) {
    notFound();
  }

  const allElements = await getAllElements();
  const currentIndex = allElements.findIndex((el) => el.symbol === element.symbol);
  const prevElement = currentIndex > 0 ? allElements[currentIndex - 1] : null;
  const nextElement = currentIndex < allElements.length - 1 ? allElements[currentIndex + 1] : null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Link
            href="/periodic-table"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Table
          </Link>

          <div className="flex items-center gap-4">
            {prevElement && (
              <Link
                href={`/elements/${prevElement.symbol}`}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors text-sm"
              >
                ← {prevElement.symbol}
              </Link>
            )}
            {nextElement && (
              <Link
                href={`/elements/${nextElement.symbol}`}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors text-sm"
              >
                {nextElement.symbol} →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-7xl">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8">
          <ElementHero element={element} />
          <BohrModel3D element={element} />
        </div>

        {/* Properties Grid */}
        <PropertyGrid element={element} />

        {/* Discovery Info */}
        {(element.discoveredBy || element.yearDiscovered) && <DiscoverySection element={element} />}

        {/* Isotopes */}
        {element.isotopes && element.isotopes.length > 0 && <IsotopesSection isotopes={element.isotopes} />}

        {/* Summary */}
        <div className="mt-6 md:mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">About {element.name}</h2>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed">{element.summary}</p>
        </div>
      </main>
    </div>
  );
}
