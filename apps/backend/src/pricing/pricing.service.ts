import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePricingOverrideDto, BulkWeekendPricingDto } from './dto/create-pricing-override.dto';
import { validateFarmhousePrices } from '../common/utils/price-validator';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async getOverrides(farmhouseId: string, month?: string) {
    const whereClause: any = { farmhouseId };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      const startOfMonth = new Date(year, m - 1, 1);
      const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);
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

  async createOrUpdateOverride(dto: CreatePricingOverrideDto) {
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

    const targetDate = new Date(dto.date);
    targetDate.setHours(0, 0, 0, 0);

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

  async bulkSetWeekendPricing(dto: BulkWeekendPricingDto) {
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

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const cur = new Date(start);

    const createdRecords = [];

    while (cur <= end) {
      const day = cur.getDay();
      // 0 = Sunday, 6 = Saturday
      if (day === 0 || day === 6) {
        const targetDate = new Date(cur);
        targetDate.setHours(0, 0, 0, 0);

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
      cur.setDate(cur.getDate() + 1);
    }

    return { message: `Updated ${createdRecords.length} weekend pricing overrides`, records: createdRecords };
  }

  async deleteOverride(id: string) {
    const existing = await this.prisma.pricingOverride.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pricing override not found');
    return this.prisma.pricingOverride.delete({ where: { id } });
  }
}
