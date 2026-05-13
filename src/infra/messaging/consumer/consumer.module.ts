import { Module } from '@nestjs/common';
import { OutgoingService } from '../publisher/outgoing.service';
import { OutgoingController } from './outgoing.controller';
import { IncomingController } from './incoming.controller';

@Module({
  controllers: [OutgoingController, IncomingController],
  providers: [OutgoingService],
  exports: [OutgoingService],
})
export class ConsumerModule {}
