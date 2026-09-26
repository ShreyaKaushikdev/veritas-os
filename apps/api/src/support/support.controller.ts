import { Controller, Post, Get, Patch, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

// In-memory rate limiter: max 5 tickets per user per hour
const rateLimitMap = new Map<string, number[]>();

@Controller('api/v1')
@UseGuards(AuthGuard, RolesGuard)
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post('events/:eventId/support')
  @Roles(Role.PARTICIPANT, Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async submitTicket(
    @Param('eventId') eventId: string,
    @Body() body: { page: string; eventPhase: string; message: string; screenshotKey?: string; context?: any },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const now = Date.now();
    const oneHourAgo = now - 3600 * 1000;

    // Rate limiting (5/hr)
    const timestamps = (rateLimitMap.get(userId) || []).filter((t) => t > oneHourAgo);
    if (timestamps.length >= 5) {
      throw new ForbiddenException('Rate limit exceeded: maximum 5 support tickets per hour.');
    }
    timestamps.push(now);
    rateLimitMap.set(userId, timestamps);

    return this.supportService.createTicket({
      eventId,
      reporterId: userId,
      reporterRole: req.user.role,
      page: body.page,
      eventPhase: body.eventPhase || 'SUBMISSION',
      message: body.message,
      screenshotKey: body.screenshotKey,
      context: body.context || {},
    });
  }

  @Get('events/:eventId/support')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getOrganizerSupportInbox(
    @Param('eventId') eventId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.supportService.getEventTickets(eventId, { status, priority });
  }

  @Get('support/mine')
  @Roles(Role.PARTICIPANT, Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async getMyTickets(@Req() req: any) {
    return this.supportService.getMyTickets(req.user.id);
  }

  @Patch('events/:eventId/support/:id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async updateTicket(
    @Param('id') ticketId: string,
    @Body() body: { status?: string; priority?: string; internalNote?: string },
    @Req() req: any,
  ) {
    return this.supportService.updateTicket(ticketId, body, req.user.id);
  }
}
