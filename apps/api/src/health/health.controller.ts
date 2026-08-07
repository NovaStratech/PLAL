import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        uptime: process.uptime(),
        database: 'connected',
        latencyMs: Date.now() - startedAt,
        version: '2.0.0',
      };
    } catch {
      return {
        status: 'error',
        uptime: process.uptime(),
        database: 'disconnected',
        latencyMs: Date.now() - startedAt,
        version: '2.0.0',
      };
    }
  }
}
