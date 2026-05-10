import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsumerService {
  async processTask(data: Record<string, unknown>) {
    console.log('Processing task:', data);
  }
}
