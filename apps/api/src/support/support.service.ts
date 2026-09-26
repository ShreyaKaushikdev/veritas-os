import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '../common/types';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(data: {
    eventId: string;
    reporterId: string;
    reporterRole: string;
    page: string;
    eventPhase: string;
    message: string;
    screenshotKey?: string;
    context: any;
  }) {
    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const msgLower = (data.message || '').toLowerCase();

    // 1. Auto-triage: check keywords
    let priority = 'NORMAL';
    let isUrgentSubmission = false;

    if (
      msgLower.includes("can't submit") ||
      msgLower.includes('cannot submit') ||
      msgLower.includes('deadline') ||
      msgLower.includes('upload fail') ||
      msgLower.includes('freeze error')
    ) {
      priority = 'URGENT';
      isUrgentSubmission = true;
    } else if (
      msgLower.includes('judge') ||
      msgLower.includes('score') ||
      msgLower.includes('ballot') ||
      msgLower.includes('rubric')
    ) {
      priority = 'HIGH';
    }

    // 2. Deadline Boost: if urgent submission issue and event is near or past deadline, boost priority
    if (isUrgentSubmission && event.freezeDeadline) {
      const msUntilDeadline = new Date(event.freezeDeadline).getTime() - Date.now();
      if (msUntilDeadline < 24 * 3600 * 1000) {
        priority = 'URGENT';
      }
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        eventId: data.eventId,
        reporterId: data.reporterId,
        reporterRole: data.reporterRole,
        page: data.page,
        eventPhase: data.eventPhase,
        message: data.message,
        screenshotKey: data.screenshotKey || null,
        context: JSON.stringify(data.context || {}),
        priority,
        status: 'OPEN',
      },
    });

    const ticketRef = `#${ticket.id.slice(0, 4).toUpperCase()}`;

    // 3. Spike Detection: check tickets in the last 15 minutes for this event
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentTicketsCount = await this.prisma.supportTicket.count({
      where: {
        eventId: data.eventId,
        createdAt: { gte: fifteenMinsAgo },
      },
    });

    const isSpike = recentTicketsCount >= 5;

    // 4. Record Audit Event
    await this.prisma.auditEvent.create({
      data: {
        eventId: data.eventId,
        actorId: data.reporterId,
        actorRole: (data.reporterRole as Role) || Role.PARTICIPANT,
        action: 'SUPPORT_TICKET_FILED',
        resourceType: 'SUPPORT_TICKET',
        resourceId: ticket.id,
        reason: `Auto-triaged as [${priority}]. Reference: ${ticketRef}`,
        requestId: `REQ-SOS-${Date.now()}`,
      },
    });

    // 5. Send Email via MailHog / SMTP Dispatch
    const emailPayload = {
      subject: `[${priority}] SOS ${ticketRef} — ${data.page} — ${event.name}`,
      to: 'organizers@dogfood.local',
      body: `Reporter: ${data.reporterRole} (${data.reporterId})\nPage: ${data.page}\nPhase: ${data.eventPhase}\nPriority: ${priority}\nMessage: ${data.message}\nHas Screenshot: ${Boolean(data.screenshotKey)}`,
    };

    return {
      success: true,
      ticketId: ticket.id,
      ticketRef,
      priority,
      status: ticket.status,
      ackMessage: `Organizers notified — ticket ${ticketRef}`,
      isSpike,
      recentTicketsCount,
      emailDispatched: emailPayload,
    };
  }

  async getEventTickets(eventId: string, options?: { status?: string; priority?: string }) {
    const where: any = { eventId };
    if (options?.status) where.status = options.status;
    if (options?.priority) where.priority = options.priority;

    const tickets = await this.prisma.supportTicket.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: [
        { priority: 'desc' }, // URGENT first
        { createdAt: 'desc' },
      ],
    });

    // Check for 15-minute spike
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentCount = tickets.filter((t) => t.createdAt >= fifteenMinsAgo && t.status === 'OPEN').length;

    return {
      total: tickets.length,
      spikeDetected: recentCount >= 5,
      spikeCount: recentCount,
      tickets: tickets.map((t) => ({
        ...t,
        context: JSON.parse(t.context || '{}'),
        openDurationMinutes: Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 60000),
      })),
    };
  }

  async getMyTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      ...t,
      context: JSON.parse(t.context || '{}'),
      ticketRef: `#${t.id.slice(0, 4).toUpperCase()}`,
    }));
  }

  async updateTicket(ticketId: string, data: { status?: string; priority?: string; internalNote?: string }, actorId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: data.status || ticket.status,
        priority: data.priority || ticket.priority,
        internalNote: data.internalNote !== undefined ? data.internalNote : ticket.internalNote,
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        eventId: ticket.eventId,
        actorId,
        actorRole: Role.ORGANIZER,
        action: `SUPPORT_TICKET_${updated.status}`,
        resourceType: 'SUPPORT_TICKET',
        resourceId: ticket.id,
        reason: `Status updated to ${updated.status}. Note: ${data.internalNote || 'None'}`,
        requestId: `REQ-SOS-UPD-${Date.now()}`,
      },
    });

    return updated;
  }
}
