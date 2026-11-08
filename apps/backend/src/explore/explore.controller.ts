import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExploreService } from './explore.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Explore Reels & Photos')
@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get()
  @ApiOperation({ summary: 'Get Explore Feed (Reels & Photos)' })
  async getExploreFeed(
    @Query('type') type?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('farmhouseId') farmhouseId?: string,
  ) {
    const featured = isFeatured !== undefined ? isFeatured === 'true' : undefined;
    return this.exploreService.getExploreFeed(type, featured, farmhouseId);
  }

  @Post('sync-instagram')
  @ApiOperation({ summary: 'Sync Reels from Instagram Graph API' })
  async syncInstagramGraphApi(
    @Body('accessToken') accessToken: string,
    @Body('instagramAccountId') instagramAccountId?: string,
  ) {
    return this.exploreService.syncInstagramGraphApi(accessToken, instagramAccountId);
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create / Tag Explore Reel in Admin ERP' })
  async createExploreMedia(@Body() body: any) {
    return this.exploreService.createExploreMedia(body);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Explore Reel in Admin ERP' })
  async deleteExploreMedia(@Param('id') id: string) {
    return this.exploreService.deleteExploreMedia(id);
  }
}
