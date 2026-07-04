import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Offers')
@Controller('farmhouses/:farmhouseId/offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an offer for a farmhouse' })
  create(
    @Param('farmhouseId') farmhouseId: string,
    @Body() createOfferDto: CreateOfferDto,
  ) {
    return this.offersService.create(farmhouseId, createOfferDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all offers for a farmhouse' })
  findAll(@Param('farmhouseId') farmhouseId: string) {
    return this.offersService.findAll(farmhouseId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an offer' })
  remove(@Param('id') id: string) {
    return this.offersService.remove(id);
  }
}
