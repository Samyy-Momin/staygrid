import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async create(farmhouseId: string, createOfferDto: CreateOfferDto) {
    const farmhouse = await this.prisma.farmhouse.findUnique({
      where: { id: farmhouseId },
    });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');

    return this.prisma.offer.create({
      data: {
        ...createOfferDto,
        farmhouseId,
      },
    });
  }

  findAll(farmhouseId: string) {
    return this.prisma.offer.findMany({
      where: { farmhouseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.offer.delete({ where: { id } });
      return { message: 'Offer deleted successfully' };
    } catch {
      throw new NotFoundException('Offer not found');
    }
  }
}
