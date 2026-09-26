import { Controller, Post, Get, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/submissions')
@UseGuards(AuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post()
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async saveDraft(@Body() body: any, @Req() req: any) {
    return this.submissionsService.createOrUpdateDraft({
      ...body,
      editorId: req.user.id,
    });
  }

  @Post(':id/freeze')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async freezeSubmission(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.submissionsService.freezeSubmission(id, req.user.id, body);
  }

  @Get(':id')
  async getProject(@Param('id') id: string) {
    return this.submissionsService.getProject(id);
  }

  @Get('event/:eventId/gallery')
  async getGallery(
    @Param('eventId') eventId: string,
    @Query('trackId') trackId?: string,
    @Query('search') search?: string,
  ) {
    return this.submissionsService.getPublicGallery(eventId, { trackId, search });
  }

  @Get(':id/health-check')
  @Roles(Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
  async getHealthCheck(@Param('id') id: string) {
    return this.submissionsService.checkSubmissionHealth(id);
  }
}
