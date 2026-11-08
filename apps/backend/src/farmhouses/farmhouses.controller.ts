import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { FarmhousesService } from './farmhouses.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateFarmhouseDto } from './dto/create-farmhouse.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string; [key: string]: any };
}

@ApiTags('Farmhouses')
@Controller('farmhouses')
export class FarmhousesController {
  constructor(private readonly farmhousesService: FarmhousesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Farmhouse',
    description: 'Create a new farmhouse listing',
  })
  @ApiResponse({ status: 201, description: 'Farmhouse successfully created.' })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createFarmhouseDto: CreateFarmhouseDto,
  ) {
    let ownerId = req.user.id;
    if (req.user.role === Role.ADMIN && createFarmhouseDto.ownerId) {
      ownerId = createFarmhouseDto.ownerId;
    }

    const farmhouse = await this.farmhousesService.create(
      createFarmhouseDto,
      ownerId,
    );
    return { message: 'Farmhouse created successfully', farmhouse };
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'List Farmhouses (Public & Role Aware)',
    description: 'Get farmhouses. Supports fuzzy search via ?search=',
  })
  async findAll(
    @Req() req: AuthenticatedRequest, 
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('hasPool') hasPool?: string,
    @Query('hasTurf') hasTurf?: string,
    @Query('isPetFriendly') isPetFriendly?: string,
    @Query('isCoupleFriendly') isCoupleFriendly?: string,
    @Query('city') city?: string,
    @Query('sortBy') sortBy?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const filters: any = {};
    if (isFeatured === 'true') filters.isFeatured = true;
    if (hasPool === 'true') filters.hasPool = true;
    if (hasTurf === 'true') filters.hasTurf = true;
    if (isPetFriendly === 'true') filters.isPetFriendly = true;
    if (isCoupleFriendly === 'true') filters.isCoupleFriendly = true;
    if (city && city.trim().length > 0) filters.city = city.trim();

    if (req.user && req.user.role === Role.OWNER) {
      return this.farmhousesService.findByOwner(req.user.id, search, pageNum, limitNum);
    }
    return this.farmhousesService.findAll(search, pageNum, limitNum, filters, sortBy);
  }

  @Get('locations')
  @ApiOperation({
    summary: 'Get Destination Locations',
    description: 'Get list of distinct city names and property counts',
  })
  async getLocations() {
    return this.farmhousesService.getDistinctLocations();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Farmhouse Stats (Role Aware)',
    description: 'Get dashboard stats',
  })
  async getStats(@Req() req: AuthenticatedRequest) {
    if (req.user.role === Role.OWNER) {
      return this.farmhousesService.getOwnerStats(req.user.id);
    }
    return this.farmhousesService.getStats();
  }

  @Get('cancelled-deals')
  @Get('cancellations')
  @ApiOperation({
    summary: 'Get Farmhouses with Cancelled Deals',
    description: 'Get farmhouses with recent cancelled bookings available for last-minute booking',
  })
  async getCancelledDeals() {
    return this.farmhousesService.findCancelledDeals();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Farmhouse details',
  })
  async findOne(@Param('id') id: string) {
    return this.farmhousesService.findOne(id);
  }

  @Get(':id/availability')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Get Farmhouse Availability',
    description: 'Returns array of unavailable dates for the farmhouse',
  })
  async getAvailability(@Param('id') id: string) {
    return this.farmhousesService.getAvailability(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update Farmhouse',
    description: 'Update farmhouse details (OWNER/ADMIN only)',
  })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateFarmhouseDto>,
  ) {
    if (req.user.role === Role.OWNER) {
      const farmhouse = await this.farmhousesService.findOne(id);
      if (farmhouse.ownerId !== req.user.id) {
        throw new UnauthorizedException("You do not own this farmhouse");
      }
    }
    return this.farmhousesService.update(id, updateData);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle Farmhouse Status',
    description: 'Toggle isActive true/false. System Admin only.',
  })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.farmhousesService.toggleStatus(id, isActive);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete Farmhouse',
    description: 'Permanently delete a farmhouse. System Admin only.',
  })
  async remove(@Param('id') id: string) {
    return this.farmhousesService.remove(id);
  }

  @Post(':id/blocked-dates')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a date range' })
  async blockDateRange(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('note') note?: string,
  ) {
    if (req.user.role === Role.OWNER) {
      const farmhouse = await this.farmhousesService.findOne(id);
      if (farmhouse.ownerId !== req.user.id) {
        throw new UnauthorizedException("You do not own this farmhouse");
      }
    }
    return this.farmhousesService.blockDateRange(id, startDate, endDate, note, req.user.role);
  }

  @Get(':id/blocked-dates')
  @ApiOperation({ summary: 'Get blocked date ranges' })
  async getBlockedDates(@Param('id') id: string) {
    return this.farmhousesService.getBlockedDates(id);
  }

  @Delete('blocked-dates/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a blocked date range' })
  async removeBlockedDateRange(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    if (req.user.role === Role.OWNER) {
      // Need to find which farmhouse this blocked date belongs to, but it's easier to just check it inside the service or get the blocked date first.
      // Let's get the blocked date via prisma directly or in service.
      const blockedDate = await this.farmhousesService.getBlockedDateById(id);
      if (blockedDate) {
        const farmhouse = await this.farmhousesService.findOne(blockedDate.farmhouseId);
        if (farmhouse.ownerId !== req.user.id) {
          throw new UnauthorizedException("You do not own this farmhouse");
        }
      }
    }
    return this.farmhousesService.removeBlockedDateRange(id);
  }

  @Get(':id/pricing-overrides')
  @ApiOperation({ summary: 'Get pricing overrides for farmhouse' })
  async getPricingOverrides(@Param('id') id: string) {
    return this.farmhousesService.getPricingOverrides(id);
  }

  @Post(':id/pricing-overrides')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update pricing override' })
  async upsertPricingOverride(
    @Param('id') id: string,
    @Body() body: { date: string; price12Hours?: number; price24Hours?: number; label?: string; type: string }
  ) {
    return this.farmhousesService.upsertPricingOverride(id, body);
  }

  @Delete('pricing-overrides/:overrideId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete pricing override' })
  async deletePricingOverride(@Param('overrideId') overrideId: string) {
    return this.farmhousesService.deletePricingOverride(overrideId);
  }
}
