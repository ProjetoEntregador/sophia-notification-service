import { Module } from '@nestjs/common';
import { IncomingService } from './incoming.service';

@Module({
  providers: [IncomingService],
  exports: [IncomingService],
})
export class PublisherModule {}
