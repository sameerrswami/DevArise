import { authOptions } from "@/lib/auth";
import NextAuthModule from "next-auth";

const NextAuth = NextAuthModule.default ?? NextAuthModule;
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

// Export the NextAuth handler directly for the App Router. Using a custom
// GET/POST wrapper can change the shape of the `req` object passed to
// NextAuth and cause runtime errors like "req.query is undefined".
export { handler as GET, handler as POST };
