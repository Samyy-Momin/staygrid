export class CreateReviewDto {
  rating: number;
  comment?: string;
  farmhouseId: string;
  userId: string;
  groupType?: string;
  amenityRatings?: Record<string, number>;
}
