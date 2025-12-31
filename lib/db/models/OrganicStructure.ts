import mongoose, { Schema, Model } from "mongoose";
import { OrganicStructure } from "@/lib/types/organic";

const AtomSchema = new Schema(
  {
    id: { type: String, required: true },
    element: { type: String, required: true },
    charge: { type: Number, default: 0 },
    radical: { type: Boolean, default: false },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number },
    },
    hybridization: {
      type: String,
      enum: ["sp", "sp2", "sp3"],
    },
  },
  { _id: false }
);

const BondSchema = new Schema(
  {
    id: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["single", "double", "triple", "aromatic", "dative"],
    },
    stereo: {
      type: String,
      enum: ["wedge", "dash", "wavy"],
    },
  },
  { _id: false }
);

const FunctionalGroupSchema = new Schema(
  {
    name: { type: String, required: true },
    position: [{ type: Number }],
    priority: { type: Number },
  },
  { _id: false }
);

const RenderDataSchema = new Schema(
  {
    bondLength: { type: Number, default: 50 },
    angle: { type: Number, default: 120 },
    showHydrogens: { type: Boolean, default: false },
    colorScheme: {
      type: String,
      enum: ["cpk", "element", "custom"],
      default: "cpk",
    },
  },
  { _id: false }
);

const OrganicStructureSchema = new Schema<OrganicStructure>(
  {
    name: { type: String, required: true },
    iupacName: { type: String },
    commonName: { type: String },
    category: {
      type: String,
      required: true,
      enum: [
        "alkane",
        "alkene",
        "alkyne",
        "aromatic",
        "alcohol",
        "aldehyde",
        "ketone",
        "carboxylic-acid",
        "ester",
        "ether",
        "amine",
        "amide",
        "halide",
        "custom",
      ],
    },

    // Structure representation
    smiles: { type: String, required: false }, // Optional - auto-generated from graph
    molFile: { type: String },
    inchi: { type: String },

    // Atoms and bonds
    atoms: [AtomSchema],
    bonds: [BondSchema],

    // Functional groups
    functionalGroups: [FunctionalGroupSchema],

    // Chemical properties
    molecularFormula: { type: String, required: true },
    molecularWeight: { type: Number, required: true },
    logP: { type: Number },
    pKa: { type: Number },

    // Template information
    isTemplate: { type: Boolean, default: false },
    templateCategory: {
      type: String,
      enum: ["benzene-derivatives", "alkanes", "cyclic", "functional-groups"],
    },

    // Visual rendering
    renderData: RenderDataSchema,

    // User metadata
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
OrganicStructureSchema.index({ category: 1 });
OrganicStructureSchema.index({ createdBy: 1 });
OrganicStructureSchema.index({ isPublic: 1 });
OrganicStructureSchema.index({ tags: 1 });
OrganicStructureSchema.index({ molecularFormula: 1 });
OrganicStructureSchema.index({ name: "text", commonName: "text", iupacName: "text" });

// Virtual for id
OrganicStructureSchema.virtual("id").get(function () {
  return this._id?.toString();
});

// Ensure virtuals are included in JSON
OrganicStructureSchema.set("toJSON", { virtuals: true });
OrganicStructureSchema.set("toObject", { virtuals: true });

const OrganicStructureModel: Model<OrganicStructure> =
  mongoose.models.OrganicStructure ||
  mongoose.model<OrganicStructure>("OrganicStructure", OrganicStructureSchema);

export default OrganicStructureModel;
