import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmhouseDto } from './dto/create-farmhouse.dto';
import { validateFarmhousePrices } from '../common/utils/price-validator';
import { Role } from '@prisma/client';

@Injectable()
export class FarmhousesService {
  constructor(private prisma: PrismaService) {}

  async findCancelledDeals() {
    const cancelledBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CANCELLED',
      },
      select: { farmhouseId: true },
      distinct: ['farmhouseId'],
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const farmhouseIds = cancelledBookings.map((b) => b.farmhouseId);

    if (farmhouseIds.length === 0) {
      return [];
    }

    return this.prisma.farmhouse.findMany({
      where: {
        id: { in: farmhouseIds },
        isActive: true,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async create(createFarmhouseDto: CreateFarmhouseDto, ownerId: string) {
    const priceValidation = validateFarmhousePrices(createFarmhouseDto.price12Hours, createFarmhouseDto.price24Hours);
    if (!priceValidation.isValid) {
      throw new BadRequestException(priceValidation.error);
    }

    return this.prisma.farmhouse.create({
      data: {
        title: createFarmhouseDto.title,
        price12Hours: priceValidation.price12Hours!,
        price24Hours: priceValidation.price24Hours!,
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
        
        // Beds & Furniture
        singleBedCount: createFarmhouseDto.singleBedCount ?? 0,
        doubleBedCount: createFarmhouseDto.doubleBedCount ?? 0,
        extraMattressCount: createFarmhouseDto.extraMattressCount ?? 0,
        sofaCount: createFarmhouseDto.sofaCount ?? 0,
        balconyCount: createFarmhouseDto.balconyCount ?? 0,
        terraceCount: createFarmhouseDto.terraceCount ?? 0,
        
        // Kitchen
        hasKitchen: createFarmhouseDto.hasKitchen ?? false,
        hasFridge: createFarmhouseDto.hasFridge ?? false,
        hasRoWater: createFarmhouseDto.hasRoWater ?? false,
        hasBbq: createFarmhouseDto.hasBbq ?? false,
        hasGas: createFarmhouseDto.hasGas ?? false,
        gasCharge: createFarmhouseDto.gasCharge,
        
        // Indoor Games
        hasCarom: createFarmhouseDto.hasCarom ?? false,
        hasChess: createFarmhouseDto.hasChess ?? false,
        has8BallPool: createFarmhouseDto.has8BallPool ?? false,
        hasCricket: createFarmhouseDto.hasCricket ?? false,
        hasBadminton: createFarmhouseDto.hasBadminton ?? false,
        
        // Electronics
        hasTv: createFarmhouseDto.hasTv ?? false,
        hasSpeakers: createFarmhouseDto.hasSpeakers ?? false,
        hasMicrophone: createFarmhouseDto.hasMicrophone ?? false,
        hasWifi: createFarmhouseDto.hasWifi ?? false,

        // Custom
        customAmenities: createFarmhouseDto.customAmenities || [],
        hostName: createFarmhouseDto.hostName,

        // Max capacity
        maxIncludedGuests: createFarmhouseDto.maxIncludedGuests,
        extraGuestFee: createFarmhouseDto.extraGuestFee,
      },
    });
  }

  async getDistinctLocations() {
    const list = await this.prisma.farmhouse.findMany({
      where: { isActive: true },
      select: { city: true },
    });
    
    const cityCounts: Record<string, number> = {};
    const defaultCities = ['Bhiwandi', 'Mahapoli', 'Padgha', 'Mahabaleshwar', 'Lonavala', 'Karjat', 'Igatpuri', 'Shahapur'];
    
    defaultCities.forEach(c => { cityCounts[c] = 0; });

    list.forEach(f => {
      if (f.city && f.city.trim()) {
        const c = f.city.trim();
        cityCounts[c] = (cityCounts[c] || 0) + 1;
      }
    });

    return Object.keys(cityCounts).map(name => ({
      name,
      count: cityCounts[name] || 0,
    }));
  }

  async findAll(search?: string, page: number = 1, limit: number = 20, filters?: any, sortBy?: string) {
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
      if (filters.city) {
        whereClause.city = { contains: filters.city, mode: 'insensitive' };
      }
    }

    const [rawList, total] = await Promise.all([
      this.prisma.farmhouse.findMany({
        where: whereClause,
        include: {
          owner: { select: { name: true, phone: true } },
          reviews: { select: { rating: true } }
        },
        skip,
        take: limit,
        orderBy: sortBy === 'rating' ? { avgRating: 'desc' as const } : { createdAt: 'desc' as const }
      }),
      this.prisma.farmhouse.count({ where: whereClause })
    ]);

    const data = rawList.map((f: any) => {
      const reviewCount = f.reviews?.length || 0;
      const totalRatingSum = f.reviews ? f.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) : 0;
      const avgRating = reviewCount > 0 ? Number((totalRatingSum / reviewCount).toFixed(1)) : (f.avgRating || 5.0);

      return {
        ...f,
        reviewCount,
        avgRating,
        averageRating: avgRating,
      };
    });

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
        reviews: {
          include: {
            user: { select: { id: true, name: true, image: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        offers: true,
        exploreMedia: {
          orderBy: { createdAt: 'desc' }
        },
      }
    });
    
    if (!farmhouse) {
      throw new NotFoundException(`Farmhouse with ID ${id} not found`);
    }

    const reviewCount = farmhouse.reviews.length;
    const totalRatingSum = farmhouse.reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = reviewCount > 0 ? Number((totalRatingSum / reviewCount).toFixed(1)) : 5.0;

    return {
      ...farmhouse,
      reviewCount,
      avgRating,
      averageRating: avgRating,
    };
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
    const existing = await this.prisma.farmhouse.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Farmhouse with ID ${id} not found`);
    }

    const new12H = updateData.price12Hours !== undefined ? updateData.price12Hours : existing.price12Hours;
    const new24H = updateData.price24Hours !== undefined ? updateData.price24Hours : existing.price24Hours;

    const priceValidation = validateFarmhousePrices(new12H, new24H);
    if (!priceValidation.isValid) {
      throw new BadRequestException(priceValidation.error);
    }

    updateData.price12Hours = priceValidation.price12Hours!;
    updateData.price24Hours = priceValidation.price24Hours!;

    return this.prisma.farmhouse.update({
      where: { id },
      data: updateData,
    });
  }

  async deletePricingOverride(id: string) {
    return this.prisma.pricingOverride.delete({
      where: { id },
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

  async getPricingOverrides(farmhouseId: string) {
    return this.prisma.pricingOverride.findMany({
      where: { farmhouseId },
      orderBy: { date: 'asc' },
    });
  }

  async upsertPricingOverride(farmhouseId: string, data: { date: string; price12Hours?: number; price24Hours?: number; label?: string; type: string }) {
    const targetDate = new Date(data.date);
    targetDate.setHours(0, 0, 0, 0);

    return this.prisma.pricingOverride.upsert({
      where: {
        farmhouseId_date: {
          farmhouseId,
          date: targetDate,
        },
      },
      update: {
        price12Hours: data.price12Hours,
        price24Hours: data.price24Hours,
        label: data.label,
        type: data.type,
      },
      create: {
        farmhouseId,
        date: targetDate,
        price12Hours: data.price12Hours,
        price24Hours: data.price24Hours,
        label: data.label,
        type: data.type,
      },
    });
  }

  async toggleStatus(id: string, isActive: boolean) {
    const now = new Date();
    const activeBookingsCount = await this.prisma.booking.count({
      where: {
        farmhouseId: id,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'SAVED'] },
        checkOut: { gte: now },
      },
    });

    const farmhouse = await this.prisma.farmhouse.update({
      where: { id },
      data: { isActive },
    });

    return {
      farmhouse,
      activeBookingsCount,
      notice: !isActive && activeBookingsCount > 0
        ? `Archiving will prevent new bookings, but ${activeBookingsCount} existing booking(s) will remain active.`
        : `Farmhouse status updated to ${isActive ? 'Active' : 'Inactive'}.`,
    };
  }

  async remove(id: string) {
    const farmhouse = await this.prisma.farmhouse.findUnique({ where: { id } });
    if (!farmhouse) {
      throw new NotFoundException(`Farmhouse not found`);
    }

    const now = new Date();
    const activeBookingsCount = await this.prisma.booking.count({
      where: {
        farmhouseId: id,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'SAVED'] },
        checkOut: { gte: now },
      },
    });

    if (activeBookingsCount > 0) {
      throw new BadRequestException(
        `This farmhouse has ${activeBookingsCount} upcoming booking(s). You cannot archive or delete it until these bookings are resolved.`
      );
    }

    try {
      await this.prisma.farmhouse.delete({
        where: { id },
      });
      return { message: 'Farmhouse deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete farmhouse. Please ensure all related records are removed first.');
    }
  }

  async blockDateRange(
    farmhouseId: string,
    startDate: string,
    endDate: string,
    note?: string,
    userRole?: string,
  ) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const targetStart = new Date(startDate);
    targetStart.setHours(0, 0, 0, 0);

    if (userRole === Role.OWNER && targetStart < todayStart) {
      throw new BadRequestException('Past dates cannot be blocked by Owner Admin accounts. System Admin privileges required.');
    }

    const reqStart = new Date(startDate);
    const reqEnd = new Date(endDate);

    // Check collisions with existing active Bookings
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        farmhouseId,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'SAVED'] },
        AND: [
          { checkIn: { lt: reqEnd } },
          { checkOut: { gt: reqStart } },
        ],
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException('⚠️ This property is already booked for the selected dates via app booking.');
    }

    // Check collisions with existing BlockedDateRanges
    const overlappingBlock = await this.prisma.blockedDateRange.findFirst({
      where: {
        farmhouseId,
        AND: [
          { startDate: { lt: reqEnd } },
          { endDate: { gt: reqStart } },
        ],
      },
    });

    if (overlappingBlock) {
      throw new BadRequestException('⚠️ This property is already blocked for the selected dates.');
    }

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

  async updateRatingStats(farmhouseId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { farmhouseId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.farmhouse.update({
      where: { id: farmhouseId },
      data: {
        avgRating: Math.round((agg._avg.rating || 0) * 10) / 10,
        reviewCount: agg._count.rating || 0,
      },
    });
  }
}
