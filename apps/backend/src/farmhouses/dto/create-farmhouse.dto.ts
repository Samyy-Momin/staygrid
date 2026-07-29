import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsArray, IsBoolean } from 'class-validator';

export class CreateFarmhouseDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price12Hours: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price24Hours: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxIncludedGuests?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraGuestFee?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isCoupleFriendly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPetFriendly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBestMatch?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;

  // Location
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactNumbers?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tokenAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isWheelchairAccessible?: boolean;

  // Outdoor
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasPool?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  poolType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  poolSize?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  babyPoolSize?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasTurf?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasRainDance?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasPlayArea?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasGardenArea?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasGazebo?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasCelebrationArea?: boolean;

  // Indoor (Rooms)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  roomCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acRoomCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nonAcRoomCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hallCount?: number;

  // Beds
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  singleBedCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  doubleBedCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraMattressCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balconyCount?: number;

  // Kitchen
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasKitchen?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasFridge?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasRoWater?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasBbq?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasGas?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  gasCharge?: number;

  // Indoor Games
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasCarom?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasUno?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasTeenPatti?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasChess?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  has8BallPool?: boolean;

  // Electronics
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasTv?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasSpeakers?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasMicrophone?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
