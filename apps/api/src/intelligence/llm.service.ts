import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface LlmCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmCompletionResult {
  text: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private get provider(): string {
    return process.env.AI_PROVIDER || process.env.LLM_PROVIDER || 'megallm';
  }

  private get apiKey(): string {
    return process.env.MEGALLM_API_KEY || process.env.OPENAI_API_KEY || '';
  }

  private get baseUrl(): string {
    return (
      process.env.MEGALLM_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      'https://api.megallm.io/v1'
    ).replace(/\/$/, '');
  }

  private get defaultModel(): string {
    return process.env.MEGALLM_MODEL || 'chatgpt-20b-oss';
  }

  /**
   * Generate completion using MegaLLM (OpenAI-compatible OSS LLM API)
   */
  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const model = options.model || this.defaultModel;
    const provider = this.provider;

    if (provider === 'off' || provider === 'mock') {
      this.logger.debug(`LLM provider set to ${provider}. Returning mock response.`);
      return {
        text: `[Mock LLM Response for ${model}] Processed prompt: ${options.prompt.slice(0, 100)}...`,
        model,
        provider: 'mock',
      };
    }

    try {
      const messages = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: options.prompt });

      const endpoint = `${this.baseUrl}/chat/completions`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const payload = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
      };

      this.logger.log(`Dispatching request to MegaLLM (${model}) at ${endpoint}`);

      const response = await axios.post(endpoint, payload, {
        headers,
        timeout: 30000,
      });

      const choice = response.data?.choices?.[0];
      const text = choice?.message?.content || choice?.text || '';
      const usage = response.data?.usage
        ? {
            promptTokens: response.data.usage.prompt_tokens,
            completionTokens: response.data.usage.completion_tokens,
            totalTokens: response.data.usage.total_tokens,
          }
        : undefined;

      return {
        text,
        model,
        provider: 'megallm',
        usage,
      };
    } catch (error: any) {
      this.logger.error(
        `MegaLLM API execution error (${model}): ${error.response?.data?.error?.message || error.message}`
      );
      throw error;
    }
  }

  /**
   * Synthesize Hackathon Blueprint from prompt using chatgpt-20b-oss
   */
  async synthesizeHackathonBlueprint(prompt: string): Promise<any> {
    const systemPrompt = `You are DOGFOOD OS AI Orchestrator. You convert natural language hackathon requests into structured JSON blueprints.
Return ONLY raw JSON with keys: name, slug, durationHours, expectedHackers, prizePool, tracks (array of {name, tagline, description}), rubrics (array of {criterion, weight, minScore, maxScore}), and schedule.`;

    try {
      const result = await this.complete({
        prompt,
        systemPrompt,
        model: this.defaultModel,
        temperature: 0.5,
        maxTokens: 2048,
      });

      const cleaned = result.text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      this.logger.warn('Failed to parse LLM blueprint JSON. Using blueprint builder fallback.');
      return null;
    }
  }
}
