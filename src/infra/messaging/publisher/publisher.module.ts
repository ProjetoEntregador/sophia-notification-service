import { Module } from '@nestjs/common';
import { IncomingService } from './incoming.service';
import { OutgoingService } from './outgoing.service';

@Module({
  providers: [IncomingService, OutgoingService],
  exports: [IncomingService, OutgoingService],
})
export class PublisherModule {}
