import { User } from '@prisma/client';
import Server from '../server';

async function getUserById(userId: number): Promise<User | null> {
  try {
    return await Server.database.user.findUnique({
      where: {
        telegramId: userId,
      },
    });
  } catch (error) {
    Server.logger.error(
      new Error(
        `User find error: ${error instanceof Error ? error : 'UNDEFINED'}`
      )
    );
    throw new Error('Cannot get user, not found');
  }
}

export default {
  getUserById,
};
