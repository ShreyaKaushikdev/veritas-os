import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/events/:eventId/chat')
@UseGuards(AuthGuard, RolesGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  @Roles(Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async getMessages(
    @Param('eventId') eventId: string,
    @Query('projectId') projectId: string | undefined,
    @Req() req: any,
  ) {
    return this.chatService.getMessages(eventId, projectId || null, req.user.id, req.user.role);
  }

  @Post()
  @Roles(Role.JUDGE, Role.ORGANIZER, Role.ADMIN)
  async postMessage(
    @Param('eventId') eventId: string,
    @Body() body: { projectId?: string; body: string },
    @Req() req: any,
  ) {
    return this.chatService.postMessage(
      eventId,
      body.projectId || null,
      req.user.id,
      req.user.role,
      body.body,
    );
  }
}
