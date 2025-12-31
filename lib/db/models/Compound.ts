import mongoose, { Schema, Model } from "mongoose";
import {
  Compound as ICompound,
  CompoundElement,
  Bond,
  ExternalFactors,
  CanvasData,
  MolecularGeometry
} from "@/lib/types/compound";

const CompoundElementSchema = new Schema<CompoundElement>({
  elementId: { type: String, required: true },
  symbol: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  position: {
    type: {
      x: { type: Number },
      y: { type: Number },
    },
    required: false,
  },
  position3D: {
    type: {
      x: { type: Number },
      y: { type: Number },
      z: { type: Number },
    },
    required: false,
  },
});

// Phase 3: Bond Schema
const BondSchema = new Schema<Bond>({
  id: { type: String, required: true },
  fromElementId: { type: String, required: true },
  toElementId: { type: String, required: true },
  bondType: {
    type: String,
    enum: ["single", "double", "triple", "ionic", "covalent", "metallic"],
    required: true
  },
  strength: { type: Number, required: false },
});

// Phase 3: External Factors Schema
const ExternalFactorsSchema = new Schema<ExternalFactors>({
  temperature: {
    type: {
      enabled: { type: Boolean, default: false },
      value: { type: Number },
      unit: { type: String, enum: ["K", "C"] },
    },
    required: false,
  },
  pressure: {
    type: {
      enabled: { type: Boolean, default: false },
      value: { type: Number },
      unit: { type: String, enum: ["atm", "Pa"] },
    },
    required: false,
  },
  catalyst: {
    type: {
      enabled: { type: Boolean, default: false },
      name: { type: String },
      details: { type: String },
    },
    required: false,
  },
  heat: {
    type: {
      enabled: { type: Boolean, default: false },
      details: { type: String },
    },
    required: false,
  },
  light: {
    type: {
      enabled: { type: Boolean, default: false },
      wavelength: { type: Number },
      details: { type: String },
    },
    required: false,
  },
});

// Phase 3: Canvas Data Schema
const CanvasDataSchema = new Schema<CanvasData>({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  zoom: { type: Number, required: true, default: 1 },
  offset: {
    type: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    required: true,
  },
});

// Molecular Geometry Schema (for 3D visualization)
const MolecularGeometrySchema = new Schema<MolecularGeometry>({
  type: {
    type: String,
    enum: [
      "linear",
      "bent",
      "trigonal-planar",
      "tetrahedral",
      "trigonal-pyramidal",
      "trigonal-bipyramidal",
      "octahedral",
      "custom"
    ],
    required: true,
  },
  centralAtomId: { type: String, required: false },
  bondAngles: { type: [Number], required: false },
  generatedAt: { type: Date, required: false, default: Date.now },
});

const CompoundSchema = new Schema<ICompound>(
  {
    name: { type: String, required: true },
    formula: { type: String, required: true },

    // Composition
    elements: { type: [CompoundElementSchema], required: true },

    // Properties
    molarMass: { type: Number, required: true },
    description: { type: String, default: null },

    // Phase 3: Interactive Creation Data
    bonds: { type: [BondSchema], required: false },
    externalFactors: { type: ExternalFactorsSchema, required: false },
    canvasData: { type: CanvasDataSchema, required: false },
    geometry: { type: MolecularGeometrySchema, required: false },

    // User info
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
CompoundSchema.index({ name: 1 });
CompoundSchema.index({ createdBy: 1 });
CompoundSchema.index({ createdAt: -1 });

const CompoundModel: Model<ICompound> =
  mongoose.models.Compound ||
  mongoose.model<ICompound>("Compound", CompoundSchema);

export default CompoundModel;
