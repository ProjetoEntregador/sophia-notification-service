import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsumerService {
  async processTask(data: Record<string, unknown>) {
    console.log('Processing task:', data);

    // your actual logic here
    // database writes
    // emails
    // jobs
    // etc
  }
}
