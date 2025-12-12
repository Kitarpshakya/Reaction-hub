"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrganicTemplate } from "@/lib/types/organic";
import MoleculeViewer from "@/components/organic/MoleculeViewer";

export default function CreateOrganicStructurePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<OrganicTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OrganicTemplate | null>(null);
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/organic-chemistry/create");
    }
  }, [status, router]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/organic-structures/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleTemplateSelect = (template: OrganicTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
  };

  const handleCreate = async () => {
    if (!selectedTemplate) {
      setError("Please select a template");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }

    if (!session?.user) {
      setError("You must be signed in to create structures");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tagsArray = tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await fetch("/api/organic-structures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          commonName: selectedTemplate.commonName,
          category: selectedTemplate.category,
          smiles: selectedTemplate.smiles,
          molecularFormula: selectedTemplate.molecularFormula,
          molecularWeight: selectedTemplate.molecularWeight,
          atoms: selectedTemplate.atoms,
          bonds: selectedTemplate.bonds,
          functionalGroups: selectedTemplate.functionalGroups?.map(fg => ({ name: fg, position: [] })) || [],
          isTemplate: false,
          templateCategory: selectedTemplate.templateCategory,
          isPublic,
          tags: tagsArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/organic-chemistry/${data.structure.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create structure");
      }
    } catch (error) {
      console.error("Error creating structure:", error);
      setError("Failed to create structure");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/organic-chemistry"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Create Organic Structure</h1>
          <p className="text-white/60 text-lg">Select a template and customize your structure</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Template selection */}
          <div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Select Template</h2>
              <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {templates.map((template) => (
                  <motion.button
                    key={template.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTemplate?.name === template.name
                        ? "border-[#6C5CE7] bg-[#6C5CE7]/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <h3 className="text-white font-bold mb-1">{template.name}</h3>
                    <p className="text-white/60 text-sm mb-2">{template.molecularFormula}</p>
                    <p className="text-white/40 text-xs line-clamp-2">{template.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Preview and form */}
          <div className="space-y-6">
            {/* Preview */}
            {selectedTemplate && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
                <MoleculeViewer
                  atoms={selectedTemplate.atoms}
                  bonds={selectedTemplate.bonds}
                  width={450}
                  height={350}
                  showHydrogens={false}
                  scale={1.2}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <span className="text-white/40">Formula:</span>
                    <span className="text-white ml-2 font-mono">{selectedTemplate.molecularFormula}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Molecular Weight:</span>
                    <span className="text-white ml-2">{selectedTemplate.molecularWeight.toFixed(2)} g/mol</span>
                  </div>
                  <div>
                    <span className="text-white/40">Category:</span>
                    <span className="text-white ml-2 capitalize">{selectedTemplate.category.replace("-", " ")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Customize</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter structure name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]/50"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="organic, aromatic, template"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]/50"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 bg-white/5 border border-white/10 rounded cursor-pointer"
                  />
                  <label htmlFor="isPublic" className="text-white cursor-pointer">
                    Make this structure public
                  </label>
                </div>

                {error && (
                  <div className="px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={loading || !selectedTemplate}
                  className="w-full px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Structure"}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
