import mongoose from 'mongoose';
import { MentorshipRegistration, IMentorshipRegistration } from './mentorship.model';
import type { RegisterMentorshipInput } from './mentorship.validation';

/** Public DTO: id is from _id.toString(), never expose _id. */
export interface MentorshipRegistrationDTO {
  id: string;
  name: string;
  school: string;
  experienceLevel: string;
  major: string;
  financeFocus: string;
  createdAt: Date;
}

function toDTO(doc: IMentorshipRegistration & { _id: mongoose.Types.ObjectId }): MentorshipRegistrationDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    school: doc.school,
    experienceLevel: doc.experienceLevel,
    major: doc.major,
    financeFocus: doc.financeFocus,
    createdAt: doc.createdAt,
  };
}

const notDeletedFilter = { $ne: true } as const;
const notDeleted = { isDeleted: notDeletedFilter };

export async function createMentorshipRegistration(
  input: RegisterMentorshipInput
): Promise<MentorshipRegistrationDTO> {
  const reg = await MentorshipRegistration.create(input);
  return toDTO(reg as IMentorshipRegistration & { _id: mongoose.Types.ObjectId });
}

export async function listMentorshipRegistrations(params: {
  page: number;
  limit: number;
}): Promise<{ items: MentorshipRegistrationDTO[]; total: number }> {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    MentorshipRegistration.find(notDeleted)
      .sort({ name: 1 })
      .collation({ locale: 'en', strength: 2 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    MentorshipRegistration.countDocuments(notDeleted).exec(),
  ]);

  return {
    items: items.map((d) => toDTO(d as unknown as IMentorshipRegistration & { _id: mongoose.Types.ObjectId })),
    total,
  };
}

export async function getAllRegistrationsSortedByName(): Promise<
  MentorshipRegistrationDTO[]
> {
  const items = await MentorshipRegistration.find(notDeleted)
    .sort({ name: 1 })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();
  return items.map((d) => toDTO(d as unknown as IMentorshipRegistration & { _id: mongoose.Types.ObjectId }));
}

/**
 * Soft-delete a registration by id. Uses internal _id; id must be valid ObjectId string.
 * @returns true if found and soft-deleted, false if not found
 */
export async function deleteMentorshipRegistration(id: string): Promise<boolean> {
  const objId = new mongoose.Types.ObjectId(id);
  const result = await MentorshipRegistration.updateOne(
    { _id: objId, ...notDeleted },
    { $set: { isDeleted: true } }
  ).exec();
  return result.matchedCount > 0;
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
