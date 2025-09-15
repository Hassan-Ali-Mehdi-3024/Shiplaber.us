// Global type definitions
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL: string;
    SHIPPO_API_KEY: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
  }
}