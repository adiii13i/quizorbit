import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data.token) {
            return {
              email: data.email,
              name: data.name,
              role: data.role,
              token: data.token,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.token;
      }
      if (account?.provider === "google") {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: token.name,
                email: token.email,
              }),
            }
          );
          const data = await response.json();
          token.role = data.role;
          token.accessToken = data.token;
        } catch (error) {
          console.error("Google auth error:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.role = token.role;
      session.user.accessToken = token.accessToken;
      return session;
    },

    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };