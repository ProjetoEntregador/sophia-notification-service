import { Injectable } from '@nestjs/common';
import { Clock } from '../ports/clock.port';

@Injectable()
export class SystemClockAdapter extends Clock {
  now(): Date {
    return new Date();
  }
}
