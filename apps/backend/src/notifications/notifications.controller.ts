import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; [key: string]: any };
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push-token')
  @ApiOperation({ summary: "Register the authenticated user's Expo push token" })
  savePushToken(
    @Req() req: AuthenticatedRequest,
    @Body() body: { pushToken: string; platform?: string },
  ) {
    return this.notificationsService.savePushToken(req.user.id, body.pushToken, body.platform);
  }

  @Delete('push-token')
  @ApiOperation({ summary: 'Remove a push token from the authenticated user' })
  deletePushToken(@Req() req: AuthenticatedRequest, @Body('pushToken') token: string) {
    return this.notificationsService.deletePushToken(req.user.id, token);
  }

  @Get('me')
  @ApiOperation({ summary: 'List recent in-app notifications' })
  listMine(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.listForUser(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark an in-app notification as read' })
  markRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }
}
