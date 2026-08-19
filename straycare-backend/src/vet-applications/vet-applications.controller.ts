import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { VetApplicationsService } from './vet-applications.service';

@Controller('vet-applications')
export class VetApplicationsController {
  constructor(
    private readonly vetApplicationsService: VetApplicationsService,
  ) {}

  @Post()
  create(@Body() data: any, @Req() req: Request) {
    return this.vetApplicationsService.create({
      userId: req.user!.uid,
      fullName: data.fullName,
      dob: data.dob,
      clinic: data.clinic,
      nid: data.nid,
      photoName: data.photoName,
      photoBase64: data.photoBase64,
      docName: data.docName,
      docMimeType: data.docMimeType,
      docBase64: data.docBase64,
    });
  }

  @Get(':userId')
  latestForUser(@Param('userId') userId: string, @Req() req: Request) {
    if (userId !== req.user!.uid) {
      throw new ForbiddenException('You can only view your own application');
    }
    return this.vetApplicationsService.latestForUser(userId);
  }
}
