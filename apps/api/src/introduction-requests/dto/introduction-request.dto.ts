import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIntroductionRequestDto {
  @IsString()
  recommendationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  /** Identifiant de l'ami dans le réseau vers qui envoyer la demande (intermédiaire). */
  @IsOptional()
  @IsString()
  viaUserId?: string;

  /** Mode de réponse privilégié demandé par l'initiateur : phone, email ou social. */
  @IsOptional()
  @IsIn(['phone', 'email', 'social'])
  responseType?: 'phone' | 'email' | 'social';
}

export class RespondIntroductionRequestDto {
  @IsIn(['accept', 'decline'])
  action!: 'accept' | 'decline';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  responseMessage?: string;

  /** Type de réponse contrôlée : phone, email ou social. */
  @IsOptional()
  @IsIn(['phone', 'email', 'social'])
  responseType?: 'phone' | 'email' | 'social';

  /** Valeur associée à la réponse contrôlée (numéro, email ou lien). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  responseValue?: string;
}
