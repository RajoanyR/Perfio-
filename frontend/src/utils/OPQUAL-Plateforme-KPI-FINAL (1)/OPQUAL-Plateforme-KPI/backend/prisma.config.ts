import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 : l'URL de connexion se déclare ici (et non plus dans schema.prisma).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
