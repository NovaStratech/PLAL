import { Injectable } from '@nestjs/common';
import type { Category } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategorySuggestionDto } from './dto/category-suggestion.dto';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Category[]> {
    const rows: CategoryRow[] = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, slug: true, name: true, parentId: true },
    });
    return this.toTree(rows);
  }

  private toTree(rows: CategoryRow[]): Category[] {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    for (const row of rows) {
      map.set(row.id, { ...row, children: [] });
    }

    for (const row of rows) {
      const node = map.get(row.id)!;
      if (row.parentId) {
        const parent = map.get(row.parentId);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async suggest(userId: string, dto: CreateCategorySuggestionDto) {
    const slug = this.slugify(dto.name);
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return { success: true, message: 'Cette catégorie existe déjà.', suggestionId: null };
    }

    const suggestion = await this.prisma.categorySuggestion.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
      },
    });

    return {
      success: true,
      message: 'Merci pour ta suggestion. Elle sera examinée rapidement.',
      suggestionId: suggestion.id,
    };
  }

  private slugify(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
