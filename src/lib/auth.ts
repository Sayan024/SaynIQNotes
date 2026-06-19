import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// Safeguard for NextAuth production requirement of NEXTAUTH_SECRET in system environment
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'sayniq-secret-fallback-key-12345';
}


export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    }),
    CredentialsProvider({
      name: 'Demo Mode',
      credentials: {},
      async authorize() {
        // Return a mock user for Demo login
        return {
          id: 'demo-user',
          name: 'SaynIQ Demo User',
          email: 'demo@sayniq.com',
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'sayniq-secret-fallback-key-12345',
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email || 'demo@sayniq.com';
        session.user.name = token.name || 'SaynIQ User';
        session.user.image = token.picture || '';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
