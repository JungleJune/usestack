import "server-only";

import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { isValidEmail, normalizeEmail } from "@/lib/security.mjs";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = normalizeEmail(credentials?.email);
      const password = credentials?.password;

      if (!isValidEmail(email) || typeof password !== "string") {
        throw new Error("Invalid email or password");
      }

      const { data: user, error } = await getSupabaseAdmin()
        .from("users")
        .select("id, name, email, password, role")
        .eq("email", email)
        .single();

      if (error || !user?.password) {
        throw new Error("Invalid email or password");
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        throw new Error("Invalid email or password");
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      };
    },
  })
);

export const authOptions = {
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
        token.email = user.email;
      }
      if (account) token.provider = account.provider;

      if (token.id) {
        const { data } = await getSupabaseAdmin()
          .from("users")
          .select("role")
          .eq("id", token.id)
          .single();
        if (data?.role) token.role = data.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.provider = token.provider;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signUp: "/signup",
    error: "/login",
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
};
