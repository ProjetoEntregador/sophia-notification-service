import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { MessageRouterInterface } from '@/bot/interfaces';

@Controller()
export class IncomingController {
  constructor(private readonly router: MessageRouterInterface) {}

  @EventPattern('whatsapp.incoming')
  handleIncomingMessage(
    @Payload() data: Record<string, string>,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      void this.router.route(data.from, data.text);

      channel.ack(originalMsg);
    } catch (err) {
      console.error(err);
      channel.nack(originalMsg, false, true);
    }
  }
}
