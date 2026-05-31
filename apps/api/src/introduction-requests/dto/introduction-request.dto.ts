import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIntroductionRequestDto {
  @IsString()
  recommendationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;
}

export class RespondIntroductionRequestDto {
  @IsIn(['accept', 'decline'])
  action!: 'accept' | 'decline';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  responseMessage?: string;
}
