import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePricingOverrideDto, BulkWeekendPricingDto } from './dto/create-pricing-override.dto';
import { validateFarmhousePrices } from '../common/utils/price-validator';
import { istDay } from '../common/utils/ist-date';
import { Role } from '@prisma/client';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async getOverrides(farmhouseId: string, month?: string) {
    const whereClause: any = { farmhouseId };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      const startOfMonth = new Date(Date.UTC(year, m - 1, 1));
      const endOfMonth = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      whereClause.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    return this.prisma.pricingOverride.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });
  }

  private async assertOwnerAccess(farmhouseId: string, actorId: string, role: Role) {
    if (role === Role.ADMIN) return;
    const farmhouse = await this.prisma.farmhouse.findUnique({ where: { id: farmhouseId }, select: { ownerId: true } });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');
    if (farmhouse.ownerId !== actorId) throw new BadRequestException('You do not own this farmhouse');
  }

  async createOrUpdateOverride(dto: CreatePricingOverrideDto, actorId: string, role: Role) {
    await this.assertOwnerAccess(dto.farmhouseId, actorId, role);
    const farmhouse = await this.prisma.farmhouse.findUnique({ where: { id: dto.farmhouseId } });
    if (!farmhouse) {
      throw new NotFoundException(`Farmhouse not found`);
    }

    const check12H = dto.price12Hours !== undefined ? dto.price12Hours : farmhouse.price12Hours;
    const check24H = dto.price24Hours !== undefined ? dto.price24Hours : farmhouse.price24Hours;

    const priceValidation = validateFarmhousePrices(check12H, check24H);
    if (!priceValidation.isValid) {
      throw new BadRequestException(priceValidation.error);
    }

    const targetDate = istDay(dto.date);

    return this.prisma.pricingOverride.upsert({
      where: {
        farmhouseId_date: {
          farmhouseId: dto.farmhouseId,
          date: targetDate,
        },
      },
      update: {
        price12Hours: dto.price12Hours !== undefined ? priceValidation.price12Hours : undefined,
        price24Hours: dto.price24Hours !== undefined ? priceValidation.price24Hours : undefined,
        label: dto.label,
        type: dto.type,
      },
      create: {
        farmhouseId: dto.farmhouseId,
        date: targetDate,
        price12Hours: dto.price12Hours !== undefined ? priceValidation.price12Hours : undefined,
        price24Hours: dto.price24Hours !== undefined ? priceValidation.price24Hours : undefined,
        label: dto.label,
        type: dto.type,
      },
    });
  }

  async bulkSetWeekendPricing(dto: BulkWeekendPricingDto, actorId: string, role: Role) {
    await this.assertOwnerAccess(dto.farmhouseId, actorId, role);
    const farmhouse = await this.prisma.farmhouse.findUnique({ where: { id: dto.farmhouseId } });
    if (!farmhouse) {
      throw new NotFoundException(`Farmhouse not found`);
    }

    const check12H = dto.price12Hours !== undefined ? dto.price12Hours : farmhouse.price12Hours;
    const check24H = dto.price24Hours !== undefined ? dto.price24Hours : farmhouse.price24Hours;

    const priceValidation = validateFarmhousePrices(check12H, check24H);
    if (!priceValidation.isValid) {
      throw new BadRequestException(priceValidation.error);
    }

    const start = istDay(dto.startDate);
    const end = istDay(dto.endDate);
    const cur = new Date(start);
    if (end.getTime() - start.getTime() > 400 * 86_400_000) {
      throw new BadRequestException('Weekend pricing range cannot exceed about 13 months');
    }

    const createdRecords = [];

    while (cur <= end) {
      const day = cur.getUTCDay();
      // 0 = Sunday, 6 = Saturday
      if (day === 0 || day === 6) {
        const targetDate = new Date(cur);

        const rec = await this.prisma.pricingOverride.upsert({
          where: {
            farmhouseId_date: {
              farmhouseId: dto.farmhouseId,
              date: targetDate,
            },
          },
          update: {
            price12Hours: dto.price12Hours,
            price24Hours: dto.price24Hours,
            label: day === 6 ? 'Saturday' : 'Sunday',
            type: 'WEEKEND',
          },
          create: {
            farmhouseId: dto.farmhouseId,
            date: targetDate,
            price12Hours: dto.price12Hours,
            price24Hours: dto.price24Hours,
            label: day === 6 ? 'Saturday' : 'Sunday',
            type: 'WEEKEND',
          },
        });
        createdRecords.push(rec);
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return { message: `Updated ${createdRecords.length} weekend pricing overrides`, records: createdRecords };
  }

  async deleteOverride(id: string, actorId: string, role: Role) {
    const existing = await this.prisma.pricingOverride.findUnique({ where: { id }, select: { id: true, farmhouseId: true } });
    if (!existing) throw new NotFoundException('Pricing override not found');
    await this.assertOwnerAccess(existing.farmhouseId, actorId, role);
    return this.prisma.pricingOverride.delete({ where: { id } });
  }
}
