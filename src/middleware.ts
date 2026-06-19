import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  // Protect all main content routes, allow login and api routes
  matcher: ['/', '/notes', '/inspirations', '/resources'],
};
