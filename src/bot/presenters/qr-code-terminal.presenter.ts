import { Injectable, Logger } from '@nestjs/common';
import * as qrcode from 'qrcode-terminal';
import { QrCodePresenter } from '../interfaces/index.js';

@Injectable()
export class QrCodeTerminalPresenter extends QrCodePresenter {
  private readonly logger = new Logger(QrCodeTerminalPresenter.name);

  present(qr: string): void {
    this.logger.log('Escaneie o QR code abaixo:');
    qrcode.generate(qr, { small: true });
  }
}
