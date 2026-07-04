import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { BetterAuthService } from '../auth/better-auth.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private betterAuth: BetterAuthService,
  ) {}

  async createOwner(createOwnerDto: CreateOwnerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createOwnerDto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    // Use Better Auth to register the user properly with Account
    const result = await this.betterAuth.auth.api.signUpEmail({
      body: {
        email: createOwnerDto.email,
        password: createOwnerDto.password,
        name: createOwnerDto.name || 'Owner',
      },
    });

    if (!result?.user) throw new Error('Failed to create owner');

    // Update the custom role and phone fields in Prisma
    const owner = await this.prisma.user.update({
      where: { id: result.user.id },
      data: {
        role: Role.OWNER,
        phone: createOwnerDto.phone,
      },
    });

    return {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: owner.role,
    };
  }

  async findAllOwners() {
    return this.prisma.user.findMany({
      where: { role: Role.OWNER },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllCustomers() {
    return this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        age: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCustomer(dto: import('./dto/create-customer.dto').CreateCustomerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const result = await this.betterAuth.auth.api.signUpEmail({
      body: {
        email: dto.email,
        password: dto.password,
        name: dto.name,
      },
    });

    if (!result?.user) throw new Error('Failed to create customer');

    const customer = await this.prisma.user.update({
      where: { id: result.user.id },
      data: {
        role: Role.CUSTOMER,
        phone: dto.phone,
        gender: dto.gender,
        age: dto.age,
      },
    });

    return customer;
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new ConflictException('Failed to delete user.');
    }
  }
}
