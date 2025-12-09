import mongoose, { Schema, Model } from "mongoose";
import { Element as IElement, Isotope } from "@/lib/types/element";

const IsotopeSchema = new Schema<Isotope>({
  massNumber: { type: Number, required: true },
  symbol: { type: String, required: true },
  abundance: { type: Number, default: null },
  halfLife: { type: String, default: null },
  isStable: { type: Boolean, required: true },
});

const ElementSchema = new Schema<IElement>(
  {
    atomicNumber: { type: Number, required: true, unique: true },
    symbol: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    atomicMass: { type: Number, required: true },

    // Classification
    category: { type: String, required: true },
    group: { type: Number, default: null },
    period: { type: Number, required: true },
    block: { type: String, required: true },

    // Electronic Structure
    electronConfiguration: { type: String, required: true },
    electronsPerShell: { type: [Number], required: true },

    // Physical Properties
    phase: { type: String, required: true },
    meltingPoint: { type: Number, default: null },
    boilingPoint: { type: Number, default: null },
    density: { type: Number, default: null },

    // Chemical Properties
    electronegativity: { type: Number, default: null },
    atomicRadius: { type: Number, default: null },
    ionizationEnergy: { type: Number, default: null },
    oxidationStates: { type: [Number], default: [] },

    // Discovery
    discoveredBy: { type: String, default: null },
    yearDiscovered: { type: Number, default: null },

    // Nuclear
    isRadioactive: { type: Boolean, required: true },
    halfLife: { type: String, default: null },

    // Visual
    color: { type: String, required: true },
    cpkColor: { type: String, default: null },

    // Content
    summary: { type: String, required: true },

    // Grid Position
    gridRow: { type: Number, required: true },
    gridColumn: { type: Number, required: true },

    // Isotopes
    isotopes: { type: [IsotopeSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
ElementSchema.index({ atomicNumber: 1 });
ElementSchema.index({ symbol: 1 });
ElementSchema.index({ category: 1 });

const ElementModel: Model<IElement> =
  mongoose.models.Element || mongoose.model<IElement>("Element", ElementSchema);

export default ElementModel;
