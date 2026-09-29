import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { LlmService } from './llm.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/intelligence')
export class IntelligenceController {
  constructor(
    private intelligenceService: IntelligenceService,
    private llmService: LlmService,
  ) {}

  @Post('events/:eventId/idea-reports')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async createReport(@Param('eventId') eventId: string, @Body() body: any) {
    return this.intelligenceService.generateIdeaPotentialReport({
      ...body,
      eventId,
    });
  }

  @Get('events/:eventId/idea-reports/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getReport(@Param('eventId') eventId: string, @Param('id') id: string) {
    return this.intelligenceService.getReport(id, eventId);
  }

  @Delete('events/:eventId/idea-reports/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async deleteReport(@Param('eventId') eventId: string, @Param('id') id: string) {
    return this.intelligenceService.deleteReport(id, eventId);
  }

  /**
   * MegaLLM Chat Completions endpoint for chatgpt-20b-oss
   */
  @Post('llm/complete')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.VISITOR, Role.PARTICIPANT, Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async llmComplete(@Body() body: { prompt: string; systemPrompt?: string; model?: string }) {
    return this.llmService.complete({
      prompt: body.prompt,
      systemPrompt: body.systemPrompt,
      model: body.model,
    });
  }
}
