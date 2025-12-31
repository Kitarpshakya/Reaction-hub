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
import { modalService } from "@/lib/utils/modal-service";

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

        // EXPLICIT duplicate check - ensure no bond already exists
        const bondAlreadyExists = [...state.bonds, ...newBonds].some(
          (bond) =>
            (bond.fromElementId === id && bond.toElementId === nearbyId) ||
            (bond.fromElementId === nearbyId && bond.toElementId === id)
        );

        if (bondAlreadyExists) {
          console.log(`Skipping duplicate bond between ${element.symbol} and ${nearbyElement?.element.symbol}`);
          return;
        }

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

      // EXPLICIT duplicate bond check - prevent any duplicate bonds
      const bondAlreadyExists = state.bonds.some(
        (bond) =>
          (bond.fromElementId === fromElementId && bond.toElementId === toElementId) ||
          (bond.fromElementId === toElementId && bond.toElementId === fromElementId)
      );

      if (bondAlreadyExists) {
        console.log(`Bond between ${fromElement.element.symbol} and ${toElement.element.symbol} already exists`);
        return state;
      }

      // SINGLE COMPOUND RESTRICTION: Prevent creating multiple disconnected compounds
      // But allow re-bonding orphaned elements (elements that lost their group after bond removal)
      if (state.bonds.length > 0) {
        const fromElementHasGroup = !!fromElement.groupId;
        const toElementHasGroup = !!toElement.groupId;

        // Get all existing group IDs
        const existingGroups = new Set(
          state.canvasElements
            .filter(el => el.groupId)
            .map(el => el.groupId)
        );

        // If neither element has a group, check if there are other grouped elements
        if (!fromElementHasGroup && !toElementHasGroup) {
          // If there ARE other grouped elements, these two would form a separate compound
          // But we should allow this if the user is rebuilding after removing bonds
          // Only block if this would create a truly separate disconnected compound

          // Check: are there any elements WITH groups that are different from what we'd create?
          if (existingGroups.size > 0) {
            // There's already a compound group - warn but allow if user confirms
            // For now, just allow it to enable rebuilding after bond removal
            console.log(
              `⚠️ Creating bond between ungrouped elements while other groups exist. ` +
              `This will create a new group that may be separate from existing compound.`
            );
            // Allow the bond - user may be rebuilding the compound
          }
        }

        // If both elements are in different groups, this would merge compounds
        // This is actually fine - it reconnects parts of the compound
        if (
          fromElementHasGroup &&
          toElementHasGroup &&
          fromElement.groupId !== toElement.groupId
        ) {
          console.log(
            `✓ Merging groups: ${fromElement.groupId} and ${toElement.groupId}`
          );
          // Allow merging - this reconnects disconnected parts
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

      // Assign elements to same group (and merge groups if needed)
      let groupId = fromElement.groupId || toElement.groupId;
      if (!groupId) {
        groupId = `group-${Date.now()}`;
      }

      // If merging two different groups, update ALL elements from both groups
      const groupsToMerge = new Set<string>();
      if (fromElement.groupId) groupsToMerge.add(fromElement.groupId);
      if (toElement.groupId) groupsToMerge.add(toElement.groupId);

      const updatedElements = state.canvasElements.map((el) => {
        // Update the two bonded elements
        if (el.id === fromElementId || el.id === toElementId) {
          return { ...el, groupId };
        }
        // Also update any elements from groups being merged
        if (el.groupId && groupsToMerge.has(el.groupId)) {
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

    // Count only bonded elements and collect their full data
    const elementCounts: Record<string, number> = {};
    const elementDataMap = new Map<string, Element>();

    canvasElements.forEach((el) => {
      if (bondedElementIds.has(el.id)) {
        elementCounts[el.symbol] = (elementCounts[el.symbol] || 0) + 1;
        if (!elementDataMap.has(el.symbol)) {
          elementDataMap.set(el.symbol, el.element);
        }
      }
    });

    // Helper: Check if element is a metal
    const isMetal = (symbol: string): boolean => {
      const element = elementDataMap.get(symbol);
      if (!element) return false;
      const metalCategories = [
        "alkali-metal",
        "alkaline-earth-metal",
        "transition-metal",
        "post-transition-metal",
        "lanthanide",
        "actinide",
      ];
      return metalCategories.includes(element.category);
    };

    // Helper: Check if element is a nonmetal
    const isNonmetal = (symbol: string): boolean => {
      const element = elementDataMap.get(symbol);
      if (!element) return false;
      return element.category === "nonmetal" || element.category === "halogen";
    };

    const symbols = Object.keys(elementCounts);
    const hasCarbon = symbols.includes('C');
    const metals = symbols.filter(isMetal);
    const nonmetals = symbols.filter(isNonmetal);
    const isIonic = metals.length > 0 && nonmetals.length > 0;

    // Sort elements using chemistry conventions
    const sortedElements = Object.entries(elementCounts).sort(([symbolA], [symbolB]) => {
      // For ionic compounds: Metal (cation) before nonmetal (anion)
      if (isIonic) {
        const metalA = isMetal(symbolA);
        const metalB = isMetal(symbolB);
        const nonmetalA = isNonmetal(symbolA);
        const nonmetalB = isNonmetal(symbolB);

        if (metalA && nonmetalB) return -1;
        if (nonmetalA && metalB) return 1;

        // If both metals or both nonmetals, sort alphabetically
        return symbolA.localeCompare(symbolB);
      }

      // For covalent compounds
      if (hasCarbon) {
        // Hill system: Carbon first, then Hydrogen, then alphabetical
        if (symbolA === 'C') return -1;
        if (symbolB === 'C') return 1;
        if (symbolA === 'H' && symbolB !== 'C') return -1;
        if (symbolB === 'H' && symbolA !== 'C') return 1;

        // Alphabetical for remaining elements
        return symbolA.localeCompare(symbolB);
      } else {
        // Special case for hydrogen compounds (binary hydrides)
        const hasHydrogen = symbols.includes('H');
        const halogens = ['F', 'Cl', 'Br', 'I', 'At'];

        if (hasHydrogen && symbols.length === 2) {
          // For hydrogen halides (HCl, HF, etc.), H comes first
          const otherSymbol = symbols.find(s => s !== 'H');
          if (otherSymbol && halogens.includes(otherSymbol)) {
            if (symbolA === 'H') return -1;
            if (symbolB === 'H') return 1;
          } else {
            // For other binary hydrogen compounds (NH₃, H₂O, H₂S), other element first
            if (symbolA === 'H') return 1;
            if (symbolB === 'H') return -1;
          }
        }

        // Sort by electronegativity (least electronegative first)
        const elementA = elementDataMap.get(symbolA);
        const elementB = elementDataMap.get(symbolB);
        const enA = elementA?.electronegativity || 0;
        const enB = elementB?.electronegativity || 0;

        // Sort by electronegativity ascending (least electronegative first)
        if (enA !== enB) return enA - enB;

        // If electronegativity is the same, sort alphabetically
        return symbolA.localeCompare(symbolB);
      }
    });

    // Generate formula
    let formula = "";
    sortedElements.forEach(([symbol, count]) => {
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
