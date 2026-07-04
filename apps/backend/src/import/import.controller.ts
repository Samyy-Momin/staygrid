import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ImportService } from './import.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Import')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('validate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate CSV Import',
  })
  async validateImport(@Body() data: any[]) {
    return this.importService.validateImport(data);
  }

  @Post('execute')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Execute CSV Import',
  })
  async executeImport(@Body() data: any[]) {
    return this.importService.executeImport(data);
  }
}
