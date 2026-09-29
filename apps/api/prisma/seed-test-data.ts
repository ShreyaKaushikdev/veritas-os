/**
 * Test Data Seed Script
 * 
 * Run this to quickly populate your database with:
 * - 1 Event (AI Buildathon 2026)
 * - 4 Participants + 3 Judges + 1 Organizer
 * - 2 Teams with projects
 * - Rubric with 4 criteria
 * - Judge assignments
 * - Sample ballots (with variance to trigger detection)
 * 
 * Usage: npx ts-node prisma/seed-test-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test data seed...\n');

  // 1. Create Event
  console.log('📅 Creating event...');
  const event = await prisma.event.upsert({
    where: { slug: 'ai-buildathon-2026' },
    update: {},
    create: {
      id: 'demo-event',
      slug: 'ai-buildathon-2026',
      name: 'AI Buildathon 2026',
      description: 'Build the future of AI applications in 48 hours',
      status: 'JUDGING_OPEN',
      timezone: 'America/New_York',
      subDeadline: new Date('2026-12-31T23:59:59Z'),
      judgeDeadline: new Date('2027-01-05T23:59:59Z'),
      minReviews: 3,
      disagreeThreshold: 1.5,
      blindReviewMode: false,
    },
  });
  console.log(`✅ Event created: ${event.name} (${event.id})\n`);

  // 2. Create Users
  console.log('👥 Creating users...');
  
  const organizer = await prisma.user.upsert({
    where: { email: 'alex@org.com' },
    update: {},
    create: {
      id: 'org-001',
      email: 'alex@org.com',
      name: 'Alex Martinez',
      passwordHash: 'dummy-hash',
      role: 'ORGANIZER',
      isVerified: true,
    },
  });

  const participants = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@test.com' },
      update: {},
      create: {
        id: 'part-001',
        email: 'alice@test.com',
        name: 'Alice Johnson',
        passwordHash: 'dummy-hash',
        role: 'PARTICIPANT',
        isVerified: true,
        emailOptInFuture: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@test.com' },
      update: {},
      create: {
        id: 'part-002',
        email: 'bob@test.com',
        name: 'Bob Smith',
        passwordHash: 'dummy-hash',
        role: 'PARTICIPANT',
        isVerified: true,
        emailOptInFuture: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@test.com' },
      update: {},
      create: {
        id: 'part-003',
        email: 'charlie@test.com',
        name: 'Charlie Brown',
        passwordHash: 'dummy-hash',
        role: 'PARTICIPANT',
        isVerified: true,
        emailOptInFuture: false,
      },
    }),
    prisma.user.upsert({
      where: { email: 'diana@test.com' },
      update: {},
      create: {
        id: 'part-004',
        email: 'diana@test.com',
        name: 'Diana Prince',
        passwordHash: 'dummy-hash',
        role: 'PARTICIPANT',
        isVerified: true,
        emailOptInFuture: true,
      },
    }),
  ]);

  const judges = await Promise.all([
    prisma.user.upsert({
      where: { email: 'sarah@judge.com' },
      update: {},
      create: {
        id: 'judge-001',
        email: 'sarah@judge.com',
        name: 'Dr. Sarah Chen',
        passwordHash: 'dummy-hash',
        role: 'JUDGE',
        isVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'michael@judge.com' },
      update: {},
      create: {
        id: 'judge-002',
        email: 'michael@judge.com',
        name: 'Prof. Michael Rodriguez',
        passwordHash: 'dummy-hash',
        role: 'JUDGE',
        isVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'aisha@judge.com' },
      update: {},
      create: {
        id: 'judge-003',
        email: 'aisha@judge.com',
        name: 'Dr. Aisha Patel',
        passwordHash: 'dummy-hash',
        role: 'JUDGE',
        isVerified: true,
      },
    }),
  ]);

  console.log(`✅ Created ${participants.length} participants`);
  console.log(`✅ Created ${judges.length} judges`);
  console.log(`✅ Created 1 organizer\n`);

  // 3. Create Memberships
  console.log('🎫 Creating memberships...');
  
  await prisma.membership.upsert({
    where: { userId_eventId: { userId: organizer.id, eventId: event.id } },
    update: {},
    create: { userId: organizer.id, eventId: event.id, role: 'ORGANIZER' },
  });

  for (const participant of participants) {
    await prisma.membership.upsert({
      where: { userId_eventId: { userId: participant.id, eventId: event.id } },
      update: {},
      create: { userId: participant.id, eventId: event.id, role: 'PARTICIPANT' },
    });
  }

  for (const judge of judges) {
    await prisma.membership.upsert({
      where: { userId_eventId: { userId: judge.id, eventId: event.id } },
      update: {},
      create: { userId: judge.id, eventId: event.id, role: 'JUDGE' },
    });
  }

  console.log('✅ Memberships created\n');

  // 4. Create Tracks
  console.log('🏁 Creating tracks...');
  
  const aiTrack = await prisma.track.upsert({
    where: { id: 'track-ai' },
    update: {},
    create: {
      id: 'track-ai',
      eventId: event.id,
      name: 'AI & Machine Learning',
      description: 'Projects leveraging artificial intelligence and ML',
    },
  });

  const webTrack = await prisma.track.upsert({
    where: { id: 'track-web' },
    update: {},
    create: {
      id: 'track-web',
      eventId: event.id,
      name: 'Web & Mobile Apps',
      description: 'Web applications and mobile solutions',
    },
  });

  console.log('✅ Tracks created\n');

  // 5. Create Teams
  console.log('👨‍👩‍👧‍👦 Creating teams...');
  
  const team1 = await prisma.team.upsert({
    where: { id: 'team-001' },
    update: {},
    create: {
      id: 'team-001',
      eventId: event.id,
      name: 'AI Wizards',
      inviteCode: 'WIZARD123',
    },
  });

  const team2 = await prisma.team.upsert({
    where: { id: 'team-002' },
    update: {},
    create: {
      id: 'team-002',
      eventId: event.id,
      name: 'Code Ninjas',
      inviteCode: 'NINJA456',
    },
  });

  // Add team members
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team1.id, userId: participants[0].id } },
    update: {},
    create: { teamId: team1.id, userId: participants[0].id, role: 'LEADER' },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team1.id, userId: participants[1].id } },
    update: {},
    create: { teamId: team1.id, userId: participants[1].id, role: 'MEMBER' },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team2.id, userId: participants[2].id } },
    update: {},
    create: { teamId: team2.id, userId: participants[2].id, role: 'LEADER' },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team2.id, userId: participants[3].id } },
    update: {},
    create: { teamId: team2.id, userId: participants[3].id, role: 'MEMBER' },
  });

  console.log('✅ Teams created with members\n');

  // 6. Create Rubric
  console.log('📋 Creating rubric...');
  
  const rubric = await prisma.rubricVersion.upsert({
    where: { id: 'rubric-001' },
    update: {},
    create: {
      id: 'rubric-001',
      eventId: event.id,
      version: 1,
      isLocked: true,
    },
  });

  const criteria = await Promise.all([
    prisma.rubricCriteria.upsert({
      where: { id: 'crit-001' },
      update: {},
      create: {
        id: 'crit-001',
        rubricVersionId: rubric.id,
        name: 'Technical Implementation',
        description: 'Quality of code, architecture, and technical execution',
        weight: 0.35,
        minScore: 1.0,
        maxScore: 10.0,
        guidance: 'Look for clean code, proper error handling, scalability',
      },
    }),
    prisma.rubricCriteria.upsert({
      where: { id: 'crit-002' },
      update: {},
      create: {
        id: 'crit-002',
        rubricVersionId: rubric.id,
        name: 'Innovation & Creativity',
        description: 'Originality of the idea and creative approach',
        weight: 0.25,
        minScore: 1.0,
        maxScore: 10.0,
        guidance: 'Does this solve a real problem in a novel way?',
      },
    }),
    prisma.rubricCriteria.upsert({
      where: { id: 'crit-003' },
      update: {},
      create: {
        id: 'crit-003',
        rubricVersionId: rubric.id,
        name: 'User Experience',
        description: 'Ease of use, design quality, and overall UX',
        weight: 0.20,
        minScore: 1.0,
        maxScore: 10.0,
        guidance: 'Is it intuitive? Does it delight users?',
      },
    }),
    prisma.rubricCriteria.upsert({
      where: { id: 'crit-004' },
      update: {},
      create: {
        id: 'crit-004',
        rubricVersionId: rubric.id,
        name: 'Completeness & Polish',
        description: 'How finished is the project?',
        weight: 0.20,
        minScore: 1.0,
        maxScore: 10.0,
        guidance: 'Can it be deployed and used today?',
      },
    }),
  ]);

  // Update event with rubric
  await prisma.event.update({
    where: { id: event.id },
    data: { currentRubricId: rubric.id },
  });

  console.log(`✅ Rubric created with ${criteria.length} criteria\n`);

  // 7. Create Projects
  console.log('🚀 Creating projects...');
  
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-001' },
    update: {},
    create: {
      id: 'proj-001',
      eventId: event.id,
      teamId: team1.id,
      trackId: aiTrack.id,
      title: 'SmartChat AI',
      tagline: 'Next-generation conversational AI assistant',
      description: 'An intelligent chatbot powered by advanced NLP and machine learning algorithms. Features context awareness, multi-language support, and sentiment analysis. Built for real-time conversations with enterprise-grade security.',
      repoUrl: 'https://github.com/aiwizards/smartchat',
      demoUrl: 'https://smartchat.demo.com',
      techStack: 'Python, TensorFlow, FastAPI, React, PostgreSQL, Redis',
      featuresList: 'Multi-language support, Context awareness, Sentiment analysis, Real-time chat, Enterprise security',
      eligibility: 'ELIGIBLE',
      isFrozen: true,
      frozenAt: new Date(),
      teamHours: 48,
      isOriginalWork: true,
      license: 'MIT',
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-002' },
    update: {},
    create: {
      id: 'proj-002',
      eventId: event.id,
      teamId: team2.id,
      trackId: webTrack.id,
      title: 'CodeReview Pro',
      tagline: 'AI-powered code review and quality analysis',
      description: 'Automated code review tool that uses machine learning to detect bugs, security vulnerabilities, and suggest improvements. Supports 10+ programming languages with real-time analysis and team collaboration features.',
      repoUrl: 'https://github.com/codeninjas/reviewpro',
      demoUrl: 'https://codereview.demo.com',
      techStack: 'TypeScript, OpenAI API, Node.js, PostgreSQL, Docker, Kubernetes',
      featuresList: 'Multi-language support, Security scanning, Bug detection, Real-time analysis, Team collaboration',
      eligibility: 'ELIGIBLE',
      isFrozen: true,
      frozenAt: new Date(),
      teamHours: 48,
      isOriginalWork: true,
      license: 'Apache-2.0',
    },
  });

  console.log('✅ Projects created\n');

  // 8. Create Judge Passports
  console.log('🎫 Creating judge passports...');
  
  for (const judge of judges) {
    await prisma.judgePassport.upsert({
      where: { userId: judge.id },
      update: {},
      create: {
        userId: judge.id,
        completedReviews: 0,
        calibrationBias: 0.0,
        reliabilityScore: 1.0,
      },
    });
  }

  console.log('✅ Judge passports created\n');

  // 9. Create Assignments
  console.log('📝 Creating assignments...');
  
  // Each project gets 3 judges
  const assignments = [];
  for (let i = 0; i < judges.length; i++) {
    const judge = judges[i];
    
    // Assign to project 1
    const assign1 = await prisma.assignment.upsert({
      where: { projectId_judgeId: { projectId: project1.id, judgeId: judge.id } },
      update: {},
      create: {
        eventId: event.id,
        projectId: project1.id,
        judgeId: judge.id,
        isTargeted: false,
        status: 'ACTIVE',
      },
    });
    assignments.push(assign1);
    
    // Assign to project 2
    const assign2 = await prisma.assignment.upsert({
      where: { projectId_judgeId: { projectId: project2.id, judgeId: judge.id } },
      update: {},
      create: {
        eventId: event.id,
        projectId: project2.id,
        judgeId: judge.id,
        isTargeted: false,
        status: 'ACTIVE',
      },
    });
    assignments.push(assign2);
  }

  console.log(`✅ Created ${assignments.length} assignments\n`);

  // 10. Create Sample Ballots (with variance to trigger detection)
  console.log('🗳️ Creating sample ballots...');
  
  // Judge 1 scores Project 1 HIGH
  const ballot1 = await prisma.ballot.create({
    data: {
      eventId: event.id,
      projectId: project1.id,
      judgeId: judges[0].id,
      rubricVersionId: rubric.id,
      status: 'SUBMITTED',
      weightedScore: 8.35,
      feedback: 'Excellent technical implementation with clean architecture. Great use of modern AI frameworks and solid scalability design.',
      submittedAt: new Date(),
      ballotHash: `sha256-${Math.random().toString(36).substring(7)}`,
    },
  });

  await Promise.all([
    prisma.ballotScore.create({
      data: { ballotId: ballot1.id, criteriaId: criteria[0].id, score: 9.0, comment: 'Very clean code structure' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot1.id, criteriaId: criteria[1].id, score: 8.0, comment: 'Good innovation in NLP' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot1.id, criteriaId: criteria[2].id, score: 8.5, comment: 'Intuitive UI design' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot1.id, criteriaId: criteria[3].id, score: 7.5, comment: 'Mostly complete' },
    }),
  ]);

  // Judge 2 scores Project 1 LOW (creates high variance!)
  const ballot2 = await prisma.ballot.create({
    data: {
      eventId: event.id,
      projectId: project1.id,
      judgeId: judges[1].id,
      rubricVersionId: rubric.id,
      status: 'SUBMITTED',
      weightedScore: 5.85,
      feedback: 'Good effort but lacks some key features. Architecture could be more scalable. Several edge cases not handled properly.',
      submittedAt: new Date(),
      ballotHash: `sha256-${Math.random().toString(36).substring(7)}`,
    },
  });

  await Promise.all([
    prisma.ballotScore.create({
      data: { ballotId: ballot2.id, criteriaId: criteria[0].id, score: 6.0, comment: 'Some architectural concerns' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot2.id, criteriaId: criteria[1].id, score: 6.5, comment: 'Decent innovation' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot2.id, criteriaId: criteria[2].id, score: 5.5, comment: 'UI needs polish' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot2.id, criteriaId: criteria[3].id, score: 5.0, comment: 'Not production-ready' },
    }),
  ]);

  // Judge 1 scores Project 2 (consistently high)
  const ballot3 = await prisma.ballot.create({
    data: {
      eventId: event.id,
      projectId: project2.id,
      judgeId: judges[0].id,
      rubricVersionId: rubric.id,
      status: 'SUBMITTED',
      weightedScore: 9.10,
      feedback: 'Outstanding project! Professional-grade code review tool with real commercial potential. Excellent execution across all criteria.',
      submittedAt: new Date(),
      ballotHash: `sha256-${Math.random().toString(36).substring(7)}`,
    },
  });

  await Promise.all([
    prisma.ballotScore.create({
      data: { ballotId: ballot3.id, criteriaId: criteria[0].id, score: 9.5, comment: 'Exceptional quality' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot3.id, criteriaId: criteria[1].id, score: 9.0, comment: 'Highly innovative' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot3.id, criteriaId: criteria[2].id, score: 9.0, comment: 'Excellent UX' },
    }),
    prisma.ballotScore.create({
      data: { ballotId: ballot3.id, criteriaId: criteria[3].id, score: 9.0, comment: 'Production-ready' },
    }),
  ]);

  // Update judge passport review counts
  await prisma.judgePassport.update({
    where: { userId: judges[0].id },
    data: { completedReviews: 2 },
  });

  await prisma.judgePassport.update({
    where: { userId: judges[1].id },
    data: { completedReviews: 1 },
  });

  console.log('✅ Created 3 ballots\n');

  console.log('🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Event: ${event.name}`);
  console.log(`   - Participants: ${participants.length}`);
  console.log(`   - Judges: ${judges.length}`);
  console.log(`   - Teams: 2`);
  console.log(`   - Projects: 2`);
  console.log(`   - Assignments: ${assignments.length}`);
  console.log(`   - Ballots: 3`);
  console.log(`\n⚠️  Project "${project1.title}" has HIGH VARIANCE (8.35 vs 5.85 = 2.5 diff)`);
  console.log(`   This should trigger variance detection in the UI!`);
  console.log(`\n✅ You can now test the system with real data!`);
  console.log(`\n🧪 Test as Judge:`);
  console.log(`   localStorage.setItem('dogfood_user', JSON.stringify({ id: 'judge-003', name: 'Dr. Aisha Patel', email: 'aisha@judge.com', role: 'JUDGE' }));`);
  console.log(`   Then navigate to /judge\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
