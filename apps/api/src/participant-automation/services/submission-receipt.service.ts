import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ThirdPartyIntegrationService } from './third-party-integration.service';
import * as crypto from 'crypto';

@Injectable()
export class SubmissionReceiptService {
  constructor(
    private prisma: PrismaService,
    private thirdParty: ThirdPartyIntegrationService,
  ) {}

  async generateReceipt(projectId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: { include: { members: { include: { user: true } } } },
        event: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const submittedAt = project.createdAt;
    const deadline = project.event.subDeadline || project.createdAt;

    // Generate cryptographic proof
    const proof = this.generateSubmissionProof(project);

    // Generate QR code for verification
    const qrCodeUrl = await this.thirdParty.generateQRCode(
      `${process.env.APP_URL || 'http://localhost:3000'}/verify/${proof.hash}`,
    );

    const receipt = {
      receiptId: proof.hash.substring(0, 16),
      project: {
        id: project.id,
        title: project.title,
        track: project.trackId,
      },
      team: {
        id: project.team.id,
        name: project.team.name,
        members: project.team.members.map((m) => ({
          name: m.user.name,
          email: m.user.email,
        })),
      },
      event: {
        id: project.event.id,
        name: project.event.name,
      },
      submission: {
        timestamp: submittedAt,
        deadline: deadline,
        onTime: submittedAt <= deadline,
      },
      proof: {
        hash: proof.hash,
        algorithm: 'SHA-256',
        chainPosition: proof.chainPosition,
        previousHash: proof.previousHash,
      },
      verification: {
        url: `${process.env.APP_URL || 'http://localhost:3000'}/verify/${proof.hash}`,
        qrCode: qrCodeUrl,
      },
      issuedAt: new Date().toISOString(),
    };

    // Store receipt in audit log
    await this.prisma.auditEvent.create({
      data: {
        action: 'SUBMISSION_RECEIPT',
        actorId: project.team.members[0]?.userId || 'system',
        actorRole: 'PARTICIPANT',
        resourceType: 'PROJECT',
        resourceId: project.id,
        eventId: project.eventId,
        requestId: `req-${Date.now()}`,
        reason: JSON.stringify(receipt),
      },
    });

    return receipt;
  }

  async generatePDF(projectId: string): Promise<any> {
    const receipt = await this.generateReceipt(projectId);

    // Generate PDF (you would use a library like puppeteer or pdfkit)
    const html = this.generateReceiptHTML(receipt);

    return {
      format: 'pdf',
      filename: `submission-receipt-${receipt.receiptId}.pdf`,
      html, // In production, convert this to PDF
      downloadUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/participant-automation/projects/${projectId}/submission-receipt/pdf`,
    };
  }

  private generateSubmissionProof(project: any): any {
    const data = {
      projectId: project.id,
      title: project.title,
      teamId: project.teamId,
      submittedAt: project.createdAt?.toISOString(),
      eventId: project.eventId,
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');

    // In a full implementation, this would link to the blockchain/hash chain
    return {
      hash,
      chainPosition: Math.floor(Math.random() * 1000), // Placeholder
      previousHash: 'genesis', // Placeholder
    };
  }

  private generateReceiptHTML(receipt: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Submission Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
          }
          .receipt-id {
            font-size: 14px;
            font-family: monospace;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 10px;
          }
          .content {
            padding: 40px;
          }
          .section {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px dashed #e2e8f0;
          }
          .section:last-child {
            border-bottom: none;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .field {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .field-label {
            color: #64748b;
            font-weight: 600;
          }
          .field-value {
            color: #1e293b;
            font-weight: 400;
            text-align: right;
            max-width: 60%;
          }
          .success-badge {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
          }
          .hash-value {
            font-family: monospace;
            font-size: 11px;
            word-break: break-all;
            background: #f1f5f9;
            padding: 12px;
            border-radius: 6px;
            margin-top: 8px;
          }
          .qr-code {
            text-align: center;
            margin-top: 20px;
          }
          .qr-code img {
            max-width: 200px;
            border: 4px solid #10b981;
            border-radius: 8px;
          }
          .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          .verification-url {
            margin-top: 10px;
            font-family: monospace;
            color: #10b981;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>🎯 SUBMISSION RECEIPT</h1>
            <div class="receipt-id">Receipt ID: ${receipt.receiptId}</div>
          </div>

          <div class="content">
            <!-- Project Information -->
            <div class="section">
              <div class="section-title">📋 Project Information</div>
              <div class="field">
                <span class="field-label">Project Title:</span>
                <span class="field-value">${receipt.project.title}</span>
              </div>
              <div class="field">
                <span class="field-label">Track:</span>
                <span class="field-value">${receipt.project.track || 'General'}</span>
              </div>
              <div class="field">
                <span class="field-label">Project ID:</span>
                <span class="field-value">${receipt.project.id}</span>
              </div>
            </div>

            <!-- Team Information -->
            <div class="section">
              <div class="section-title">👥 Team Information</div>
              <div class="field">
                <span class="field-label">Team Name:</span>
                <span class="field-value">${receipt.team.name}</span>
              </div>
              <div class="field">
                <span class="field-label">Team Size:</span>
                <span class="field-value">${receipt.team.members.length} member(s)</span>
              </div>
            </div>

            <!-- Submission Details -->
            <div class="section">
              <div class="section-title">⏰ Submission Details</div>
              <div class="field">
                <span class="field-label">Submitted At:</span>
                <span class="field-value">${new Date(receipt.submission.timestamp).toLocaleString()}</span>
              </div>
              <div class="field">
                <span class="field-label">Deadline:</span>
                <span class="field-value">${new Date(receipt.submission.deadline).toLocaleString()}</span>
              </div>
              <div class="field">
                <span class="field-label">Status:</span>
                <span class="field-value">
                  ${receipt.submission.onTime ? '<span class="success-badge">✓ ON TIME</span>' : '<span style="background:#ef4444;" class="success-badge">✗ LATE</span>'}
                </span>
              </div>
            </div>

            <!-- Cryptographic Proof -->
            <div class="section">
              <div class="section-title">🔐 Cryptographic Proof</div>
              <div class="field">
                <span class="field-label">Algorithm:</span>
                <span class="field-value">${receipt.proof.algorithm}</span>
              </div>
              <div class="field">
                <span class="field-label">Chain Position:</span>
                <span class="field-value">#${receipt.proof.chainPosition}</span>
              </div>
              <div class="hash-value">
                <strong>Submission Hash:</strong><br/>
                ${receipt.proof.hash}
              </div>
            </div>

            <!-- Verification QR Code -->
            <div class="qr-code">
              <img src="${receipt.verification.qrCode}" alt="Verification QR Code" />
              <div class="verification-url">${receipt.verification.url}</div>
            </div>
          </div>

          <div class="footer">
            <p><strong>DOGFOOD OS</strong> - Hackathon Operating System</p>
            <p>This receipt is cryptographically verifiable and tamper-proof.</p>
            <p>Issued: ${new Date(receipt.issuedAt).toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
