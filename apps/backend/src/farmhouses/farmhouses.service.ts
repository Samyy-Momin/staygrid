import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmhouseDto } from './dto/create-farmhouse.dto';

@Injectable()
export class FarmhousesService {
  constructor(private prisma: PrismaService) {}

  async create(createFarmhouseDto: CreateFarmhouseDto, ownerId: string) {
    return this.prisma.farmhouse.create({
      data: {
        title: createFarmhouseDto.title,
        description: createFarmhouseDto.description,
        pricePerNight: createFarmhouseDto.pricePerNight,
        capacity: createFarmhouseDto.capacity,
        poolSize: createFarmhouseDto.poolSize,
        amenities: createFarmhouseDto.amenities || [],
        photos: createFarmhouseDto.photos || [],
        ownerId,
      },
    });
  }

  async findAll() {
    return this.prisma.farmhouse.findMany({
      include: { owner: { select: { name: true, phone: true } } },
    });
  }

  async findOne(id: string) {
    const farmhouse = await this.prisma.farmhouse.findUnique({
      where: { id },
      include: { owner: { select: { name: true, phone: true } } },
    });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');
    return farmhouse;
  }

  async update(id: string, updateData: Partial<CreateFarmhouseDto>) {
    return this.prisma.farmhouse.update({
      where: { id },
      data: updateData,
    });
  }

  async toggleStatus(id: string, isActive: boolean) {
    return this.prisma.farmhouse.update({
      where: { id },
      data: { isActive },
    });
  }

  async getStats() {
    const [farmhouses, owners, users, bookings] = await Promise.all([
      this.prisma.farmhouse.count(),
      this.prisma.user.count({ where: { role: 'OWNER' } }),
      this.prisma.user.count(),
      this.prisma.booking.count(),
    ]);

    return {
      farmhouses,
      owners,
      users,
      activeBookings: bookings,
    };
  }

  async remove(id: string) {
    try {
      await this.prisma.farmhouse.delete({
        where: { id },
      });
      return { message: 'Farmhouse deleted successfully' };
    } catch (error) {
      throw new NotFoundException('Failed to delete farmhouse.');
    }
  }
}
