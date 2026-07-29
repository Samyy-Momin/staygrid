import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateHeroBannerDto {
  @IsString()
  heading: string;

  @IsOptional()
  @IsString()
  subheading?: string;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}
