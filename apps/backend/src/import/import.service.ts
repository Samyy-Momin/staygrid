import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { BetterAuthService } from '../auth/better-auth.service';

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private betterAuth: BetterAuthService,
  ) {}

  async validateImport(data: any[]) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Invalid data format');
    }

    const results = [];

    for (const row of data) {
      if (!row.owner_email || !row.farmhouse_title) {
        results.push({
          ...row,
          status: 'INVALID',
          reason: 'Missing required fields',
        });
        continue;
      }

      const existingOwner = await this.prisma.user.findUnique({
        where: { email: row.owner_email },
      });

      if (existingOwner) {
        if (existingOwner.role !== Role.OWNER) {
          results.push({
            ...row,
            status: 'INVALID',
            reason: 'Email belongs to non-owner user',
          });
        } else {
          results.push({
            ...row,
            status: 'EXISTING_OWNER',
            existingOwnerId: existingOwner.id,
          });
        }
      } else {
        results.push({ ...row, status: 'NEW_OWNER' });
      }
    }

    return {
      total: results.length,
      validToImport: results.filter(
        (r) => r.status === 'NEW_OWNER' || r.status === 'EXISTING_OWNER',
      ).length,
      invalid: results.filter((r) => r.status === 'INVALID').length,
      rows: results,
    };
  }

  async executeImport(data: any[]) {
    let createdOwners = 0;
    let createdFarmhouses = 0;

    for (const row of data) {
      if (row.status === 'INVALID') continue;

      let ownerId = row.existingOwnerId;

      if (row.status === 'NEW_OWNER') {
        const password = row.owner_password || 'changeme123';

        try {
          const authResult = await this.betterAuth.auth.api.signUpEmail({
            body: {
              email: row.owner_email,
              password,
              name: row.owner_name || 'Imported Owner',
            },
          });

          if (!authResult?.user) throw new Error('Failed to create auth user');

          await this.prisma.user.update({
            where: { id: authResult.user.id },
            data: {
              role: Role.OWNER,
              phone: row.owner_phone || null,
            },
          });

          ownerId = authResult.user.id;
          createdOwners++;
        } catch (error) {
          console.error('Failed to create owner', error);
          continue; // Skip farmhouse creation if owner fails
        }
      }

      if (ownerId) {
        await this.prisma.farmhouse.create({
          data: {
            title: row.farmhouse_title,
            description:
              row.farmhouse_description || 'No description provided.',
            pricePerNight: Number(row.farmhouse_pricePerNight) || 0,
            capacity: Number(row.farmhouse_capacity) || 2,
            poolSize: row.farmhouse_poolSize || null,
            amenities: row.farmhouse_amenities
              ? row.farmhouse_amenities.split(',').map((s: string) => s.trim())
              : [],
            ownerId: ownerId,
          },
        });
        createdFarmhouses++;
      }
    }

    return { message: 'Import successful', createdOwners, createdFarmhouses };
  }
}
