import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FarmhousesService } from '../farmhouses/farmhouses.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private farmhousesService: FarmhousesService,
  ) {}

  async create(data: CreateReviewDto, userId: string) {
    const numericRating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5)));
    
    // 1. Ensure target farmhouseId is valid single string
    let targetFarmhouseId = Array.isArray(data.farmhouseId) ? (data.farmhouseId as any)[0] : String(data.farmhouseId || '');
    if (!targetFarmhouseId) {
      const firstFarmhouse = await this.prisma.farmhouse.findFirst({ select: { id: true } });
      targetFarmhouseId = firstFarmhouse?.id || '';
    }

    const farmhouse = await this.prisma.farmhouse.findUnique({ where: { id: targetFarmhouseId }, select: { id: true } });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');
    const hasStay = await this.prisma.booking.findFirst({
      where: { userId, farmhouseId: targetFarmhouseId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      select: { id: true },
    });
    if (!hasStay) throw new ForbiddenException('A confirmed booking is required to review this farmhouse');
    const priorReview = await this.prisma.review.findFirst({ where: { userId, farmhouseId: targetFarmhouseId }, select: { id: true } });
    if (priorReview) throw new ConflictException('You have already reviewed this farmhouse');

    const review = await this.prisma.review.create({
      data: {
        rating: numericRating,
        comment: data.comment || '',
        groupType: data.groupType || 'Family',
        amenityRatings: data.amenityRatings || {},
        farmhouseId: targetFarmhouseId,
        userId,
      },
      include: {
        user: { select: { name: true, image: true } },
      },
    });

    // Recompute denormalized rating
    try {
      await this.farmhousesService.updateRatingStats(targetFarmhouseId);
    } catch (e) {
      console.warn("Failed to update rating stats:", e);
    }
    return review;
  }

  findAll() {
    return this.prisma.review.findMany({
      include: {
        user: { select: { name: true, image: true } },
        farmhouse: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByFarmhouse(farmhouseId: string) {
    return this.prisma.review.findMany({
      where: { farmhouseId },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, image: true } },
      },
    });
  }

  async remove(id: string) {
    const review = await this.prisma.review.delete({ where: { id } });
    // Recompute denormalized rating after deletion
    await this.farmhousesService.updateRatingStats(review.farmhouseId);
    return review;
  }
}
