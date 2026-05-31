/**
 * Point d'entrée serverless pour Vercel.
 *
 * Vercel détecte le dossier `api/` et expose ce fichier comme une fonction.
 * On bootstrappe l'application NestJS une seule fois (cache entre invocations
 * pour limiter les cold starts) et on délègue chaque requête à l'instance Express
 * sous-jacente.
 *
 * Le `vercel.json` réécrit toutes les routes vers cette fonction ; le préfixe
 * global `api` de Nest fait que les endpoints répondent sur `/api/...`.
 */
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

type ExpressInstance = (req: Request, res: Response) => void;

let cachedServer: ExpressInstance | null = null;

async function bootstrapServer(): Promise<ExpressInstance> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return app.getHttpAdapter().getInstance() as ExpressInstance;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  cachedServer(req, res);
}
