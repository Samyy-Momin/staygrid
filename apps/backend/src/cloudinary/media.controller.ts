import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload an image to Cloudinary (Protected: OWNER, ADMIN)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const result = await this.cloudinaryService.uploadFile(file);
    const res = result as Record<string, string>;
    return {
      url: res.secure_url,
      publicId: res.public_id,
    };
  }
}
