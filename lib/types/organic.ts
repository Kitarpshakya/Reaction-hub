// Organic Chemistry Types

export type OrganicCategory =
  | "alkane"
  | "alkene"
  | "alkyne"
  | "aromatic"
  | "alcohol"
  | "aldehyde"
  | "ketone"
  | "carboxylic-acid"
  | "ester"
  | "ether"
  | "amine"
  | "amide"
  | "halide"
  | "custom";

export type BondType = "single" | "double" | "triple" | "aromatic" | "dative";

export type StereoType = "wedge" | "dash" | "wavy";

export type Hybridization = "sp" | "sp2" | "sp3";

export type ColorScheme = "cpk" | "element" | "custom";

export type TemplateCategory =
  | "benzene-derivatives"
  | "alkanes"
  | "cyclic"
  | "functional-groups";

export interface Atom {
  id: string;
  element: string;
  charge?: number;
  radical?: boolean;
  position: {
    x: number;
    y: number;
    z?: number;
  };
  hybridization?: Hybridization;
}

export interface Bond {
  id: string;
  from: string; // atom id
  to: string; // atom id
  type: BondType;
  stereo?: StereoType;
}

export interface FunctionalGroup {
  name: string;
  position: number[]; // Atom indices
  priority?: number; // For IUPAC naming
}

export interface RenderData {
  bondLength: number;
  angle: number;
  showHydrogens: boolean;
  colorScheme: ColorScheme;
}

export interface OrganicStructure {
  _id?: string;
  id?: string;
  name: string;
  iupacName?: string;
  commonName?: string;
  category: OrganicCategory;

  // Structure representation
  smiles: string;
  molFile?: string;
  inchi?: string;

  // Atoms and bonds
  atoms: Atom[];
  bonds: Bond[];

  // Functional groups present
  functionalGroups: FunctionalGroup[];

  // Chemical properties
  molecularFormula: string;
  molecularWeight: number;
  logP?: number;
  pKa?: number;

  // Template information
  isTemplate: boolean;
  templateCategory?: TemplateCategory;

  // Visual rendering data
  renderData?: RenderData;

  // User metadata
  createdBy: string;
  createdByName: string;
  isPublic: boolean;
  tags?: string[];

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// For template data
export interface OrganicTemplate {
  name: string;
  commonName?: string;
  category: OrganicCategory;
  smiles: string;
  molecularFormula: string;
  molecularWeight: number;
  templateCategory: TemplateCategory;
  description?: string;
  functionalGroups?: string[];
  atoms: Atom[];
  bonds: Bond[];
}

// For API responses
export interface OrganicStructureResponse {
  success: boolean;
  data?: OrganicStructure | OrganicStructure[];
  error?: string;
  count?: number;
}

// For filters
export interface OrganicFilters {
  category?: OrganicCategory;
  functionalGroups?: string[];
  search?: string;
  minWeight?: number;
  maxWeight?: number;
  createdBy?: string;
  isPublic?: boolean;
  tags?: string[];
}
