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
            price12Hours: Number(row.price12Hours) || Number(row.farmhouse_pricePerNight) || 0,
            price24Hours: Number(row.price24Hours) || (Number(row.farmhouse_pricePerNight) * 1.5) || 0,
            capacity: Number(row.capacity) || Number(row.farmhouse_capacity) || 2,
            tokenAmount: Number(row.tokenAmount) || 2000,
            
            // Booleans / Checkboxes
            isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
            isFeatured: Boolean(row.isFeatured),
            isCoupleFriendly: Boolean(row.isCoupleFriendly),
            isPetFriendly: Boolean(row.isPetFriendly),
            isWheelchairAccessible: Boolean(row.isWheelchairAccessible),
            
            // Location
            streetAddress: row.streetAddress || null,
            city: row.city || null,
            state: row.state || null,
            country: row.country || "India",
            postalCode: row.postalCode || null,
            latitude: row.latitude ? Number(row.latitude) : null,
            longitude: row.longitude ? Number(row.longitude) : null,
            
            // Contacts & Photos
            contactNumbers: Array.isArray(row.contactNumbers) ? row.contactNumbers : [],
            photos: Array.isArray(row.photos) ? row.photos : [],
            
            // Outdoor
            hasPool: Boolean(row.hasPool),
            poolType: row.poolType || null,
            poolSize: row.poolSize || row.farmhouse_poolSize || null,
            babyPoolSize: row.babyPoolSize || null,
            hasTurf: Boolean(row.hasTurf),
            hasRainDance: Boolean(row.hasRainDance),
            hasPlayArea: Boolean(row.hasPlayArea),
            hasGardenArea: Boolean(row.hasGardenArea),
            hasGazebo: Boolean(row.hasGazebo),
            hasCelebrationArea: Boolean(row.hasCelebrationArea),

            // Indoor (Rooms)
            roomCount: Number(row.roomCount) || 1,
            acRoomCount: Number(row.acRoomCount) || 0,
            nonAcRoomCount: Number(row.nonAcRoomCount) || 0,
            hallCount: Number(row.hallCount) || 0,
            
            // Beds
            singleBedCount: Number(row.singleBedCount) || 0,
            doubleBedCount: Number(row.doubleBedCount) || 0,
            extraMattressCount: Number(row.extraMattressCount) || 0,
            balconyCount: Number(row.balconyCount) || 0,
            
            // Kitchen
            hasKitchen: Boolean(row.hasKitchen),
            hasFridge: Boolean(row.hasFridge),
            hasRoWater: Boolean(row.hasRoWater),
            hasBbq: Boolean(row.hasBbq),
            hasGas: Boolean(row.hasGas),
            gasCharge: row.gasCharge ? Number(row.gasCharge) : null,
            
            // Indoor Games
            hasCarom: Boolean(row.hasCarom),
            hasUno: Boolean(row.hasUno),
            hasTeenPatti: Boolean(row.hasTeenPatti),
            hasChess: Boolean(row.hasChess),
            has8BallPool: Boolean(row.has8BallPool),
            
            // Electronics
            hasTv: Boolean(row.hasTv),
            hasSpeakers: Boolean(row.hasSpeakers),
            hasMicrophone: Boolean(row.hasMicrophone),
            hasWifi: Boolean(row.hasWifi),

            ownerId: ownerId,
          },
        });
        createdFarmhouses++;
      }
    }

    return { message: 'Import successful', createdOwners, createdFarmhouses };
  }
}
