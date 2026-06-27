import { AiTranscriptionRequest } from '@/@types';

export abstract class TranscriptionServiceInterface {
  abstract transcribe(request: AiTranscriptionRequest): Promise<string>;
}
