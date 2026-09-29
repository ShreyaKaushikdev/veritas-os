import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationService } from './notification.service';

@Injectable()
export class DeadlineReminderService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  async checkUpcomingDeadlines(): Promise<void> {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const next1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // Find events with upcoming deadlines
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          {
            regDeadline: {
              gte: now,
              lte: next24Hours,
            },
          },
          {
            subDeadline: {
              gte: now,
              lte: next24Hours,
            },
          },
        ],
      },
      include: {
        memberships: {
          include: { user: true },
        },
      },
    });

    for (const event of events) {
      await this.processEventDeadlines(event, now, next24Hours, next6Hours, next1Hour);
    }
  }

  private async processEventDeadlines(
    event: any,
    now: Date,
    next24Hours: Date,
    next6Hours: Date,
    next1Hour: Date,
  ): Promise<void> {
    const deadlines: Array<{ type: string; deadline: Date }> = [];

    if (event.regDeadline && event.regDeadline >= now && event.regDeadline <= next24Hours) {
      deadlines.push({ type: 'registration', deadline: event.regDeadline });
    }

    if (event.subDeadline && event.subDeadline >= now && event.subDeadline <= next24Hours) {
      deadlines.push({ type: 'submission', deadline: event.subDeadline });
    }

    for (const deadline of deadlines) {
      const hoursUntil = (deadline.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low';
      let timeframe = '24 hours';

      if (hoursUntil <= 1) {
        priority = 'urgent';
        timeframe = '1 hour';
      } else if (hoursUntil <= 6) {
        priority = 'high';
        timeframe = '6 hours';
      } else {
        priority = 'medium';
        timeframe = '24 hours';
      }

      // Send notifications to participants
      for (const membership of event.memberships) {
        if (membership.role === 'PARTICIPANT') {
          await this.notification.sendNotification({
            userId: membership.userId,
            title: `⏰ ${deadline.type} Deadline Approaching`,
            message: `The ${deadline.type} deadline for "${event.name}" is in ${timeframe}. Make sure to complete your ${deadline.type}!`,
            type: 'deadline',
            priority,
            metadata: {
              eventId: event.id,
              deadlineType: deadline.type,
              deadline: deadline.deadline,
            },
          });
        }
      }
    }
  }

  async getUpcomingDeadlines(eventId: string, userId: string): Promise<any> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        teams: {
          include: {
            members: true,
            project: {
              select: {
                id: true,
                title: true,
                eligibility: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const now = new Date();
    const deadlines: any[] = [];

    // Registration deadline
    if (event.regDeadline && event.regDeadline > now) {
      deadlines.push({
        type: 'registration',
        deadline: event.regDeadline,
        hoursRemaining: Math.round((event.regDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)),
        status: 'pending',
        completionStatus: 'registered',
      });
    }

    // Submission deadline
    if (event.subDeadline && event.subDeadline > now) {
      const userTeam = event.teams.find((t) => t.members.some((m) => m.userId === userId));
      const hasSubmitted = !!userTeam?.project;

      deadlines.push({
        type: 'submission',
        deadline: event.subDeadline,
        hoursRemaining: Math.round((event.subDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)),
        status: hasSubmitted ? 'completed' : 'pending',
        completionStatus: hasSubmitted ? 'submitted' : 'not_submitted',
      });
    }

    // Judging period
    if (event.judgeDeadline && event.judgeDeadline > now) {
      deadlines.push({
        type: 'judging_deadline',
        deadline: event.judgeDeadline,
        hoursRemaining: Math.round((event.judgeDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)),
        status: 'info',
      });
    }

    return {
      eventId: event.id,
      eventName: event.name,
      deadlines: deadlines.sort((a, b) => a.deadline.getTime() - b.deadline.getTime()),
      now: now.toISOString(),
    };
  }

  async getUpcomingDeadlinesForUser(userId: string): Promise<any> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            teams: {
              where: {
                members: {
                  some: { userId },
                },
              },
              include: {
                project: {
                  select: {
                    id: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const allDeadlines: any[] = [];
    const now = new Date();

    for (const membership of memberships) {
      const event = membership.event;

      if (event.subDeadline && event.subDeadline > now) {
        const team = event.teams[0];
        const hasSubmitted = !!team?.project;

        allDeadlines.push({
          eventId: event.id,
          eventName: event.name,
          type: 'submission',
          deadline: event.subDeadline,
          hoursRemaining: Math.round((event.subDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)),
          status: hasSubmitted ? 'completed' : 'pending',
        });
      }
    }

    return {
      deadlines: allDeadlines.sort((a, b) => a.deadline.getTime() - b.deadline.getTime()),
      total: allDeadlines.length,
      pending: allDeadlines.filter((d) => d.status === 'pending').length,
    };
  }

  async scheduleCustomReminder(config: {
    userId: string;
    eventId: string;
    reminderTime: Date;
    message: string;
  }): Promise<void> {
    const delay = Math.max(0, config.reminderTime.getTime() - Date.now());
    setTimeout(() => {
      this.notification.sendNotification({
        userId: config.userId,
        title: '⏰ Custom Reminder',
        message: config.message,
        type: 'deadline',
        priority: 'high',
        metadata: { eventId: config.eventId },
      }).catch(console.error);
    }, delay);
  }
}
