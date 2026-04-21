import CredentialsProviderModule from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const CredentialsProvider =
  CredentialsProviderModule.default ?? CredentialsProviderModule;

export const authOptions = {
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      
      // Handle the first time a user signs in via OAuth
      if (account && user) {
        // Check if the user has completed onboarding
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { academicStatus: true, targetRole: true }
        });
        
        token.needsOnboarding = !dbUser?.academicStatus || !dbUser?.targetRole;
      }

      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.needsOnboarding = token.needsOnboarding;
        
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            academicStatus: true,
            targetRole: true,
            preparationLevel: true
          }
        });
        
        if (dbUser) {
          session.user.academicStatus = dbUser.academicStatus;
          session.user.targetRole = dbUser.targetRole;
          session.user.preparationLevel = dbUser.preparationLevel;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      console.log("[NextAuth][event] User created:", user.email);
    }
  },
};
