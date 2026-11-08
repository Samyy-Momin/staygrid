import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreatePricingOverrideDto, BulkWeekendPricingDto } from './dto/create-pricing-override.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get(':farmhouseId')
  @ApiOperation({ summary: 'Get pricing overrides for a farmhouse' })
  getOverrides(
    @Param('farmhouseId') farmhouseId: string,
    @Query('month') month?: string,
  ) {
    return this.pricingService.getOverrides(farmhouseId, month);
  }

  @Post('override')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set or update custom/festival pricing override for a specific date' })
  createOrUpdateOverride(@Body() dto: CreatePricingOverrideDto) {
    return this.pricingService.createOrUpdateOverride(dto);
  }

  @Post('weekend')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk set Saturday/Sunday pricing overrides for a date range' })
  bulkSetWeekendPricing(@Body() dto: BulkWeekendPricingDto) {
    return this.pricingService.bulkSetWeekendPricing(dto);
  }

  @Delete('override/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a pricing override' })
  deleteOverride(@Param('id') id: string) {
    return this.pricingService.deleteOverride(id);
  }
}
