/**
 * Seed mentorship registrations for local testing.
 * Run: npx tsx scripts/seed-mentorship-registrations.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
import { connectDB } from '../src/config/db';
import { MentorshipRegistration } from '../src/modules/mentorship/mentorship.model';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const SEED_DATA = [
  { name: 'Alice Chen', school: 'Harvard University', experienceLevel: 'Senior', major: 'Economics', financeFocus: 'Investment Banking' },
  { name: 'Bob Nguyen', school: 'MIT', experienceLevel: 'Master', major: 'Finance', financeFocus: 'Quantitative Finance' },
  { name: 'Carol Lee', school: 'Stanford', experienceLevel: 'Junior', major: 'Business', financeFocus: 'Corporate Finance' },
  { name: 'David Kim', school: 'UC Berkeley', experienceLevel: 'Undergraduate', major: 'Accounting', financeFocus: 'Financial Analysis' },
  { name: 'Eva Park', school: 'Wharton', experienceLevel: 'Freshman', major: 'Finance', financeFocus: 'Asset Management' },
];

async function main() {
  await connectDB();
  const count = await MentorshipRegistration.countDocuments();
  if (count > 0) {
    console.log(`Found ${count} existing registrations. Skipping seed.`);
    process.exit(0);
    return;
  }
  await MentorshipRegistration.insertMany(SEED_DATA);
  console.log(`Seeded ${SEED_DATA.length} mentorship registrations.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
