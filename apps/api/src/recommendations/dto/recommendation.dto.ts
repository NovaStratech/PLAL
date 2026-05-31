import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RecommendationType, RecommendationVisibility } from '@plal/shared';

export class CreateRecommendationDto {
  @IsString()
  categoryId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsEnum(RecommendationType)
  type!: RecommendationType;

  @IsOptional()
  @IsEnum(RecommendationVisibility)
  visibility?: RecommendationVisibility;
}

export class UpdateRecommendationDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;

  @IsOptional()
  @IsEnum(RecommendationVisibility)
  visibility?: RecommendationVisibility;
}
