import { create } from "zustand";
import { Element } from "@/lib/types/element";
import {
  CompoundElement,
  Bond,
  BondType,
  ExternalFactors,
} from "@/lib/types/compound";
import {
  determineBondType,
  canFormBond,
  shouldAutoGroup,
  getAvailableValence,
} from "@/lib/utils/chemistry-helpers";

interface CanvasElement extends CompoundElement {
  id: string; // Unique instance ID
  element: Element; // Full element data
  groupId?: string; // Group ID for bonded elements
}

interface CompoundCanvasState {
  // Canvas elements
  canvasElements: CanvasElement[];
  selectedElementId: string | null;
  selectedBondId: string | null;

  // Bonds
  bonds: Bond[];

  // External factors
  externalFactors: ExternalFactors;

  // Compound details
  compoundName: string;
  compoundDescription: string;

  // Canvas state
  zoom: number;
  offset: { x: number; y: number };

  // Actions
  addElement: (element: Element, position: { x: number; y: number }) => void;
  removeElement: (id: string) => void;
  updateElementPosition: (id: string, position: { x: number; y: number }) => void;
  updateGroupPosition: (elementId: string, delta: { x: number; y: number }) => void;
  selectElement: (id: string | null) => void;

  addBond: (fromElementId: string, toElementId: string, bondType: BondType) => void;
  removeBond: (bondId: string) => void;
  updateBondType: (bondId: string, bondType: BondType) => void;
  selectBond: (bondId: string | null) => void;

  setExternalFactors: (factors: Partial<ExternalFactors>) => void;
  setCompoundName: (name: string) => void;
  setCompoundDescription: (description: string) => void;

  setZoom: (zoom: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;

  // Formula and molar mass calculation
  getFormula: () => string;
  getMolarMass: () => number;

  // Reset
  reset: () => void;

  // Load compound for editing
  loadCompound: (compound: any) => void;
  loadElementsDirectly: (elements: CanvasElement[], bonds: Bond[]) => void;
}

export const useCompoundCanvasStore = create<CompoundCanvasState>((set, get) => ({
  // Initial state
  canvasElements: [],
  selectedElementId: null,
  selectedBondId: null,
  bonds: [],
  externalFactors: {},
  compoundName: "",
  compoundDescription: "",
  zoom: 1,
  offset: { x: 0, y: 0 },

  // Actions
  addElement: (element, position) => {
    const id = `${element.symbol}-${Date.now()}-${Math.random()}`;

    set((state) => {
      // Check for nearby elements to auto-bond
      const nearbyElementIds = shouldAutoGroup(
        state.canvasElements.map((el) => ({
          id: el.id,
          position: el.position!,
        })),
        { id, position },
        120 // threshold distance for auto-bonding (increased for easier bonding)
      );

      console.log("Adding element:", element.symbol, "at position:", position);
      console.log("Nearby elements for auto-bonding:", nearbyElementIds);

      // Create bonds with nearby elements
      const newBonds: Bond[] = [];
      let groupId: string | undefined;

      nearbyElementIds.forEach((nearbyId) => {
        const nearbyElement = state.canvasElements.find((el) => el.id === nearbyId);
        if (
          nearbyElement &&
          canFormBond(
            element,
            nearbyElement.element,
            id,
            nearbyId,
            [...state.bonds, ...newBonds] // Include bonds created in this operation
          )
        ) {
          const bondType = determineBondType(element, nearbyElement.element);
          const bondId = `bond-${Date.now()}-${Math.random()}`;

          console.log(
            `Creating ${bondType} bond between ${element.symbol} and ${nearbyElement.element.symbol}`
          );

          newBonds.push({
            id: bondId,
            fromElementId: id,
            toElementId: nearbyId,
            bondType,
          });

          // Assign to same group as nearby element
          if (!groupId && nearbyElement.groupId) {
            groupId = nearbyElement.groupId;
          }
        }
      });

      // If no existing group found but bonds created, create new group
      if (!groupId && newBonds.length > 0) {
        groupId = `group-${Date.now()}`;
      }

      // Update group IDs for bonded elements
      const updatedElements = state.canvasElements.map((el) => {
        if (nearbyElementIds.includes(el.id) && groupId) {
          return { ...el, groupId };
        }
        return el;
      });

      const newElement: CanvasElement = {
        id,
        elementId: element._id || element.symbol,
        symbol: element.symbol,
        count: 1,
        position,
        element,
        groupId,
      };

      return {
        canvasElements: [...updatedElements, newElement],
        bonds: [...state.bonds, ...newBonds],
      };
    });
  },

  removeElement: (id) => {
    set((state) => ({
      canvasElements: state.canvasElements.filter((el) => el.id !== id),
      bonds: state.bonds.filter(
        (bond) => bond.fromElementId !== id && bond.toElementId !== id
      ),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
  },

  updateElementPosition: (id, position) => {
    set((state) => ({
      canvasElements: state.canvasElements.map((el) =>
        el.id === id ? { ...el, position } : el
      ),
    }));
  },

  updateGroupPosition: (elementId, delta) => {
    set((state) => {
      // Always update just the single element, not the entire group
      // This allows elements to be freely repositioned with bonds updating dynamically
      return {
        canvasElements: state.canvasElements.map((el) =>
          el.id === elementId && el.position
            ? { ...el, position: { x: el.position.x + delta.x, y: el.position.y + delta.y } }
            : el
        ),
      };
    });
  },

  selectElement: (id) => {
    set({ selectedElementId: id, selectedBondId: null });
  },

  addBond: (fromElementId, toElementId, bondType) => {
    set((state) => {
      const fromElement = state.canvasElements.find((el) => el.id === fromElementId);
      const toElement = state.canvasElements.find((el) => el.id === toElementId);

      if (!fromElement || !toElement) {
        console.log("Cannot add bond: element not found");
        return state;
      }

      // SINGLE COMPOUND RESTRICTION: Check if there are existing bonds
      // If yes, at least one of the elements being bonded must be part of an existing group
      if (state.bonds.length > 0) {
        const fromElementHasGroup = !!fromElement.groupId;
        const toElementHasGroup = !!toElement.groupId;

        // If neither element is part of an existing group, block the bond
        if (!fromElementHasGroup && !toElementHasGroup) {
          console.log(
            `❌ Cannot create separate compound! ${fromElement.element.symbol} and ${toElement.element.symbol} ` +
              `are not connected to the existing compound. Please bond to existing compound elements first.`
          );
          alert(
            `Cannot create separate compound!\n\n` +
              `You can only create ONE compound at a time. ` +
              `At least one element must be part of the existing compound.\n\n` +
              `Either:\n` +
              `- Bond ${fromElement.element.symbol} or ${toElement.element.symbol} to the existing compound first\n` +
              `- Use the Clear/Reset button to start a new compound`
          );
          return state;
        }

        // If both elements are in different groups, block the bond (would merge compounds)
        if (
          fromElementHasGroup &&
          toElementHasGroup &&
          fromElement.groupId !== toElement.groupId
        ) {
          console.log(
            `❌ Cannot merge separate groups! ${fromElement.element.symbol} (group ${fromElement.groupId}) ` +
              `and ${toElement.element.symbol} (group ${toElement.groupId}) are in different compounds.`
          );
          alert(
            `Cannot merge separate compounds!\n\n` +
              `These elements belong to different compound groups. ` +
              `This should not happen in the single-compound mode.`
          );
          return state;
        }
      }

      // Check if bond can be formed (valency validation)
      if (
        !canFormBond(
          fromElement.element,
          toElement.element,
          fromElementId,
          toElementId,
          state.bonds
        )
      ) {
        console.log(
          `Cannot form bond between ${fromElement.element.symbol} and ${toElement.element.symbol}: ` +
            `valence or duplicate bond issue`
        );
        return state;
      }

      // Automatically determine bond type based on chemistry rules
      const autoBondType = determineBondType(fromElement.element, toElement.element);

      const bondId = `bond-${Date.now()}-${Math.random()}`;
      const newBond: Bond = {
        id: bondId,
        fromElementId,
        toElementId,
        bondType: autoBondType,
      };

      console.log(
        `✓ Created ${autoBondType} bond between ${fromElement.element.symbol} and ${toElement.element.symbol}`
      );

      // Assign elements to same group
      let groupId = fromElement.groupId || toElement.groupId;
      if (!groupId) {
        groupId = `group-${Date.now()}`;
      }

      const updatedElements = state.canvasElements.map((el) => {
        if (el.id === fromElementId || el.id === toElementId) {
          return { ...el, groupId };
        }
        return el;
      });

      const newBonds = [...state.bonds, newBond];

      // Check if the first selected element can still form more bonds
      const availableValence = getAvailableValence(
        fromElement.element,
        fromElementId,
        newBonds
      );

      console.log(
        `${fromElement.element.symbol} has ${availableValence} available valence after bonding`
      );

      return {
        bonds: newBonds,
        canvasElements: updatedElements,
        // Keep first element selected if it can form more bonds, otherwise deselect
        selectedElementId: availableValence > 0 ? fromElementId : null,
      };
    });
  },

  removeBond: (bondId) => {
    set((state) => {
      const bondToRemove = state.bonds.find((b) => b.id === bondId);
      if (!bondToRemove) return state;

      const remainingBonds = state.bonds.filter((bond) => bond.id !== bondId);

      // Check if elements should be ungrouped
      const el1 = state.canvasElements.find((el) => el.id === bondToRemove.fromElementId);
      const el2 = state.canvasElements.find((el) => el.id === bondToRemove.toElementId);

      if (!el1 || !el2) {
        return {
          bonds: remainingBonds,
          selectedBondId: state.selectedBondId === bondId ? null : state.selectedBondId,
        };
      }

      // Check if either element still has other bonds
      const el1HasOtherBonds = remainingBonds.some(
        (b) => b.fromElementId === el1.id || b.toElementId === el1.id
      );
      const el2HasOtherBonds = remainingBonds.some(
        (b) => b.fromElementId === el2.id || b.toElementId === el2.id
      );

      // Update group IDs - remove group if no bonds remain
      const updatedElements = state.canvasElements.map((el) => {
        if (el.id === el1.id && !el1HasOtherBonds) {
          return { ...el, groupId: undefined };
        }
        if (el.id === el2.id && !el2HasOtherBonds) {
          return { ...el, groupId: undefined };
        }
        return el;
      });

      console.log(`Removed bond ${bondId}, elements ungrouped if no other bonds`);

      return {
        bonds: remainingBonds,
        canvasElements: updatedElements,
        selectedBondId: state.selectedBondId === bondId ? null : state.selectedBondId,
      };
    });
  },

  updateBondType: (bondId, bondType) => {
    set((state) => ({
      bonds: state.bonds.map((bond) =>
        bond.id === bondId ? { ...bond, bondType } : bond
      ),
    }));
  },

  selectBond: (bondId) => {
    set({ selectedBondId: bondId, selectedElementId: null });
  },

  setExternalFactors: (factors) => {
    set((state) => ({
      externalFactors: { ...state.externalFactors, ...factors },
    }));
  },

  setCompoundName: (name) => {
    set({ compoundName: name });
  },

  setCompoundDescription: (description) => {
    set({ compoundDescription: description });
  },

  setZoom: (zoom) => {
    set({ zoom });
  },

  setOffset: (offset) => {
    set({ offset });
  },

  getFormula: () => {
    const { canvasElements, bonds } = get();

    // Only include elements that have at least one bond
    const bondedElementIds = new Set<string>();
    bonds.forEach((bond) => {
      bondedElementIds.add(bond.fromElementId);
      bondedElementIds.add(bond.toElementId);
    });

    // Count only bonded elements
    const elementCounts: Record<string, number> = {};
    canvasElements.forEach((el) => {
      if (bondedElementIds.has(el.id)) {
        elementCounts[el.symbol] = (elementCounts[el.symbol] || 0) + 1;
      }
    });

    // Generate formula (simple version)
    let formula = "";
    Object.entries(elementCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([symbol, count]) => {
        formula += symbol;
        if (count > 1) {
          formula += count.toString().split("").map(d => "₀₁₂₃₄₅₆₇₈₉"[parseInt(d)]).join("");
        }
      });

    return formula || "";
  },

  getMolarMass: () => {
    const { canvasElements, bonds } = get();

    // Only include elements that have at least one bond
    const bondedElementIds = new Set<string>();
    bonds.forEach((bond) => {
      bondedElementIds.add(bond.fromElementId);
      bondedElementIds.add(bond.toElementId);
    });

    return canvasElements
      .filter((el) => bondedElementIds.has(el.id))
      .reduce((sum, el) => sum + el.element.atomicMass, 0);
  },

  reset: () => {
    set({
      canvasElements: [],
      selectedElementId: null,
      selectedBondId: null,
      bonds: [],
      externalFactors: {},
      compoundName: "",
      compoundDescription: "",
      zoom: 1,
      offset: { x: 0, y: 0 },
    });
  },

  loadCompound: (compound) => {
    console.log("Loading compound for editing:", compound);

    // Reset first to clear any existing state
    set({
      canvasElements: [],
      selectedElementId: null,
      selectedBondId: null,
      bonds: [],
      externalFactors: {},
      compoundName: "",
      compoundDescription: "",
      zoom: 1,
      offset: { x: 0, y: 0 },
    });

    // Set compound metadata
    set({
      compoundName: compound.name || "",
      compoundDescription: compound.description || "",
      externalFactors: compound.externalFactors || {},
      zoom: compound.canvasData?.zoom || 1,
      offset: compound.canvasData?.offset || { x: 0, y: 0 },
    });
  },

  // New method to load elements directly without auto-bonding
  loadElementsDirectly: (elements: CanvasElement[], bonds: Bond[]) => {
    console.log("Loading elements and bonds directly:", elements.length, "elements,", bonds.length, "bonds");
    set({
      canvasElements: elements,
      bonds: bonds,
    });
  },
}));
