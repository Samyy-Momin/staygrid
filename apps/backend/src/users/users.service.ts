import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { BetterAuthService } from '../auth/better-auth.service';
import { Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { hashPassword } from 'better-auth/crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private betterAuth: BetterAuthService,
    private mailService: MailService,
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

    // Send SMTP Welcome Email to Owner
    this.mailService.sendWelcomeEmail(
      owner.email,
      owner.name,
      createOwnerDto.password,
    ).catch(err => console.error('Failed to send owner welcome email:', err));

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
      orderBy: { createdAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCustomer(
    dto: import('./dto/create-customer.dto').CreateCustomerDto,
  ) {
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

  async resetOwnerPassword(dto: { ownerId: string; newPassword: string }) {
    const owner = await this.prisma.user.findUnique({
      where: { id: dto.ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner account not found');
    }

    if (owner.role !== Role.OWNER && owner.role !== Role.ADMIN) {
      throw new BadRequestException('Target user is not an Owner or Admin account');
    }

    // Generate BetterAuth compatible password hash
    const hashedPassword = await hashPassword(dto.newPassword);

    const account = await this.prisma.account.findFirst({
      where: { userId: owner.id, providerId: 'credential' },
    });

    if (account) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.account.create({
        data: {
          userId: owner.id,
          accountId: owner.email,
          providerId: 'credential',
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Send SMTP update email to Owner with new password
    this.mailService.sendWelcomeEmail(
      owner.email,
      owner.name,
      dto.newPassword,
    ).catch(err => console.error('Failed to send password reset email:', err));

    return {
      message: `Password for ${owner.name} (${owner.email}) updated successfully!`,
      ownerId: owner.id,
      email: owner.email,
    };
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
