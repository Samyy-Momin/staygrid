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
  @ApiOperation({
    summary: 'List Farmhouses',
    description: 'Get all farmhouses',
  })
  async findAll() {
    return this.farmhousesService.findAll();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get Farmhouse Stats',
    description: 'Get dashboard stats for farmhouses and bookings',
  })
  async getStats() {
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
}
