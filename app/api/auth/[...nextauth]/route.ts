import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/db/mongodb-client"
import type { Adapter } from "next-auth/adapters"
import { isOrganizationalEmail, getEmailRejectionMessage } from "@/lib/utils/email-validation"

// Check if Google OAuth is configured
const isGoogleConfigured =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== "your-google-client-id" &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== "your-google-client-secret"

// Check if Microsoft Azure AD is configured
const isMicrosoftConfigured =
  process.env.AZURE_AD_CLIENT_ID &&
  process.env.AZURE_AD_CLIENT_ID !== "your-azure-ad-client-id" &&
  process.env.AZURE_AD_CLIENT_SECRET &&
  process.env.AZURE_AD_CLIENT_SECRET !== "your-azure-ad-client-secret" &&
  process.env.AZURE_AD_TENANT_ID

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  providers: [
    ...(isGoogleConfigured ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "select_account",
          },
        },
      }),
    ] : []),
    ...(isMicrosoftConfigured ? [
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        tenantId: process.env.AZURE_AD_TENANT_ID || "common",
        authorization: {
          params: {
            scope: "openid profile email User.Read",
            prompt: "select_account",
          },
        },
      }),
    ] : []),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only validate Microsoft SSO logins for organizational email
      if (account?.provider === "azure-ad") {
        const email = user.email;

        if (!email) {
          console.error("Microsoft SSO: No email provided");
          return `/login?error=provider_error&message=${encodeURIComponent(
            "Microsoft did not provide an email address. Please ensure your Microsoft account has a valid email."
          )}`;
        }

        // Check if personal Microsoft account
        const domain = email.split('@')[1]?.toLowerCase();
        const personalDomains = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'passport.com'];

        if (domain && personalDomains.includes(domain)) {
          console.warn(`Microsoft SSO: Rejected personal account - ${email}`);
          return `/login?error=personal_account&message=${encodeURIComponent(
            getEmailRejectionMessage(email)
          )}`;
        }

        // Validate organizational email (whitelist/blocklist)
        if (!isOrganizationalEmail(email)) {
          console.warn(`Microsoft SSO: Domain not authorized - ${email}`);
          return `/login?error=domain_not_authorized&message=${encodeURIComponent(
            getEmailRejectionMessage(email)
          )}`;
        }

        console.log(`Microsoft SSO: Approved organizational account - ${email}`);
      }

      // Allow all Google logins (existing behavior)
      return true;
    },
    session: async ({ session, user }) => {
      if (session?.user && user) {
        session.user.id = user.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
