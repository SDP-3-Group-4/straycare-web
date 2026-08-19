import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VetApplicationsService } from './vet-applications.service';

@Controller('vet-applications')
export class VetApplicationsController {
  constructor(private readonly vetApplicationsService: VetApplicationsService) {}

  @Post()
  create(@Body() data: any) {
    return this.vetApplicationsService.create(data);
  }

  @Get(':userId')
  latestForUser(@Param('userId') userId: string) {
    return this.vetApplicationsService.latestForUser(userId);
  }
}