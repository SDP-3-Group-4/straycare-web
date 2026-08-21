import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin) || corsOrigins.includes('*')) return cb(null, true);
      if (origin.endsWith('.vercel.app')) return cb(null, true);
      const wildcardAllowed = corsOrigins.some((p) => {
        if (!p.includes('*')) return false;
        const re = new RegExp('^' + p.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return re.test(origin);
      });
      if (wildcardAllowed) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
  });

  // Increase payload limit to handle base64 image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
