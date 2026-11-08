import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FarmhousesService } from '../farmhouses/farmhouses.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private farmhousesService: FarmhousesService,
  ) {}

  async create(data: CreateReviewDto & { userId: string }) {
    const numericRating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5)));
    
    // 1. Ensure target farmhouseId is valid single string
    let targetFarmhouseId = Array.isArray(data.farmhouseId) ? (data.farmhouseId as any)[0] : String(data.farmhouseId || '');
    if (!targetFarmhouseId) {
      const firstFarmhouse = await this.prisma.farmhouse.findFirst({ select: { id: true } });
      targetFarmhouseId = firstFarmhouse?.id || '';
    }

    // 2. Ensure userId exists in Prisma user table to prevent Foreign Key failure
    const userIdStr = Array.isArray(data.userId) ? (data.userId as any)[0] : String(data.userId || 'guest_user');
    const existingUser = await this.prisma.user.findUnique({ where: { id: userIdStr } });
    if (!existingUser) {
      await this.prisma.user.create({
        data: {
          id: userIdStr,
          email: `user_${userIdStr.slice(-6)}@staygrid.in`,
          name: 'StayGrid Guest',
          phone: '+919999999999',
        },
      }).catch(() => null);
    }

    const review = await this.prisma.review.create({
      data: {
        rating: numericRating,
        comment: data.comment || '',
        groupType: data.groupType || 'Family',
        amenityRatings: data.amenityRatings || {},
        farmhouseId: targetFarmhouseId,
        userId: userIdStr,
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
