import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'sayniq-secret-fallback-key-12345',
});

export const config = {
  // Protect all main content routes, allow login and api routes
  matcher: ['/', '/notes', '/inspirations', '/resources'],
};
