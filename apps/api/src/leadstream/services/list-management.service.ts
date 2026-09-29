import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ListManagementService {
  constructor(private prisma: PrismaService) {}

  async getLists(eventId: string) {
    const lists = await this.prisma.auditEvent.findMany({
      where: {
        action: 'EMAIL_LIST',
        eventId,
      },
      orderBy: { occurredAt: 'desc' },
    });

    return lists.map((l) => {
      let details: any = {};
      try {
        details = JSON.parse(l.reason || '{}');
      } catch (e) {}
      return {
        id: l.id,
        ...details,
        createdAt: l.occurredAt,
      };
    });
  }

  async getList(id: string) {
    const list = await this.prisma.auditEvent.findUnique({
      where: { id },
    });

    if (!list || list.action !== 'EMAIL_LIST') {
      throw new NotFoundException('List not found');
    }

    let details: any = {};
    try {
      details = JSON.parse(list.reason || '{}');
    } catch (e) {}

    return {
      id: list.id,
      eventId: list.eventId,
      ...details,
    };
  }

  async createList(data: {
    eventId: string;
    name: string;
    description?: string;
    filters?: any;
  }, userId: string) {
    const list = await this.prisma.auditEvent.create({
      data: {
        action: 'EMAIL_LIST',
        actorId: userId,
        actorRole: 'ORGANIZER',
        resourceType: 'LIST',
        resourceId: `list-${Date.now()}`,
        eventId: data.eventId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify({
          name: data.name,
          description: data.description,
          filters: data.filters,
          recipientCount: 0,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    let details: any = {};
    try {
      details = JSON.parse(list.reason || '{}');
    } catch (e) {}

    return {
      id: list.id,
      ...details,
    };
  }

  async addRecipients(listId: string, data: {
    emails?: string[];
    userIds?: string[];
    csvData?: string;
  }) {
    await this.getList(listId);

    // Get current recipients
    const currentRecipients = await this.getRecipientsInternal(listId);
    const recipientSet = new Set(currentRecipients.map((r) => r.email));

    // Add new recipients
    let newRecipients: Array<{ email: string; name?: string; metadata?: any }> = [];

    if (data.emails) {
      newRecipients = data.emails.map((email) => ({ email }));
    }

    if (data.userIds) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: data.userIds } },
      });
      newRecipients = users.map((u) => ({ email: u.email, name: u.name }));
    }

    if (data.csvData) {
      newRecipients = this.parseCSV(data.csvData);
    }

    // Filter out duplicates
    const uniqueRecipients = newRecipients.filter((r) => !recipientSet.has(r.email));

    // Store recipients
    if (uniqueRecipients.length > 0) {
      await this.storeRecipients(listId, uniqueRecipients);

      // Update list count
      await this.updateListCount(listId, currentRecipients.length + uniqueRecipients.length);
    }

    return {
      success: true,
      listId,
      added: uniqueRecipients.length,
      skipped: newRecipients.length - uniqueRecipients.length,
      total: currentRecipients.length + uniqueRecipients.length,
    };
  }

  async importCSV(listId: string, file: any) {
    const csvContent = file.buffer ? file.buffer.toString('utf-8') : String(file);
    return this.addRecipients(listId, { csvData: csvContent });
  }

  async getRecipients(listId: string, page: number = 1, limit: number = 50) {
    const recipients = await this.getRecipientsInternal(listId);

    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      listId,
      page,
      limit,
      total: recipients.length,
      totalPages: Math.ceil(recipients.length / limit),
      recipients: recipients.slice(start, end),
    };
  }

  async deleteList(id: string) {
    await this.prisma.auditEvent.delete({ where: { id } }).catch(() => {});

    await this.prisma.auditEvent.deleteMany({
      where: {
        action: 'LIST_RECIPIENTS',
        resourceId: id,
      },
    }).catch(() => {});

    return {
      success: true,
      message: 'List deleted',
    };
  }

  private async getRecipientsInternal(listId: string) {
    const records = await this.prisma.auditEvent.findMany({
      where: {
        action: 'LIST_RECIPIENTS',
        resourceId: listId,
      },
    });

    const allRecipients: any[] = [];

    records.forEach((record) => {
      let details: any = {};
      try {
        details = JSON.parse(record.reason || '{}');
      } catch (e) {}
      if (details.recipients) {
        allRecipients.push(...details.recipients);
      }
    });

    return allRecipients;
  }

  private async storeRecipients(listId: string, recipients: any[]) {
    const batchSize = 1000;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await this.prisma.auditEvent.create({
        data: {
          action: 'LIST_RECIPIENTS',
          actorId: 'system',
          actorRole: 'ORGANIZER',
          resourceType: 'LIST',
          resourceId: listId,
          requestId: `req-${Date.now()}`,
          reason: JSON.stringify({
            listId,
            recipients: batch,
            addedAt: new Date().toISOString(),
          }),
        },
      });
    }
  }

  private async updateListCount(listId: string, count: number) {
    const list = await this.prisma.auditEvent.findUnique({ where: { id: listId } });
    if (!list) return;

    let details: any = {};
    try {
      details = JSON.parse(list.reason || '{}');
    } catch (e) {}
    details.recipientCount = count;
    details.updatedAt = new Date().toISOString();

    await this.prisma.auditEvent.update({
      where: { id: listId },
      data: { reason: JSON.stringify(details) },
    });
  }

  private parseCSV(csvData: string): Array<{ email: string; name?: string; metadata?: any }> {
    try {
      const lines = csvData.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return [];

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const emailIdx = headers.findIndex((h) => h.includes('email'));
      const nameIdx = headers.findIndex((h) => h.includes('name'));

      if (emailIdx === -1) return [];

      const results: Array<{ email: string; name?: string; metadata?: any }> = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        const email = parts[emailIdx];
        if (email && email.includes('@')) {
          results.push({
            email,
            name: nameIdx !== -1 ? parts[nameIdx] : undefined,
          });
        }
      }
      return results;
    } catch (error: any) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }
}
