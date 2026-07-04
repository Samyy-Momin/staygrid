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
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List Farmhouses (Role Aware)',
    description: 'Get farmhouses (Owners see only theirs)',
  })
  async findAll(@Req() req: AuthenticatedRequest) {
    if (req.user.role === Role.OWNER) {
      return this.farmhousesService.findByOwner(req.user.id);
    }
    return this.farmhousesService.findAll();
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get Farmhouse details',
  })
  async findOne(@Param('id') id: string) {
    return this.farmhousesService.findOne(id);
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
    @Param('id') id: string,
    @Body() updateData: Partial<CreateFarmhouseDto>,
  ) {
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
    @Param('id') id: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('note') note?: string,
  ) {
    return this.farmhousesService.blockDateRange(id, startDate, endDate, note);
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
  async removeBlockedDateRange(@Param('id') id: string) {
    return this.farmhousesService.removeBlockedDateRange(id);
  }
}
