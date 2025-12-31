"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useModal } from "@/lib/contexts/ModalContext";
import {
  MoleculeGraph,
  updateImplicitHydrogens,
  updateHybridization,
  validateValence,
} from "@/lib/utils/organic-graph";
import { TEMPLATE_CATALOG, createTemplate, TemplateMetadata } from "@/lib/utils/organic-templates";
import {
  computeFormula,
  computeMolecularWeight,
  detectFunctionalGroups,
  countTotalAtoms,
  countCarbonAtoms,
  computeIUPACName,
} from "@/lib/utils/organic-validation";
import {
  extendChain,
  shortenChain,
  unsaturateBond,
  saturateBond,
  branchCarbon,
  attachSubstituent,
  cyclize,
  removeSubstituent,
  MutationResult,
} from "@/lib/utils/organic-mutations";

// Define OrganicStructure interface (minimal version for display)
interface OrganicStructure {
  carbonGraph: MoleculeGraph;
  derived: {
    molecularFormula: string;
    molecularWeight: number;
    totalAtoms: number;
    carbonCount: number;
    iupacName: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export default function EditOrganicStructurePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { showAlert, showError, showWarning } = useModal();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank-canvas");
  const [graph, setGraph] = useState<MoleculeGraph | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedBondId, setSelectedBondId] = useState<string | null>(null);
  const [cyclizeMode, setCyclizeMode] = useState(false);
  const [cyclizeFirstNode, setCyclizeFirstNode] = useState<string | null>(null);
  const [chainLength, setChainLength] = useState(4);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [structureName, setStructureName] = useState("");
  const [structureDescription, setStructureDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [structureId, setStructureId] = useState<string>("");
  const [originalStructure, setOriginalStructure] = useState<any>(null);
  const [originalGraph, setOriginalGraph] = useState<MoleculeGraph | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  // Fetch existing structure data
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/organic-chemistry/edit/${params.id}`);
      return;
    }

    if (status === "authenticated" && params.id) {
      fetchStructure(params.id as string);
    }
  }, [status, params.id, router]);

  const fetchStructure = async (id: string) => {
    try {
      const res = await fetch(`/api/organic-structures/${id}`);
      if (res.ok) {
        const data = await res.json();
        const structure = data.structure;

        // Check if user is the owner
        if (session?.user?.id !== structure.createdBy) {
          showError("You don't have permission to edit this structure");
          router.push(`/organic-chemistry/${id}`);
          return;
        }

        setOriginalStructure(structure);
        setStructureId(id);
        setStructureName(structure.name);
        setStructureDescription(structure.commonName || "");

        // Reconstruct graph from atoms and bonds
        const reconstructedGraph: MoleculeGraph = {
          nodes: structure.atoms.map((atom: any) => ({
            id: atom.id,
            element: atom.element,
            position: { x: atom.position.x, y: atom.position.y },
            hybridization: atom.hybridization || "sp3",
            implicitHydrogens: 0,
          })),
          edges: structure.bonds.map((bond: any) => ({
            id: bond.id,
            from: bond.from,
            to: bond.to,
            bondOrder: bond.type === "triple" ? 3 : bond.type === "double" ? 2 : 1,
            bondType: bond.type === "aromatic" ? "aromatic" : "sigma",
          })),
        };

        // Recalculate implicit hydrogens
        updateImplicitHydrogens(reconstructedGraph);
        updateHybridization(reconstructedGraph);

        setGraph(reconstructedGraph);
        setOriginalGraph(JSON.parse(JSON.stringify(reconstructedGraph))); // Deep copy for reset
        setIsLoading(false);
      } else {
        showError("Structure not found");
        router.push("/organic-chemistry");
      }
    } catch (error) {
      console.error("Error fetching structure:", error);
      showError("Failed to load structure");
      router.push("/organic-chemistry");
    }
  };

  const loadTemplate = useCallback(
    (templateId: string, length?: number, skipWarning = false) => {
      // Check if canvas has meaningful content
      const hasContent = graph && graph.nodes.length > 1;

      if (!skipWarning && hasContent) {
        const template = TEMPLATE_CATALOG.find((t) => t.type === templateId);
        const templateName = template?.name || "template";

        showWarning(
          `Loading "${templateName}" will clear all current work on the canvas. Do you want to continue?`,
          () => {
            loadTemplate(templateId, length, true);
          },
          "Clear Canvas",
          "Load Template"
        );
        return;
      }

      const template = TEMPLATE_CATALOG.find((t) => t.type === templateId);
      if (!template) return;

      const params = { chainLength: length || chainLength };
      let initialGraph = createTemplate(template.type, params);

      setGraph(initialGraph);
      setSelectedTemplate(templateId);
      setSelectedNodeId(null);
      setSelectedBondId(null);
      setCyclizeMode(false);
      setDraggingNodeId(null);
      setDragStart(null);
      setHasUnsavedChanges(true);
    },
    [chainLength, graph, showWarning]
  );

  const getStructure = useCallback((): OrganicStructure | null => {
    if (!graph) return null;

    const validation = validateValence(graph);
    const formula = computeFormula(graph);
    const weight = computeMolecularWeight(graph);
    const iupacName = computeIUPACName(graph);

    return {
      carbonGraph: graph,
      derived: {
        molecularFormula: formula,
        molecularWeight: weight,
        totalAtoms: countTotalAtoms(graph),
        carbonCount: countCarbonAtoms(graph),
        iupacName,
      },
      validation,
    };
  }, [graph]);

  const handleExtend = useCallback(() => {
    if (!graph || !selectedNodeId) return;
    const result = extendChain(graph, selectedNodeId);
    if (result.success && result.graph) {
      setGraph(result.graph);
      setHasUnsavedChanges(true);
    } else {
      showError(result.error || "Failed to extend chain");
    }
  }, [graph, selectedNodeId, showError]);

  const handleShorten = useCallback(() => {
    if (!graph || !selectedNodeId) return;
    const result = shortenChain(graph, selectedNodeId);
    if (result.success && result.graph) {
      setGraph(result.graph);
      setSelectedNodeId(null);
      setHasUnsavedChanges(true);
    } else {
      showError(result.error || "Failed to shorten chain");
    }
  }, [graph, selectedNodeId, showError]);

  const handleBranch = useCallback(() => {
    if (!graph || !selectedNodeId) return;
    const result = branchCarbon(graph, selectedNodeId);
    if (result.success && result.graph) {
      setGraph(result.graph);
      setHasUnsavedChanges(true);
    } else {
      showError(result.error || "Failed to add branch");
    }
  }, [graph, selectedNodeId, showError]);

  const isBondInCycle = useCallback(
    (bondFrom: string, bondTo: string): boolean => {
      if (!graph) return false;

      const adjacency: Map<string, string[]> = new Map();
      graph.edges.forEach((edge) => {
        if ((edge.from === bondFrom && edge.to === bondTo) || (edge.from === bondTo && edge.to === bondFrom)) {
          return;
        }

        if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
        if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
        adjacency.get(edge.from)!.push(edge.to);
        adjacency.get(edge.to)!.push(edge.from);
      });

      const visited = new Set<string>();
      const queue = [bondFrom];
      visited.add(bondFrom);

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === bondTo) return true;

        const neighbors = adjacency.get(current) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      return false;
    },
    [graph]
  );

  const handleSetBondOrder = useCallback(
    (targetOrder: 1 | 2 | 3) => {
      if (!graph || !selectedBondId) return;
      const bond = graph.edges.find((e) => e.id === selectedBondId);
      if (!bond) return;

      if (bond.bondType === "aromatic") {
        showAlert("Cannot modify aromatic bonds. Aromatic ring structure is fixed.", "Aromatic Bond");
        return;
      }

      if (targetOrder === bond.bondOrder) {
        showAlert("Bond is already at this order", "Bond Order");
        return;
      }

      if (targetOrder > bond.bondOrder) {
        let currentGraph = graph;
        for (let i = bond.bondOrder; i < targetOrder; i++) {
          const result = unsaturateBond(currentGraph, bond.from, bond.to);
          if (!result.success || !result.graph) {
            showError(result.error || "Failed to increase bond order");
            return;
          }
          currentGraph = result.graph;
        }
        setGraph(currentGraph);
        setHasUnsavedChanges(true);
      } else {
        let currentGraph = graph;
        for (let i = bond.bondOrder; i > targetOrder; i--) {
          const result = saturateBond(currentGraph, bond.from, bond.to);
          if (!result.success || !result.graph) {
            showError(result.error || "Failed to decrease bond order");
            return;
          }
          currentGraph = result.graph;
        }
        setGraph(currentGraph);
        setHasUnsavedChanges(true);
      }
    },
    [graph, selectedBondId, showAlert, showError]
  );

  const handleRemoveBond = useCallback(() => {
    if (!graph || !selectedBondId) return;
    const bond = graph.edges.find((e) => e.id === selectedBondId);
    if (!bond) return;

    if (bond.bondType === "aromatic") {
      showAlert("Cannot remove aromatic bonds. Aromatic ring structure is fixed.", "Aromatic Bond");
      return;
    }

    if (!isBondInCycle(bond.from, bond.to)) {
      showAlert(
        "Cannot remove bond: Bond must be part of a cycle (ring structure). Removing this bond would break the molecule.",
        "Remove Bond"
      );
      return;
    }

    if (bond.bondOrder > 1) {
      let currentGraph = graph;
      for (let i = bond.bondOrder; i > 1; i--) {
        const result = saturateBond(currentGraph, bond.from, bond.to);
        if (!result.success || !result.graph) {
          showError(result.error || "Failed to reduce bond order");
          return;
        }
        currentGraph = result.graph;
      }
      setGraph(currentGraph);
      setHasUnsavedChanges(true);
      return;
    }

    const updatedGraph = {
      ...graph,
      edges: graph.edges.filter((e) => e.id !== selectedBondId),
    };

    updateImplicitHydrogens(updatedGraph);

    setGraph(updatedGraph);
    setSelectedBondId(null);
    setHasUnsavedChanges(true);
  }, [graph, selectedBondId, isBondInCycle, showAlert, showError]);

  const handleAttachGroup = useCallback(
    (groupType: "hydroxyl" | "amino" | "nitro" | "carbonyl" | "halogen", halogen?: "F" | "Cl" | "Br" | "I") => {
      if (!graph || !selectedNodeId) return;
      const result = attachSubstituent(graph, selectedNodeId, { type: groupType, halogen });
      if (result.success && result.graph) {
        setGraph(result.graph);
        setHasUnsavedChanges(true);
      } else {
        showError(result.error || "Failed to attach group");
      }
    },
    [graph, selectedNodeId, showError]
  );

  const handleRemoveGroup = useCallback(() => {
    if (!graph || !selectedNodeId) return;
    const result = removeSubstituent(graph, selectedNodeId);
    if (result.success && result.graph) {
      setGraph(result.graph);
      setSelectedNodeId(null);
      setHasUnsavedChanges(true);
    } else {
      showError(result.error || "Failed to remove group");
    }
  }, [graph, selectedNodeId, showError]);

  const handleCyclize = useCallback(() => {
    if (!cyclizeMode) {
      setCyclizeMode(true);
      setCyclizeFirstNode(null);
      return;
    }

    if (graph && cyclizeFirstNode && selectedNodeId && cyclizeFirstNode !== selectedNodeId) {
      const result = cyclize(graph, cyclizeFirstNode, selectedNodeId);
      if (result.success && result.graph) {
        setGraph(result.graph);
        setCyclizeMode(false);
        setCyclizeFirstNode(null);
        setSelectedNodeId(null);
        setHasUnsavedChanges(true);
      } else {
        showError(result.error || "Failed to cyclize");
      }
    }
  }, [graph, cyclizeMode, cyclizeFirstNode, selectedNodeId, showError]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (cyclizeMode) {
        if (!cyclizeFirstNode) {
          setCyclizeFirstNode(nodeId);
        } else if (cyclizeFirstNode !== nodeId) {
          if (graph) {
            const result = cyclize(graph, cyclizeFirstNode, nodeId);
            if (result.success && result.graph) {
              setGraph(result.graph);
              setHasUnsavedChanges(true);
            } else {
              showError(result.error || "Failed to cyclize");
            }
          }
          setCyclizeMode(false);
          setCyclizeFirstNode(null);
        }
      } else {
        setSelectedNodeId(nodeId);
        setSelectedBondId(null);
      }
    },
    [cyclizeMode, cyclizeFirstNode, graph, showError]
  );

  const handleBondClick = useCallback(
    (bondId: string) => {
      if (!cyclizeMode) {
        setSelectedBondId(bondId);
        setSelectedNodeId(null);
      }
    },
    [cyclizeMode]
  );

  const getAromaticRingNodes = useCallback(
    (nodeId: string): string[] | null => {
      if (!graph) return null;

      const aromaticBonds = graph.edges.filter(
        (e) => e.bondType === "aromatic" && (e.from === nodeId || e.to === nodeId)
      );

      if (aromaticBonds.length === 0) return null;

      const aromaticNodes = new Set<string>([nodeId]);
      const queue = [nodeId];
      const visited = new Set<string>([nodeId]);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const connectedAromaticBonds = graph.edges.filter(
          (e) => e.bondType === "aromatic" && (e.from === current || e.to === current)
        );

        for (const bond of connectedAromaticBonds) {
          const neighbor = bond.from === current ? bond.to : bond.from;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            aromaticNodes.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      return Array.from(aromaticNodes);
    },
    [graph]
  );

  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent<SVGCircleElement>) => {
      if (cyclizeMode) return;

      e.stopPropagation();
      setDraggingNodeId(nodeId);

      if (svgRef.current) {
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        setDragStart({ x: svgP.x, y: svgP.y });
      }
    },
    [cyclizeMode]
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggingNodeId || !dragStart || !graph || !svgRef.current) return;

      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      const dx = svgP.x - dragStart.x;
      const dy = svgP.y - dragStart.y;

      const svgRect = svg.getBoundingClientRect();
      const maxX = svgRect.width - 100;
      const maxY = svgRect.height - 100;

      const aromaticRingNodes = getAromaticRingNodes(draggingNodeId);

      const updatedGraph = {
        ...graph,
        nodes: graph.nodes.map((node) => {
          if (aromaticRingNodes && aromaticRingNodes.includes(node.id)) {
            return {
              ...node,
              position: {
                x: Math.max(0, Math.min(maxX, node.position.x + dx)),
                y: Math.max(0, Math.min(maxY, node.position.y + dy)),
              },
            };
          } else if (node.id === draggingNodeId) {
            return {
              ...node,
              position: {
                x: Math.max(0, Math.min(maxX, node.position.x + dx)),
                y: Math.max(0, Math.min(maxY, node.position.y + dy)),
              },
            };
          }
          return node;
        }),
      };

      setGraph(updatedGraph);
      setDragStart({ x: svgP.x, y: svgP.y });
    },
    [draggingNodeId, dragStart, graph, getAromaticRingNodes]
  );

  const handleSvgMouseUp = useCallback(() => {
    if (draggingNodeId && dragStart) {
      // Node was dragged, mark as unsaved change
      setHasUnsavedChanges(true);
    }
    setDraggingNodeId(null);
    setDragStart(null);
  }, [draggingNodeId, dragStart]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedNodeId(null);
      setSelectedBondId(null);
    }
  }, []);

  const handleSaveStructure = useCallback(async () => {
    if (!graph || !structureName.trim()) {
      showAlert("Please enter a structure name", "Missing Information");
      return;
    }

    setIsSaving(true);

    try {
      const structure = getStructure();
      if (!structure || !structure.validation.isValid) {
        showError("Cannot save invalid structure. Please fix validation errors first.");
        setIsSaving(false);
        return;
      }

      const atoms = graph.nodes.map((node) => ({
        id: node.id,
        element: node.element,
        position: {
          x: node.position.x,
          y: node.position.y,
          z: 0,
        },
        hybridization: node.hybridization,
        charge: 0,
      }));

      const mapBondType = (bondOrder: number, bondType: string): string => {
        if (bondType === "aromatic") return "aromatic";
        if (bondOrder === 3) return "triple";
        if (bondOrder === 2) return "double";
        return "single";
      };

      const bonds = graph.edges.map((edge) => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        type: mapBondType(edge.bondOrder, edge.bondType),
      }));

      const functionalGroups = detectFunctionalGroups(graph).map((group) => ({
        name: group.name,
        position: group.nodeIds?.map((_, i) => i) || [],
      }));

      const detectedGroups = detectFunctionalGroups(graph);
      const hasAromatic = graph.edges.some((e) => e.bondType === "aromatic");
      const hasDoubleBond = graph.edges.some((e) => e.bondOrder === 2 && e.bondType !== "aromatic");
      const hasTripleBond = graph.edges.some((e) => e.bondOrder === 3);

      let category = "alkane";
      if (hasAromatic) category = "aromatic";
      else if (detectedGroups.some((g) => g.name === "carboxylic-acid")) category = "carboxylic-acid";
      else if (detectedGroups.some((g) => g.name === "aldehyde")) category = "aldehyde";
      else if (detectedGroups.some((g) => g.name === "ketone")) category = "ketone";
      else if (detectedGroups.some((g) => g.name === "alcohol")) category = "alcohol";
      else if (detectedGroups.some((g) => g.name === "amine")) category = "amine";
      else if (detectedGroups.some((g) => g.name === "ester")) category = "ester";
      else if (detectedGroups.some((g) => g.name === "ether")) category = "ether";
      else if (detectedGroups.some((g) => g.name === "alkyl-halide")) category = "halide";
      else if (hasTripleBond) category = "alkyne";
      else if (hasDoubleBond) category = "alkene";

      // Generate SMILES notation
      const { generateSMILES, getSMILESByFormula } = await import("@/lib/utils/organic-smiles");
      let smilesString = "";

      try {
        smilesString = generateSMILES(graph);
        // Fallback to formula-based SMILES if generation fails
        if (!smilesString) {
          smilesString = getSMILESByFormula(structure.derived.molecularFormula);
        }
      } catch (error) {
        console.error("SMILES generation error:", error);
        smilesString = getSMILESByFormula(structure.derived.molecularFormula);
      }

      const payload = {
        name: structureName.trim(),
        iupacName: structure.derived.iupacName,
        commonName: structureDescription.trim() || undefined,
        category,
        smiles: smilesString,
        atoms,
        bonds,
        functionalGroups,
        molecularFormula: structure.derived.molecularFormula,
        molecularWeight: structure.derived.molecularWeight,
        renderData: {
          bondLength: 50,
          angle: 120,
          showHydrogens: false,
          colorScheme: "cpk",
        },
        isPublic: originalStructure?.isPublic ?? true,
        tags: originalStructure?.tags || [],
      };

      const response = await fetch(`/api/organic-structures/${structureId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccessSnackbar(true);
        setHasUnsavedChanges(false);
        // Redirect after showing snackbar
        setTimeout(() => {
          router.push(`/organic-chemistry/${structureId}`);
        }, 1500);
      } else {
        showError(`Failed to update structure: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating structure:", error);
      showError("An error occurred while updating the structure");
    } finally {
      setIsSaving(false);
    }
  }, [
    graph,
    structureName,
    structureDescription,
    getStructure,
    router,
    showAlert,
    showError,
    structureId,
    originalStructure,
  ]);

  const structure = getStructure();

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C5CE7]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      {/* Success Snackbar */}
      {showSuccessSnackbar && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Structure updated successfully!</span>
          </div>
        </div>
      )}

      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {
            <>
              {/* Left Panel - Mutation Tools */}
              <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-4 text-white">Mutation Tools</h2>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold mb-2 text-gray-400">Skeleton Operations</h3>
                      <div className="space-y-1.5">
                        <button
                          onClick={handleExtend}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#00D9FF] text-gray-900 font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#00C4E6] transition-colors text-sm"
                        >
                          Extend Chain
                        </button>
                        <button
                          onClick={handleShorten}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#00D9FF] text-gray-900 font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#00C4E6] transition-colors text-sm"
                        >
                          Shorten Chain
                        </button>
                        <button
                          onClick={handleBranch}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#00D9FF] text-gray-900 font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#00C4E6] transition-colors text-sm"
                        >
                          Add Branch
                        </button>
                        <button
                          onClick={handleCyclize}
                          className={`cursor-pointer w-full px-3 py-1.5 font-medium rounded transition-colors text-sm disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed ${
                            cyclizeMode
                              ? "bg-yellow-500 text-gray-900"
                              : "bg-[#00D9FF] text-gray-900 hover:bg-[#00C4E6]"
                          }`}
                          disabled={!graph}
                        >
                          {cyclizeMode ? (cyclizeFirstNode ? "Select 2nd Node" : "Select 1st Node") : "Cyclize"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold mb-2 text-gray-400">Bond Operations</h3>
                      {selectedBondId &&
                        graph &&
                        (() => {
                          const selectedBond = graph.edges.find((e) => e.id === selectedBondId);
                          const isInCycle = selectedBond ? isBondInCycle(selectedBond.from, selectedBond.to) : false;
                          const isAromatic = selectedBond?.bondType === "aromatic";
                          return (
                            <div className="mb-1.5 p-1.5 bg-gray-700 rounded text-xs text-gray-300">
                              <div>
                                Current:{" "}
                                {selectedBond?.bondOrder === 1
                                  ? "Single"
                                  : selectedBond?.bondOrder === 2
                                  ? "Double"
                                  : "Triple"}{" "}
                                Bond
                              </div>
                              {isAromatic && (
                                <div className="text-purple-400 mt-0.5 font-semibold">🔒 Aromatic (Locked)</div>
                              )}
                              {isInCycle && !isAromatic && (
                                <div className="text-yellow-400 mt-0.5">✓ Part of cycle</div>
                              )}
                            </div>
                          );
                        })()}
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => handleSetBondOrder(1)}
                            disabled={!selectedBondId}
                            className="px-2 py-1.5 bg-green-600 text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-green-700 transition-colors text-xs"
                            title="Set to single bond"
                          >
                            Single
                          </button>
                          <button
                            onClick={() => handleSetBondOrder(2)}
                            disabled={!selectedBondId}
                            className="px-2 py-1.5 bg-green-600 text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-green-700 transition-colors text-xs"
                            title="Set to double bond"
                          >
                            Double
                          </button>
                          <button
                            onClick={() => handleSetBondOrder(3)}
                            disabled={!selectedBondId}
                            className="px-2 py-1.5 bg-green-600 text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-green-700 transition-colors text-xs"
                            title="Set to triple bond"
                          >
                            Triple
                          </button>
                        </div>
                        <button
                          onClick={handleRemoveBond}
                          disabled={!selectedBondId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-red-600 text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-red-700 transition-colors text-xs"
                          title="Remove bond (only allowed in cyclic structures)"
                        >
                          Remove Bond
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold mb-2 text-gray-400">Functional Groups</h3>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => handleAttachGroup("hydroxyl")}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#6C5CE7] text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#5B4BC7] transition-colors text-xs"
                        >
                          Attach -OH
                        </button>
                        <button
                          onClick={() => handleAttachGroup("amino")}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#6C5CE7] text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#5B4BC7] transition-colors text-xs"
                        >
                          Attach -NH₂
                        </button>
                        <button
                          onClick={() => handleAttachGroup("carbonyl")}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#6C5CE7] text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#5B4BC7] transition-colors text-xs"
                        >
                          Attach =O
                        </button>
                        <button
                          onClick={() => handleAttachGroup("nitro")}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#6C5CE7] text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#5B4BC7] transition-colors text-xs"
                        >
                          Attach -NO₂
                        </button>
                        <button
                          onClick={() => handleAttachGroup("halogen", "Cl")}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#6C5CE7] text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#5B4BC7] transition-colors text-xs"
                        >
                          Attach -Cl
                        </button>
                        <button
                          onClick={() => handleAttachGroup("halogen", "Br")}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-[#6C5CE7] text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#5B4BC7] transition-colors text-xs"
                        >
                          Attach -Br
                        </button>
                        <button
                          onClick={handleRemoveGroup}
                          disabled={!selectedNodeId}
                          className="cursor-pointer w-full px-3 py-1.5 bg-red-600 text-white font-medium rounded disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-red-700 transition-colors text-xs"
                        >
                          Remove Group
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        showWarning(
                          "Are you sure you want to reset? All changes will be discarded and the structure will be restored to its original state.",
                          () => {
                            if (originalGraph) {
                              // Deep copy the original graph to restore it
                              const restoredGraph = JSON.parse(JSON.stringify(originalGraph));
                              setGraph(restoredGraph);
                              setSelectedNodeId(null);
                              setSelectedBondId(null);
                              setCyclizeMode(false);
                              setDraggingNodeId(null);
                              setDragStart(null);
                              setHasUnsavedChanges(false);
                            }
                          },
                          "Reset to Original",
                          "Reset"
                        );
                      }}
                      disabled={!originalGraph || !hasUnsavedChanges}
                      className="cursor-pointer w-full px-3 py-1.5 bg-gray-600 text-white font-medium rounded hover:bg-gray-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed mt-2 transition-colors text-sm"
                    >
                      Reset to Original
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Panel - Canvas */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {cyclizeMode && (
                  <div className="bg-yellow-500 text-gray-900 px-4 py-3 border-b border-yellow-600">
                    <p className="text-sm font-semibold text-center">
                      Cyclize Mode: {cyclizeFirstNode ? "Select second node to form ring" : "Select first node"}
                    </p>
                  </div>
                )}

                <div className="flex-1 flex items-center justify-center p-6">
                  {graph && (
                    <svg
                      ref={svgRef}
                      width="100%"
                      height="100%"
                      className="border border-gray-700 rounded"
                      style={{ background: "#1A1A2E" }}
                      onMouseMove={handleSvgMouseMove}
                      onMouseUp={handleSvgMouseUp}
                      onMouseLeave={handleSvgMouseUp}
                      onClick={handleCanvasClick}
                    >
                      {graph &&
                        graph.edges.map((edge) => {
                          const fromNode = graph.nodes.find((n) => n.id === edge.from);
                          const toNode = graph.nodes.find((n) => n.id === edge.to);
                          if (!fromNode || !toNode) return null;

                          const isSelected = edge.id === selectedBondId;

                          const dx = toNode.position.x - fromNode.position.x;
                          const dy = toNode.position.y - fromNode.position.y;
                          const length = Math.sqrt(dx * dx + dy * dy);
                          const offsetX = -dy / length || 0;
                          const offsetY = dx / length || 0;

                          const singleBondColor = "#FFFFFF";
                          const doubleBondColor = "#00D9FF";
                          const tripleBondColor = "#A855F7";

                          const x1 = fromNode.position.x + 50;
                          const y1 = fromNode.position.y + 50;
                          const x2 = toNode.position.x + 50;
                          const y2 = toNode.position.y + 50;

                          return (
                            <g key={edge.id}>
                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="transparent"
                                strokeWidth={12}
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBondClick(edge.id);
                                }}
                              />

                              {edge.bondOrder === 1 && (
                                <line
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke={
                                    isSelected ? "#f59e0b" : edge.bondType === "aromatic" ? "#8b5cf6" : singleBondColor
                                  }
                                  strokeWidth={isSelected ? 3 : 2}
                                  pointerEvents="none"
                                />
                              )}
                              {edge.bondOrder === 2 && (
                                <>
                                  <line
                                    x1={x1 + offsetX * 3}
                                    y1={y1 + offsetY * 3}
                                    x2={x2 + offsetX * 3}
                                    y2={y2 + offsetY * 3}
                                    stroke={isSelected ? "#f59e0b" : doubleBondColor}
                                    strokeWidth={isSelected ? 3 : 2}
                                    pointerEvents="none"
                                  />
                                  <line
                                    x1={x1 - offsetX * 3}
                                    y1={y1 - offsetY * 3}
                                    x2={x2 - offsetX * 3}
                                    y2={y2 - offsetY * 3}
                                    stroke={isSelected ? "#f59e0b" : doubleBondColor}
                                    strokeWidth={isSelected ? 3 : 2}
                                    pointerEvents="none"
                                  />
                                </>
                              )}
                              {edge.bondOrder === 3 && (
                                <>
                                  <line
                                    x1={x1 + offsetX * 4}
                                    y1={y1 + offsetY * 4}
                                    x2={x2 + offsetX * 4}
                                    y2={y2 + offsetY * 4}
                                    stroke={isSelected ? "#f59e0b" : tripleBondColor}
                                    strokeWidth={isSelected ? 3 : 2}
                                    pointerEvents="none"
                                  />
                                  <line
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke={isSelected ? "#f59e0b" : tripleBondColor}
                                    strokeWidth={isSelected ? 3 : 2}
                                    pointerEvents="none"
                                  />
                                  <line
                                    x1={x1 - offsetX * 4}
                                    y1={y1 - offsetY * 4}
                                    x2={x2 - offsetX * 4}
                                    y2={y2 - offsetY * 4}
                                    stroke={isSelected ? "#f59e0b" : tripleBondColor}
                                    strokeWidth={isSelected ? 3 : 2}
                                    pointerEvents="none"
                                  />
                                </>
                              )}
                            </g>
                          );
                        })}

                      {graph &&
                        graph.nodes.map((node) => {
                          const connectedEdges = graph.edges.filter((e) => e.from === node.id || e.to === node.id);
                          const usedValency = connectedEdges.reduce((sum, e) => sum + e.bondOrder, 0);
                          const maxValency =
                            node.element === "C" ? 4 : node.element === "O" ? 2 : node.element === "N" ? 3 : 1;
                          const isOverValency = usedValency > maxValency;
                          const isSelected = node.id === selectedNodeId;
                          const isCyclizeNode = cyclizeMode && node.id === cyclizeFirstNode;

                          const colorMap: Record<string, string> = {
                            C: "#000000",
                            O: "#FF0000",
                            N: "#0000FF",
                            S: "#FFFF00",
                            P: "#FFA500",
                            F: "#90E050",
                            Cl: "#1FF01F",
                            Br: "#A62929",
                            I: "#940094",
                          };

                          const isDragging = draggingNodeId === node.id;

                          return (
                            <g key={node.id}>
                              <circle
                                cx={node.position.x + 50}
                                cy={node.position.y + 50}
                                r={10}
                                fill={colorMap[node.element] || "#404040"}
                                stroke={
                                  isSelected
                                    ? "#f59e0b"
                                    : isCyclizeNode
                                    ? "#eab308"
                                    : isOverValency
                                    ? "#ef4444"
                                    : "#FFFFFF"
                                }
                                strokeWidth={isSelected || isCyclizeNode ? 3 : 2}
                                className={`${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                                onMouseDown={(e) => {
                                  handleNodeMouseDown(node.id, e);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!draggingNodeId) {
                                    handleNodeClick(node.id);
                                  }
                                }}
                              />

                              <text
                                x={node.position.x + 50}
                                y={node.position.y + 50 + 4}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="bold"
                                fill="#fff"
                                pointerEvents="none"
                              >
                                {node.element}
                              </text>

                              {node.implicitHydrogens > 0 && (
                                <text
                                  x={node.position.x + 45}
                                  y={node.position.y + 35}
                                  fontSize="10"
                                  fill="#22c55e"
                                  fontWeight="bold"
                                  pointerEvents="none"
                                >
                                  H{node.implicitHydrogens > 1 ? node.implicitHydrogens : ""}
                                </text>
                              )}
                            </g>
                          );
                        })}
                    </svg>
                  )}
                  {!graph && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg
                          className="w-24 h-24 mx-auto mb-4 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                          />
                        </svg>
                        <p className="text-lg font-medium mb-2">Loading structure...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Derived Properties */}
              <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-4 text-white">Derived Properties</h2>

                  {graph && structure && (
                    <div className="space-y-3">
                      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                        <h3 className="text-xs font-semibold text-gray-400 mb-1">IUPAC Name</h3>
                        <p className="text-base font-medium text-white break-words">{structure.derived.iupacName}</p>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                        <h3 className="text-xs font-semibold text-gray-400 mb-1">Molecular Formula</h3>
                        <p className="text-xl font-bold text-white">{structure.derived.molecularFormula}</p>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                        <h3 className="text-xs font-semibold text-gray-400 mb-1">Molecular Weight</h3>
                        <p className="text-base text-white">{structure.derived.molecularWeight.toFixed(2)} g/mol</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                          <h3 className="text-xs font-semibold text-gray-400 mb-1">Total Atoms</h3>
                          <p className="text-base text-white">{structure.derived.totalAtoms}</p>
                        </div>

                        <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                          <h3 className="text-xs font-semibold text-gray-400 mb-1">Carbon Count</h3>
                          <p className="text-base text-white">{structure.derived.carbonCount}</p>
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                        <h3 className="text-xs font-semibold text-gray-400 mb-2">Functional Groups</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {detectFunctionalGroups(graph).map((group, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 bg-[#6C5CE7] text-white text-xs font-medium rounded"
                            >
                              {group.name}
                            </span>
                          ))}
                          {detectFunctionalGroups(graph).length === 0 && (
                            <p className="text-xs text-gray-400">None detected</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                        <h3 className="text-xs font-semibold text-gray-400 mb-2">Validation</h3>
                        <div
                          className={`p-2 rounded ${
                            structure.validation.isValid
                              ? "bg-green-900/30 border border-green-600"
                              : "bg-red-900/30 border border-red-600"
                          }`}
                        >
                          <p
                            className={`text-xs font-semibold ${
                              structure.validation.isValid ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {structure.validation.isValid ? "✓ Valid Structure" : "✗ Invalid Structure"}
                          </p>
                          {structure.validation.errors.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {structure.validation.errors.map((error, idx) => (
                                <p key={idx} className="text-xs text-red-300">
                                  {error}
                                </p>
                              ))}
                            </div>
                          )}
                          {structure.validation.warnings.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {structure.validation.warnings.map((warning, idx) => (
                                <p key={idx} className="text-xs text-yellow-300">
                                  {warning}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-700 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Structure Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={structureName}
                            onChange={(e) => setStructureName(e.target.value)}
                            placeholder="e.g., Ethanol, Benzene, etc."
                            className="cursor-pointer w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Description (Optional)</label>
                          <textarea
                            value={structureDescription}
                            onChange={(e) => setStructureDescription(e.target.value)}
                            placeholder="Add notes about this structure..."
                            rows={2}
                            className="cursor-pointer w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] resize-none"
                          />
                        </div>

                        <button
                          onClick={handleSaveStructure}
                          disabled={!structure.validation.isValid || !structureName.trim() || isSaving}
                          className="cursor-pointer w-full px-4 py-3 bg-[#6C5CE7] text-white font-semibold rounded hover:bg-[#5B4BC7] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSaving ? "Updating..." : "Update Structure"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          }
        </div>
      </div>
    </div>
  );
}
