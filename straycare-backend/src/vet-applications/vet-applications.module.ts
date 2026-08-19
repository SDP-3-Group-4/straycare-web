import { Module } from '@nestjs/common';
import { VetApplicationsController } from './vet-applications.controller';
import { VetApplicationsService } from './vet-applications.service';

@Module({
  controllers: [VetApplicationsController],
  providers: [VetApplicationsService],
})
export class VetApplicationsModule {}
