import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExploreService {
  constructor(private readonly prisma: PrismaService) {}

  // Get Explore Media Feed (Supports filtering by type, featured, farmhouseId)
  async getExploreFeed(type?: string, isFeatured?: boolean, farmhouseId?: string) {
    const where: any = {};
    if (type) where.type = type.toUpperCase();
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (farmhouseId) where.farmhouseId = farmhouseId;

    return this.prisma.exploreMedia.findMany({
      where,
      include: {
        farmhouse: {
          select: {
            id: true,
            title: true,
            city: true,
            price24Hours: true,
            photos: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Create / Tag Explore Media (Admin ERP)
  async createExploreMedia(data: {
    type: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    instagramPostUrl?: string;
    caption?: string;
    isFeatured?: boolean;
    farmhouseId?: string;
  }) {
    return this.prisma.exploreMedia.create({
      data: {
        type: data.type.toUpperCase(),
        mediaUrl: data.mediaUrl,
        thumbnailUrl: data.thumbnailUrl || null,
        instagramPostUrl: data.instagramPostUrl || null,
        caption: data.caption || null,
        isFeatured: Boolean(data.isFeatured),
        farmhouseId: data.farmhouseId || null,
      },
    });
  }

  // Auto-Sync Instagram Graph API (Ready for user API Token)
  async syncInstagramGraphApi(accessToken: string, instagramAccountId?: string) {
    try {
      // Step 1: Query Meta Graph API for Business Account Media
      const accountId = instagramAccountId || 'me';
      const url = `https://graph.facebook.com/v19.0/${accountId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&access_token=${accessToken}`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message || 'Instagram Graph API error');
      }

      const mediaItems = result.data || [];
      let syncedCount = 0;

      for (const item of mediaItems) {
        const isVideo = item.media_type === 'VIDEO' || item.media_type === 'REEL';
        const type = isVideo ? 'REEL' : 'PHOTO';
        const mediaUrl = item.media_url || item.thumbnail_url;
        if (!mediaUrl) continue;

        // Auto-match farmhouse name from caption if hashtags match
        let farmhouseId: string | null = null;
        if (item.caption) {
          const farmhouses = await this.prisma.farmhouse.findMany({ select: { id: true, title: true } });
          const matched = farmhouses.find((f: any) =>
            item.caption.toLowerCase().includes(f.title.toLowerCase())
          );
          if (matched) farmhouseId = matched.id;
        }

        const existing = await this.prisma.exploreMedia.findFirst({
          where: { instagramPostUrl: item.permalink },
        });

        if (!existing) {
          await this.prisma.exploreMedia.create({
            data: {
              type,
              mediaUrl,
              thumbnailUrl: item.thumbnail_url || mediaUrl,
              instagramPostUrl: item.permalink,
              caption: item.caption || null,
              viewCount: item.like_count || 0,
              farmhouseId,
            },
          });
          syncedCount++;
        }
      }

      return { success: true, syncedCount, totalFetched: mediaItems.length };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sync with Instagram' };
    }
  }

  // Delete Explore Media (Admin ERP)
  async deleteExploreMedia(id: string) {
    const item = await this.prisma.exploreMedia.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Explore media not found');
    await this.prisma.exploreMedia.delete({ where: { id } });
    return { success: true, message: 'Explore media deleted' };
  }
}
