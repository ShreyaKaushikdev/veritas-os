/**
 * Plain-English explanations for every technical word used on the site.
 *
 * HOW TO USE
 * Import the word or the component:
 *
 *   import { Explain, WORD } from '@/lib/terms';
 *
 *   <Explain>Tamper-evident</Explain>        // shows a small "?" next to the word
 *   <Explain term={WORD.ballot}>ballot</Explain>
 *
 * Keep every explanation to one or two short sentences. If you cannot explain
 * something simply, that is a sign the feature needs a clearer name, not a
 * longer description.
 */

export const WORDS = {
  hackathon: {
    plain: 'hackathon',
    means: 'An event where people build something together in a short time, then show it to judges.',
  },
  project: {
    plain: 'project',
    means: 'The thing a team built and submits at the end.',
  },
  track: {
    plain: 'track',
    means: 'A category, like "Best Mobile App" or "Best AI Tool". Every project picks one.',
  },
  ballot: {
    plain: 'ballot',
    means: "One judge's scores for one project. Ballots are locked once submitted so they cannot be changed.",
  },
  judge: {
    plain: 'judge',
    means: 'The person scoring projects. They only see the projects assigned to them.',
  },
  rubric: {
    plain: 'scoring guide',
    means: 'The list of questions judges score each project on, and how much each question counts.',
  },
  calibration: {
    plain: 'judge practice round',
    means: 'Judges score a few practice projects first, so everyone is using the same scale.',
  },
  anchor: {
    plain: 'example project',
    means: 'A practice project that shows what a low, middle and high score look like.',
  },
  recusal: {
    plain: 'stepping aside',
    means: 'A judge saying "I know this team, so I should not judge them". The project goes to someone else.',
  },
  conflict: {
    plain: 'conflict of interest',
    means: 'A situation where a judge might be tempted to be unfair, such as judging their own team.',
  },
  dispute: {
    plain: 'dispute',
    means: 'A complaint that a score is wrong. An organizer reviews it and decides.',
  },
  outlier: {
    plain: 'odd score',
    means: 'A score that is very different from everyone else. It gets checked before the results are final.',
  },
  arbitration: {
    plain: 'final decision',
    means: 'When a person, not the system, makes the final call on a dispute.',
  },
  freeze: {
    plain: 'lock in',
    means: 'Locking your submission so you cannot change it after the deadline.',
  },
  draft: {
    plain: 'draft',
    means: 'Work in progress that you can keep editing. Only a locked submission counts.',
  },
  idempotent: {
    plain: 'safe to retry',
    means: 'If the same request is sent twice, nothing bad happens the second time.',
  },
  telemetry: {
    plain: 'live numbers',
    means: 'The numbers that update by themselves as people use the site.',
  },
  audit: {
    plain: 'audit',
    means: 'A full list of everything that happened, kept so it can be checked later.',
  },
  auditTrail: {
    plain: 'history',
    means: 'A list of every action in order, with who did it and when.',
  },
  immutable: {
    plain: 'cannot be changed',
    means: 'Once something is written down it stays exactly as it was. Nobody can edit or delete it.',
  },
  ledger: {
    plain: 'record book',
    means: 'The tamper-proof list of locked scores. Each new entry is tied to the one before it.',
  },
  hash: {
    plain: 'digital fingerprint',
    means: 'A short code made from a file. If the file changes at all, the code changes too.',
  },
  merkle: {
    plain: 'seal',
    means: 'A way of combining many fingerprints into one, so a whole batch can be checked at once.',
  },
  merkleDag: {
    plain: 'sealed chain',
    means: 'Scores are grouped into blocks, and each block is tied to the one before it, forming a chain.',
  },
  stateRoot: {
    plain: 'summary of one block',
    means: 'One fingerprint standing in for every score in that block.',
  },
  zkProof: {
    plain: 'maths check',
    means: 'A quick maths test that proves the right scores were counted without showing them.',
  },
  zk: {
    plain: 'prove without revealing',
    means: 'A way to prove something is true without showing the private details.',
  },
  groth16: {
    plain: 'fast maths check',
    means: 'A quick way to run the maths check above. It takes about a millisecond.',
  },
  circ: {
    plain: 'tool for building maths checks',
    means: 'A free tool used to build the maths checks. It turns the rules into a circuit.',
  },
  circuit: {
    plain: 'the maths rules',
    means: 'The actual arithmetic written out as steps a computer can follow.',
  },
  receipt: {
    plain: 'receipt',
    means: 'The proof you get after submitting. It proves your score was recorded exactly as you sent it.',
  },
  signature: {
    plain: 'signature',
    means: 'A mark that shows the server received this exact score from you and nobody changed it.',
  },
  cryptographic: {
    plain: 'very hard to fake',
    means: 'Protected by maths that is practically impossible to break on a normal computer.',
  },
  sha256: {
    plain: 'digital fingerprint',
    means: 'A standard kind of fingerprint. Any change to the input gives a completely different result.',
  },
  commitSha: {
    plain: 'code version number',
    means: 'The exact version of the code that was submitted, so it can always be found again.',
  },
  anchorNormalized: {
    plain: 'fair scoring',
    means: 'Scores are adjusted so one unusually generous judge cannot swing the whole result.',
  },
  elo: {
    plain: 'head-to-head rating',
    means: 'Like chess ratings. Beating a strong entry raises your rating more than beating a weak one.',
  },
  eloShift: {
    plain: 'rating change',
    means: 'How much this rating went up or down after the latest results.',
  },
  normalized: {
    plain: 'made comparable',
    means: 'Putting different judges scores on one scale, so they can be compared fairly.',
  },
  percentile: {
    plain: 'better than most',
    means: 'If you are in the 90th percentile, you scored higher than 9 out of 10 entries.',
  },
  pairwise: {
    plain: 'head-to-head',
    means: 'Comparing two projects directly instead of scoring them one by one. Good for settling close calls.',
  },
  swarm: {
    plain: 'group of helpers',
    means: 'Many small workers that each check a few projects, then combine their results.',
  },
  mesh: {
    plain: 'linked together',
    means: 'Everything is connected to everything else, with no single point that can break.',
  },
  federation: {
    plain: 'separate systems working together',
    means: 'Different organizations keep their own data but share it when they need to.',
  },
  offlineFirst: {
    plain: 'works without internet',
    means: 'The app saves your work on your own device first, and syncs when it can.',
  },
  airGapped: {
    plain: 'no internet needed',
    means: 'The work is done entirely on your own machine, with nothing sent anywhere.',
  },
  deterministic: {
    plain: 'same answer every time',
    means: 'Running it twice with the same input gives exactly the same output.',
  },
  heuristic: {
    plain: 'rule of thumb',
    means: 'A quick check based on experience, not a precise calculation.',
  },
  heuristicEngine: {
    plain: 'rule-of-thumb checker',
    means: 'A set of simple rules that gives fast, rough feedback.',
  },
  a11y: {
    plain: 'easy to use for everyone',
    means: 'Works well for people who cannot see, cannot hear, or who use a keyboard only.',
  },
  responsive: {
    plain: 'fits any screen',
    means: 'Looks right on a phone, a laptop and a big screen.',
  },
  fallback: {
    plain: 'backup plan',
    means: 'What happens automatically when the normal way does not work.',
  },
  emptyState: {
    plain: 'nothing here yet',
    means: 'The message shown when there is no data to display.',
  },
  latency: {
    plain: 'how long it takes',
    means: 'The wait between clicking something and seeing the answer. Lower is faster.',
  },
  airGap: {
    plain: 'no internet needed',
    means: 'The work is done entirely on your own machine, with nothing sent anywhere.',
  },
  scopePressure: {
    plain: 'too much for the time',
    means: 'A check that tells you whether the plan is realistic for the hours available.',
  },
  confidence: {
    plain: 'how sure we are',
    means: 'How much to trust this feedback. A long clear description gives higher confidence.',
  },
  rubricAlignment: {
    plain: 'matches the scoring guide',
    means: 'How closely the work lines up with what the judges are being asked to look for.',
  },
  feasibility: {
    plain: 'can it actually be built',
    means: 'Whether this is realistic to finish in the time available.',
  },
  novelty: {
    plain: 'is it new',
    means: 'Whether the idea is different from what already exists.',
  },
  technicalDepth: {
    plain: 'is it technically impressive',
    means: 'How hard the engineering really is, beyond just showing a screen.',
  },
  impact: {
    plain: 'does it help anyone',
    means: 'Who genuinely benefits from this, and how much.',
  },
  presentation: {
    plain: 'how well it is explained',
    means: 'Whether the team can clearly show what they built and why it matters.',
  },
  reproducibility: {
    plain: 'can someone else run it',
    means: 'Whether another person could follow the steps and get the same result.',
  },
  evidence: {
    plain: 'proof',
    means: 'Screenshots, numbers or code that show the thing really works.',
  },
  autopilot: {
    plain: 'auto-pilot',
    means: 'The site writes routine announcements and messages for the organizer to approve.',
  },
  synthesize: {
    plain: 'write a first draft',
    means: 'The site puts together a starting message that a human then edits.',
  },
  calibrationSet: {
    plain: 'practice projects',
    means: 'The projects judges score first, to agree on what each score level means.',
  },
  consensus: {
    plain: 'agreement',
    means: 'When the judges broadly agree on the outcome.',
  },
  peerBlind: {
    plain: 'judges cannot see each other',
    means: 'Judges score without seeing other judges scores, so nobody copies anyone.',
  },
  airGappedEval: {
    plain: 'checked on your own machine',
    means: 'The scoring check runs locally, with nothing sent to the internet.',
  },
  triState: {
    plain: 'yes, no or unsure',
    means: 'Every answer is one of three values, never just yes or no.',
  },
  rubricVersion: {
    plain: 'version of the scoring guide',
    means: 'If the guide changes, it gets a new version number so old scores still make sense.',
  },
  healthCheck: {
    plain: 'ready to submit?',
    means: 'A quick check that tells you what is missing before you lock in your work.',
  },
  spike: {
    plain: 'sudden pile-up',
    means: 'Lots of people reporting the same problem at once. A sign something is badly broken.',
  },
  moderation: {
    plain: 'keeping things clean',
    means: 'Stopping rude or unfair content before it appears.',
  },
  gdpr: {
    plain: 'privacy law',
    means: 'The European privacy rules that decide what data you may collect and store.',
  },
  sovereignty: {
    plain: 'own data own rules',
    means: 'Each organization keeps control of its own data instead of sending it to a central company.',
  },
  provenance: {
    plain: 'where it came from',
    means: 'The full history showing where a piece of work or data first came from.',
  },
  attribution: {
    plain: 'who made it',
    means: 'Crediting the people who built something.',
  },
  gasless: {
    plain: 'no fee to use',
    means: 'The person does not pay to use this feature.',
  },
  polkadot: {
    plain: 'shared chain',
    means: 'A blockchain that several networks can plug into.',
  },
  substrate: {
    plain: 'building blocks',
    means: 'The toolkit used to build apps that can connect to a shared chain.',
  },
  felt: {
    plain: 'co-working space',
    means: 'Where people come to build things together in person.',
  },
  neurodiversity: {
    plain: 'different brains',
    means: 'People think in different ways. Design should work for all of them.',
  },
} as const;

export type WordKey = keyof typeof WORDS;

/** Look up a word. Returns undefined so callers can fall back gracefully. */
export function explain(key: WordKey) {
  return WORDS[key];
}
