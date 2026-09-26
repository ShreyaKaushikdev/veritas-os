import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/teams')
@UseGuards(AuthGuard, RolesGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async createTeam(@Body() body: { eventId: string; name: string }, @Req() req: any) {
    return this.teamsService.createTeam(body.eventId, body.name, req.user.id);
  }

  @Post('join')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async joinTeam(@Body() body: { inviteCode: string }, @Req() req: any) {
    return this.teamsService.joinTeam(body.inviteCode, req.user.id);
  }

  @Get(':id')
  async getTeam(@Param('id') id: string) {
    return this.teamsService.getTeam(id);
  }

  @Get('event/:eventId/me')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getMyTeam(@Param('eventId') eventId: string, @Req() req: any) {
    return this.teamsService.getUserTeamForEvent(eventId, req.user.id);
  }
}
