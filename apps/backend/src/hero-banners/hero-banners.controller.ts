import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HeroBannersService } from './hero-banners.service';
import { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';

@Controller('hero-banners')
export class HeroBannersController {
  constructor(private readonly heroBannersService: HeroBannersService) {}

  @Post()
  create(@Body() createHeroBannerDto: CreateHeroBannerDto) {
    return this.heroBannersService.create(createHeroBannerDto);
  }

  @Get()
  findAll() {
    return this.heroBannersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.heroBannersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHeroBannerDto: UpdateHeroBannerDto) {
    return this.heroBannersService.update(id, updateHeroBannerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.heroBannersService.remove(id);
  }
}
