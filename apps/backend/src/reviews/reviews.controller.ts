import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; [key: string]: any };
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Req() req: any, @Body() createReviewDto: CreateReviewDto) {
    const userId = req.user?.id || createReviewDto.userId || 'guest_user';
    return this.reviewsService.create({
      ...createReviewDto,
      userId,
    });
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('farmhouse/:farmhouseId')
  findByFarmhouse(@Param('farmhouseId') farmhouseId: string) {
    return this.reviewsService.findByFarmhouse(farmhouseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
