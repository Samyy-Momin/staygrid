import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  create(createReviewDto: CreateReviewDto) {
    return this.prisma.review.create({
      data: createReviewDto,
    });
  }

  findAll() {
    return this.prisma.review.findMany({
      include: {
        user: {
          select: { name: true, image: true }
        },
        farmhouse: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(id: string) {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, image: true }
        }
      }
    });
  }

  update(id: string, updateReviewDto: UpdateReviewDto) {
    return this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
    });
  }

  remove(id: string) {
    return this.prisma.review.delete({
      where: { id },
    });
  }
}
