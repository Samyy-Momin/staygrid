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
        price12Hours: createFarmhouseDto.price12Hours,
        price24Hours: createFarmhouseDto.price24Hours,
        capacity: createFarmhouseDto.capacity,
        photos: createFarmhouseDto.photos || [],
        isActive: createFarmhouseDto.isActive ?? true,
        isFeatured: createFarmhouseDto.isFeatured ?? false,
        isCoupleFriendly: createFarmhouseDto.isCoupleFriendly ?? false,
        isPetFriendly: createFarmhouseDto.isPetFriendly ?? false,
        isBestMatch: createFarmhouseDto.isBestMatch ?? false,
        isTrusted: createFarmhouseDto.isTrusted ?? false,
        ownerId,
        
        streetAddress: createFarmhouseDto.streetAddress,
        city: createFarmhouseDto.city,
        state: createFarmhouseDto.state,
        country: createFarmhouseDto.country || 'India',
        postalCode: createFarmhouseDto.postalCode,
        latitude: createFarmhouseDto.latitude,
        longitude: createFarmhouseDto.longitude,
        
        contactNumbers: createFarmhouseDto.contactNumbers || [],
        tokenAmount: createFarmhouseDto.tokenAmount ?? 2000,
        isWheelchairAccessible: createFarmhouseDto.isWheelchairAccessible ?? false,
        
        // Outdoor
        hasPool: createFarmhouseDto.hasPool ?? false,
        poolType: createFarmhouseDto.poolType,
        poolSize: createFarmhouseDto.poolSize,
        babyPoolSize: createFarmhouseDto.babyPoolSize,
        hasTurf: createFarmhouseDto.hasTurf ?? false,
        hasRainDance: createFarmhouseDto.hasRainDance ?? false,
        hasPlayArea: createFarmhouseDto.hasPlayArea ?? false,
        hasGardenArea: createFarmhouseDto.hasGardenArea ?? false,
        hasGazebo: createFarmhouseDto.hasGazebo ?? false,
        hasCelebrationArea: createFarmhouseDto.hasCelebrationArea ?? false,

        // Indoor (Rooms)
        roomCount: createFarmhouseDto.roomCount ?? 1,
        acRoomCount: createFarmhouseDto.acRoomCount ?? 0,
        nonAcRoomCount: createFarmhouseDto.nonAcRoomCount ?? 0,
        hallCount: createFarmhouseDto.hallCount ?? 0,
        
        // Beds
        singleBedCount: createFarmhouseDto.singleBedCount ?? 0,
        doubleBedCount: createFarmhouseDto.doubleBedCount ?? 0,
        extraMattressCount: createFarmhouseDto.extraMattressCount ?? 0,
        balconyCount: createFarmhouseDto.balconyCount ?? 0,
        
        // Kitchen
        hasKitchen: createFarmhouseDto.hasKitchen ?? false,
        hasFridge: createFarmhouseDto.hasFridge ?? false,
        hasRoWater: createFarmhouseDto.hasRoWater ?? false,
        hasBbq: createFarmhouseDto.hasBbq ?? false,
        hasGas: createFarmhouseDto.hasGas ?? false,
        gasCharge: createFarmhouseDto.gasCharge,
        
        // Indoor Games
        hasCarom: createFarmhouseDto.hasCarom ?? false,
        hasUno: createFarmhouseDto.hasUno ?? false,
        hasTeenPatti: createFarmhouseDto.hasTeenPatti ?? false,
        hasChess: createFarmhouseDto.hasChess ?? false,
        has8BallPool: createFarmhouseDto.has8BallPool ?? false,
        
        // Electronics
        hasTv: createFarmhouseDto.hasTv ?? false,
        hasSpeakers: createFarmhouseDto.hasSpeakers ?? false,
        hasMicrophone: createFarmhouseDto.hasMicrophone ?? false,
        hasWifi: createFarmhouseDto.hasWifi ?? false,
      },
    });
  }

  async findAll(search?: string, page: number = 1, limit: number = 20, filters?: any) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (filters) {
      if (filters.isFeatured) whereClause.isFeatured = true;
      if (filters.hasPool) whereClause.hasPool = true;
      if (filters.hasTurf) whereClause.hasTurf = true;
      if (filters.isPetFriendly) whereClause.isPetFriendly = true;
      if (filters.isCoupleFriendly) whereClause.isCoupleFriendly = true;
    }

    const [data, total] = await Promise.all([
      this.prisma.farmhouse.findMany({
        where: whereClause,
        include: { owner: { select: { name: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.farmhouse.count({ where: whereClause })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByOwner(ownerId: string, search?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = { ownerId };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.farmhouse.findMany({
        where: whereClause,
        include: { owner: { select: { name: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.farmhouse.count({ where: whereClause })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const farmhouse = await this.prisma.farmhouse.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        reviews: true,
        offers: true,
      }
    });
    
    if (!farmhouse) {
      throw new NotFoundException(`Farmhouse with ID ${id} not found`);
    }
    return farmhouse;
  }

  async getAvailability(id: string) {
    // Return dates where booking is paid/confirmed or block out dates manually set by owner
    const bookings = await this.prisma.booking.findMany({
      where: {
        farmhouseId: id,
        status: {
          in: ['CONFIRMED', 'COMPLETED']
        }
      },
      select: {
        checkIn: true,
        checkOut: true
      }
    });

    const blockedDates = await this.prisma.blockedDateRange.findMany({
      where: { farmhouseId: id },
      select: { startDate: true, endDate: true }
    });

    const unavailableDates: string[] = [];

    const addDatesInRange = (start: Date, end: Date) => {
      let current = new Date(start);
      // We only care about the date part
      current.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(0, 0, 0, 0);

      while (current <= endDate) {
        unavailableDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    };

    bookings.forEach(b => addDatesInRange(b.checkIn, b.checkOut));
    blockedDates.forEach(b => addDatesInRange(b.startDate, b.endDate));

    return [...new Set(unavailableDates)]; // return unique dates

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
    const [farmhouses, owners, users, totalBookings, activeBookings] = await Promise.all([
      this.prisma.farmhouse.count(),
      this.prisma.user.count({ where: { role: 'OWNER' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: { status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'SAVED'] } },
      }),
    ]);

    return {
      farmhouses,
      owners,
      users,
      bookings: activeBookings || totalBookings,
      activeBookings: activeBookings || totalBookings,
      totalBookings,
    };
  }

  async getOwnerStats(ownerId: string) {
    const [farmhouses, bookings, revenueData] = await Promise.all([
      this.prisma.farmhouse.count({ where: { ownerId } }),
      this.prisma.booking.count({
        where: {
          farmhouse: { ownerId },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          farmhouse: { ownerId },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      farmhouses,
      activeBookings: bookings,
      totalRevenue: revenueData._sum.totalAmount || 0,
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

  async blockDateRange(
    farmhouseId: string,
    startDate: string,
    endDate: string,
    note?: string,
  ) {
    return this.prisma.blockedDateRange.create({
      data: {
        farmhouseId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        note,
      },
    });
  }

  async getBlockedDates(farmhouseId: string) {
    return this.prisma.blockedDateRange.findMany({
      where: { farmhouseId },
    });
  }

  async getBlockedDateById(id: string) {
    return this.prisma.blockedDateRange.findUnique({
      where: { id },
    });
  }

  async removeBlockedDateRange(id: string) {
    return this.prisma.blockedDateRange.delete({
      where: { id },
    });
  }
}
