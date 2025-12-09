export interface User {
  _id?: string;
  email: string; // User email (unique)
  name: string | null; // Display name
  image: string | null; // Profile image URL

  // OAuth
  provider: string; // "google"
  providerId: string; // Google account ID

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
