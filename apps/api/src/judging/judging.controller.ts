import { Controller, Get, Post, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JudgingService } from './judging.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/events/:eventId/judging')
@UseGuards(AuthGuard, RolesGuard)
export class JudgingController {
  constructor(private judgingService: JudgingService) {}

  @Get('rubric')
  @Roles(Role.PARTICIPANT, Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async getRubric(@Param('eventId') eventId: string) {
    return this.judgingService.getRubric(eventId);
  }

  @Post('rubric/lock')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async lockRubric(@Param('eventId') eventId: string, @Body() body: { rubricVersionId: string }, @Req() req: any) {
    return this.judgingService.lockRubric(body.rubricVersionId, req.user.id);
  }

  @Get('anchors')
  @Roles(Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async getAnchors(@Param('eventId') eventId: string) {
    return this.judgingService.getAnchorProjects(eventId);
  }

  @Post('calibration')
  @Roles(Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async recordCalibration(@Param('eventId') eventId: string, @Body() body: { scores: Record<string, number> }, @Req() req: any) {
    return this.judgingService.recordCalibration(eventId, req.user.id, body.scores);
  }

  @Get('assignments/me')
  @Roles(Role.JUDGE)
  async getMyAssignments(@Param('eventId') eventId: string, @Req() req: any) {
    return this.judgingService.getJudgeAssignments(eventId, req.user.id);
  }

  @Post('ballots')
  @Roles(Role.JUDGE)
  async submitBallot(@Param('eventId') eventId: string, @Body() body: any, @Req() req: any) {
    return this.judgingService.submitBallot({
      ...body,
      eventId,
      judgeId: req.user.id,
    });
  }

  @Post('assignments/generate')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async generateAssignments(@Param('eventId') eventId: string, @Body() body: { minReviews?: number }) {
    return this.judgingService.generateAssignments(eventId, body.minReviews || 3);
  }

  @Post('recuse')
  @Roles(Role.JUDGE)
  async recuseAssignment(
    @Param('eventId') eventId: string,
    @Body() body: { projectId: string; reason: string; note?: string },
    @Req() req: any,
  ) {
    return this.judgingService.recuseAssignment({
      eventId,
      judgeId: req.user.id,
      projectId: body.projectId,
      reason: body.reason,
      note: body.note,
    });
  }

  // Security test endpoint: Judges attempting to view peer ballots
  @Get('projects/:projectId/peer-ballots')
  @Roles(Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async getPeerBallots(@Param('eventId') eventId: string, @Param('projectId') projectId: string, @Req() req: any) {
    if (req.user.role === Role.JUDGE) {
      throw new ForbiddenException('Judges are strictly prohibited from viewing peer ballots pre-publication');
    }
    return { error: 'Peer ballots are strictly restricted' };
  }

  @Post('pairwise')
  @Roles(Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async recordPairwise(
    @Param('eventId') eventId: string,
    @Body() body: { projectAId: string; projectBId: string; winnerId?: string; isTie?: boolean; notes?: string },
    @Req() req: any,
  ) {
    return this.judgingService.recordPairwiseComparison({
      eventId,
      judgeId: req.user.id,
      projectAId: body.projectAId,
      projectBId: body.projectBId,
      winnerId: body.winnerId,
      isTie: body.isTie,
      notes: body.notes,
    });
  }

  @Get('pairwise/queue')
  @Roles(Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async getPairwiseQueue(@Param('eventId') eventId: string, @Req() req: any) {
    return this.judgingService.getPairwiseQueue(eventId, req.user.id);
  }

  @Get('pairwise')
  @Roles(Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async getPairwiseComparisons(@Param('eventId') eventId: string) {
    return this.judgingService.getPairwiseComparisons(eventId);
  }
}
