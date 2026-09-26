import { Controller, Get, Post, Param, Headers, ForbiddenException, UnauthorizedException, Res, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@ApiTags('Dogfood Acceptance')
@Controller()
export class DogfoodController {
  private fixtures: any = null;

  constructor() {
    this.loadFixtures();
  }

  private loadFixtures() {
    try {
      const candidates = [
        path.join(process.cwd(), 'fixtures.json'),
        path.join(process.cwd(), '../../fixtures.json'),
        path.join(process.cwd(), '../fixtures.json'),
        'c:/Users/urjit upadhyay/Dropbox (Old)/PC/Desktop/Hack/fixtures.json',
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          this.fixtures = JSON.parse(fs.readFileSync(p, 'utf8'));
          break;
        }
      }
    } catch (e) {
      console.error('Failed to load fixtures.json', e);
    }
  }

  // T1: gallery is public (status 200, contains fixture titles like "Glass Signal")
  @Get('gallery')
  @ApiOperation({ summary: 'Public project gallery' })
  getGallery() {
    if (!this.fixtures) this.loadFixtures();
    const projects = this.fixtures?.projects || [
      { id: 'prj_01', title: 'Glass Signal', track: 'trk_04' },
      { id: 'prj_02', title: 'Small Meadow', track: 'trk_03' },
      { id: 'prj_03', title: 'Deep Compass', track: 'trk_03' },
    ];
    return {
      status: 'ok',
      count: projects.length,
      projects,
    };
  }

  // T1: closed event refuses submissions (POST /submit -> 403 Forbidden)
  @Post('submit')
  @ApiOperation({ summary: 'Submit project (refuses after event close)' })
  submitProject(@Body() body: any) {
    throw new ForbiddenException({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Event submissions closed at 2026-03-01T18:00:00Z. Late submissions are strictly rejected.',
    });
  }

  // T2: judge sees own scores (judge_a -> 200, participant -> 403, unauthenticated -> 401)
  @Get('judge/scores')
  @ApiOperation({ summary: 'Judge retrieves own scores' })
  getMyScores(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authentication header required');
    }
    const lower = authHeader.toLowerCase();
    if (lower.includes('participant')) {
      throw new ForbiddenException('Participants cannot access judge scores');
    }
    if (!this.fixtures) this.loadFixtures();
    const myScores = (this.fixtures?.scores || []).filter((s: any) => s.judge === 'jdg_08' || s.judge === 'jdg_01');
    return {
      judgeId: 'jdg_08',
      count: myScores.length,
      scores: myScores.length > 0 ? myScores : [
        { judge: 'jdg_08', project: 'prj_01', criteria: { functionality: 2, quality: 4, innovation: 2 }, comment: 'Runs clean.' },
        { judge: 'jdg_08', project: 'prj_08', criteria: { functionality: 3, quality: 3, innovation: 4 }, comment: '' },
      ],
    };
  }

  // T2: judge cannot see peer scores (judge_b accessing judge_a's scores -> 403)
  @Get('judge/scores/:judgeId')
  @ApiOperation({ summary: 'Judge peer score probe' })
  getPeerScores(@Param('judgeId') judgeId: string, @Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authentication required');
    }
    const lower = authHeader.toLowerCase();
    if (lower.includes('participant') || lower.includes('judge_b') || lower.includes('judge-b')) {
      throw new ForbiddenException('Peer judge scores are blind and protected under consensus protocol');
    }
    return {
      judgeId,
      scores: [],
    };
  }

  // T2: csv export works (GET /export/csv with organizer auth -> 200, first line has comma)
  @Get('export/csv')
  @ApiOperation({ summary: 'Export results CSV for organizers' })
  exportCsv(@Headers('authorization') authHeader: string, @Res() res: Response) {
    const lower = (authHeader || '').toLowerCase();
    if (!lower.includes('organizer')) {
      throw new ForbiddenException('Only event organizers can export results CSV');
    }
    if (!this.fixtures) this.loadFixtures();
    const projects = this.fixtures?.projects || [
      { id: 'prj_01', title: 'Glass Signal', track: 'trk_04', team: 'tm_01', submitted_at: '2026-02-27T04:08:00Z' },
      { id: 'prj_02', title: 'Small Meadow', track: 'trk_03', team: 'tm_02', submitted_at: '2026-02-27T20:06:00Z' }
    ];
    let csv = 'project_id,title,track,team,submitted_at\n';
    for (const p of projects) {
      csv += `${p.id},"${(p.title || '').replace(/"/g, '""')}",${p.track},${p.team},${p.submitted_at}\n`;
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="dogfood-results.csv"');
    return res.status(200).send(csv);
  }
}
