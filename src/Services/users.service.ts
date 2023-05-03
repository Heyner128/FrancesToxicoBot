import { WriteResult } from '@google-cloud/firestore';
import { UserType } from '../Models/users.dto.js';
import Server from '../server.js';

/**
 * Creates a user in the db
 * @param telegramId - The telegram id of the user
 * @param name - The name of the user
 * @param isAdmin - Whether the user is an admin or not
 *
 * @returns A promise that resolves to the write result
 *
 * @throws Error - If the user cannot be created or updated
 */
async function createUser(
  telegramId: bigint,
  name: string,
  isAdmin: boolean = false
): Promise<WriteResult> {
  return Server.database.users.doc(String(telegramId)).set({
    telegramId: String(telegramId),
    name,
    isAdmin,
  });
}

/**
 * Get a user from the db by their telegram id
 * @param userId - The telegram id of the user
 *
 * @returns A promise that resolves to the user
 *
 * @throws Error - If the user cannot be found
 */
async function getUserById(userId: bigint): Promise<UserType> {
  const doc = await Server.database.users.doc(String(userId)).get();

  if (!doc.exists) throw new Error('User not found');

  return doc.data() as UserType;
}

export default {
  createUser,
  getUserById,
};
