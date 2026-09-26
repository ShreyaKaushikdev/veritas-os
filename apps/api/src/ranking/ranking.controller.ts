import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/events/:eventId/ranking')
@UseGuards(AuthGuard, RolesGuard)
export class RankingController {
  constructor(private rankingService: RankingService) {}

  @Get('preview')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async previewRankings(@Param('eventId') eventId: string) {
    return this.rankingService.calculateRankingRun(eventId, { method: 'ANCHOR_NORMALIZED' });
  }

  @Post('simulate-weights')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async simulateWeights(@Param('eventId') eventId: string, @Body() body: { weights: Record<string, number> }) {
    return this.rankingService.simulateWeightSensitivity(eventId, body.weights);
  }

  @Post('disagreement/trigger')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async triggerDisagreementReviews(@Param('eventId') eventId: string, @Req() req: any) {
    return this.rankingService.triggerDisagreementReviews(eventId, req.user.id);
  }

  @Post('publish')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async publishResults(@Param('eventId') eventId: string, @Req() req: any) {
    return this.rankingService.finalizeAndPublishResults(eventId, req.user.id);
  }

  @Get('published')
  async getPublishedResults(@Param('eventId') eventId: string) {
    return this.rankingService.getPublishedResults(eventId);
  }

  @Get('pairwise')
  @Roles(Role.ORGANIZER, Role.ADMIN, Role.JUDGE)
  async getPairwiseRankings(@Param('eventId') eventId: string) {
    return this.rankingService.calculatePairwiseRankings(eventId);
  }

  @Get('normalization-proof')
  async getNormalizationProof(@Param('eventId') eventId: string) {
    return this.rankingService.getNormalizationProof(eventId);
  }

  @Post(':runId/sign-off')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async signOff(
    @Param('eventId') eventId: string,
    @Param('runId') runId: string,
    @Req() req: any,
  ) {
    return this.rankingService.signOffRankingRun(eventId, runId, {
      id: req.user.id,
      name: req.user.name || 'Organizer',
      email: req.user.email || 'organizer@dogfood.os',
    });
  }

  @Get('projects/:projectId/feedback')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getEntrantFeedback(
    @Param('eventId') eventId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.rankingService.getEntrantFeedbackReport(eventId, projectId, req.user.id, req.user.role);
  }
}
