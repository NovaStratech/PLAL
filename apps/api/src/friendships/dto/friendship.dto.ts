import { IsIn, IsString } from 'class-validator';

export class CreateFriendshipDto {
  @IsString()
  receiverId!: string;
}

export class RespondFriendshipDto {
  @IsIn(['accept', 'reject'])
  action!: 'accept' | 'reject';
}
