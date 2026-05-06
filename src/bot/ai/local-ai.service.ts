import { Injectable, Logger } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { AiChatRequest, AiChatResponse } from '../../@types';
import { AiServiceInterface } from './interfaces/index.js';
import { baseApiToAI } from '../../utils/baseApi.js';

const CHAT_PATH = '/chat/completions';

@Injectable()
export class LocalAiService extends AiServiceInterface {
  private readonly logger = new Logger(LocalAiService.name);

  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    try {
      const { data } = await baseApiToAI.post<AiChatResponse>(
        CHAT_PATH,
        request,
      );
      this.logger.debug(
        `chat ok — text=${!!data.text}, toolCalls=${data.toolCalls?.length ?? 0}`,
      );
      return data;
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          throw new Error(
            `AI service timeout (${baseApiToAI.defaults.timeout}ms) at ${baseApiToAI.defaults.baseURL}${CHAT_PATH}`,
          );
        }
        const status = err.response?.status;
        const body =
          typeof err.response?.data === 'string'
            ? err.response.data
            : JSON.stringify(err.response?.data ?? {});
        throw new Error(
          `AI service responded ${status ?? 'no-status'}: ${body.slice(0, 500)}`,
        );
      }
      throw err;
    }
  }
}
