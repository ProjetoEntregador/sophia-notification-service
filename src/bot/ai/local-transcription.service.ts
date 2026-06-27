import { Injectable, Logger } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { AiTranscriptionRequest, AiTranscriptionResponse } from '@/@types';
import { TranscriptionServiceInterface } from './interfaces/index';
import { baseApiToAI } from '@/utils/baseApi';

const TRANSCRIBE_PATH = '/stt/transcribe';

@Injectable()
export class LocalTranscriptionService extends TranscriptionServiceInterface {
  private readonly logger = new Logger(LocalTranscriptionService.name);

  async transcribe(request: AiTranscriptionRequest): Promise<string> {
    const form = new FormData();
    const fileName = request.fileName ?? 'audio.ogg';
    const blob = new Blob([new Uint8Array(request.audio)], {
      type: request.mimeType,
    });
    form.append('file', blob, fileName);

    try {
      const { data } = await baseApiToAI.post<AiTranscriptionResponse>(
        TRANSCRIBE_PATH,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      const text = (data.text ?? '').trim();

      this.logger.debug(`transcribe ok — length=${text.length}`);
      return text;
    } catch (err) {
      if (!isAxiosError(err)) throw err;
      const reason = err.response
        ? `status ${err.response.status}`
        : (err.code ?? 'sem resposta');
      throw new Error(`Falha ao chamar ${TRANSCRIBE_PATH}: ${reason}`);
    }
  }
}
