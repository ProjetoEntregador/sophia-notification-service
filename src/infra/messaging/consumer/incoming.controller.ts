import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { OutgoingService } from '../publisher/outgoing.service';

@Controller()
export class IncomingController {
  constructor(private readonly outgoingService: OutgoingService) {}

  @EventPattern('whatsapp.incoming')
  handleIncomingMessage(
    @Payload() data: Record<string, string>,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // processamento

      this.outgoingService.handleMessage(data);

      channel.ack(originalMsg);
    } catch (err) {
      console.error(err);
      channel.nack(originalMsg, false, true);
    }
  }
}
