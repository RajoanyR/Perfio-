import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  id_utilisateur: number;

  @IsString()
  type: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  est_lue?: boolean;
}
