import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller()
export class OutgoingController {
  constructor() {}

  @EventPattern('whatsapp.outgoing')
  async handleOutgoingMessage(
    @Payload() data: Record<string, string>,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // envia para o whatsapp

      channel.ack(originalMsg);
    } catch (err) {
      console.error(err);
      channel.nack(originalMsg, false, true);
    }
  }
}
