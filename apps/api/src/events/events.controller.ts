import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, EventStatus, AutopilotMode } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/events')
@UseGuards(AuthGuard, RolesGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  async listEvents() {
    return this.eventsService.listEvents();
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    return this.eventsService.getEvent(id);
  }

  @Post()
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async createEvent(@Body() body: any, @Req() req: any) {
    return this.eventsService.createEvent({
      ...body,
      creatorId: req.user.id,
    });
  }

  @Post(':id/status')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() body: { status: EventStatus; reason?: string }, @Req() req: any) {
    return this.eventsService.updateStatus(id, body.status, req.user.id, body.reason);
  }

  @Post(':id/autopilot')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async setAutopilotMode(@Param('id') id: string, @Body() body: { mode: AutopilotMode }, @Req() req: any) {
    return this.eventsService.setAutopilotMode(id, body.mode, req.user.id);
  }

  @Post(':id/clone')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async cloneEvent(@Param('id') id: string, @Body() body: { newSlug: string; newName: string }, @Req() req: any) {
    return this.eventsService.cloneEvent(id, body.newSlug, body.newName, req.user.id);
  }

  @Get(':id/command-center')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getCommandCenter(@Param('id') id: string) {
    return this.eventsService.getCommandCenterMetrics(id);
  }

  @Get(':id/audience/csv')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getAudienceCsv(@Param('id') id: string) {
    return this.eventsService.getAudienceCsv(id);
  }

  @Post(':id/audience/broadcast')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async broadcastToAudience(
    @Param('id') id: string,
    @Body() body: { subject: string; message: string },
    @Req() req: any,
  ) {
    return this.eventsService.broadcastToAudience(id, body, req.user.id);
  }
}
