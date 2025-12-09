import mongoose, { Schema, Model } from "mongoose";
import { User as IUser } from "@/lib/types/user";

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, default: null },
    image: { type: String, default: null },

    // OAuth
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ providerId: 1 });

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
