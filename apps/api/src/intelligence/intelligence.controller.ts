import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/events/:eventId/idea-reports')
@UseGuards(AuthGuard, RolesGuard)
export class IntelligenceController {
  constructor(private intelligenceService: IntelligenceService) {}

  @Post()
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async createReport(@Param('eventId') eventId: string, @Body() body: any) {
    return this.intelligenceService.generateIdeaPotentialReport({
      ...body,
      eventId,
    });
  }

  @Get(':id')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getReport(@Param('id') id: string) {
    return this.intelligenceService.getReport(id);
  }

  @Delete(':id')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async deleteReport(@Param('id') id: string) {
    return this.intelligenceService.deleteReport(id);
  }
}
