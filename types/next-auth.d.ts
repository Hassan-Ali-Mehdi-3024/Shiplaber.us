import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'SUPER_ADMIN' | 'RESELLER' | 'USER' | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: 'SUPER_ADMIN' | 'RESELLER' | 'USER' | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    role?: 'SUPER_ADMIN' | 'RESELLER' | 'USER' | null;
  }
}