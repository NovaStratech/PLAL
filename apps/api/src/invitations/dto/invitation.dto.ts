import { IsEmail, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}
