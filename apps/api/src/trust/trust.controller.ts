import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { TrustService } from './trust.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/trust')
@UseGuards(AuthGuard, RolesGuard)
export class TrustController {
  constructor(private trustService: TrustService) {}

  @Get('verify/:eventId')
  async verifyChain(@Param('eventId') eventId: string) {
    return this.trustService.verifyHashChain(eventId);
  }

  @Post('simulate-tamper')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  async simulateTamper(@Body() body: { nodeId: string }) {
    return this.trustService.simulateTamper(body.nodeId);
  }

  @Get('events/:eventId/audit-trail')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getAuditTrail(@Param('eventId') eventId: string) {
    return this.trustService.getAuditTrail(eventId);
  }

  @Get('events/:eventId/export')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async getExport(@Param('eventId') eventId: string) {
    return this.trustService.generateExportBundle(eventId);
  }
}
