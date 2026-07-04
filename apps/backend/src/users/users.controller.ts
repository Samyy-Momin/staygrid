import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users (Admins & Owners)')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('owners')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all Owner Admins',
    description: 'Returns a list of all owners. System Admin only.',
  })
  async getOwners() {
    return this.usersService.findAllOwners();
  }

  @Get('customers')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({
    summary: 'List all Customers (End Users)',
    description:
      'Returns a list of all mobile app users. System Admin & Owners.',
  })
  async getCustomers() {
    return this.usersService.findAllCustomers();
  }

  @Post('customer')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Customer User',
    description: 'Creates a new End User. System Admin only.',
  })
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = await this.usersService.createCustomer(createCustomerDto);
    return {
      message: 'Customer successfully created',
      customer,
    };
  }

  @Post('owner')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Owner Admin',
    description:
      'Creates a new Farmhouse Owner account. Only accessible by System Admins.',
  })
  @ApiResponse({
    status: 201,
    description: 'Owner Admin successfully created.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin privileges required.',
  })
  async createOwner(@Body() createOwnerDto: CreateOwnerDto) {
    const owner = await this.usersService.createOwner(createOwnerDto);
    return {
      message: 'Owner Admin successfully created',
      owner,
    };
  }
}
