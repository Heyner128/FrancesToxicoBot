import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { Message } from 'node-telegram-bot-api';
import TokensService from '../Services/tokens.service';
import SubscriptionsService from '../Services/subscriptions.service';
import UsersService from '../Services/users.service';
import Server from '../server';
import {
  FastifyReplyTypebox,
  FastifyRequestTypebox,
} from '../Utils/types.util';
import { CreateTokenSchema } from '../Models/tokens.dto';

const userRedeeming: number[] = [];

/**
 * This is called when the user sends the token to the bot
 * @param msg - The message object
 *
 * @returns A promise that resolves with the validation message
 *
 * @throws Error if the message object is not valid or the redeeming process fails
 */
async function redeemTokenListener(msg: Message): Promise<Message> {
  if (msg.chat.id && msg.text) {
    try {
      const token = await TokensService.redeemToken(msg.text);
      Server.logger.info(
        `${msg.chat?.id ?? 'NO_SENDER_ID'} redeemed token ${msg.text}`
      );

      const user = await UsersService.createUser(
        BigInt(msg.chat.id),
        msg.chat.first_name ?? 'NO_NAME'
      );

      const subscription = await SubscriptionsService.createSubscription(
        user.telegramId,
        token.groupId,
        dayjs().add(token.subscriptionDurationInDays, 'day').toDate()
      );

      Server.logger.info(
        `Subscription created for group ${subscription.groupId} until ${subscription.expiresAt} `
      );
      return await Server.chatBot.sendMessage(
        msg.chat.id,
        `Subscripción activada correctamente, expira el ${dayjs(
          subscription.expiresAt
        ).format('DD/MM/YYYY')}`
      );
    } catch (error) {
      Server.logger.error(new Error(`Error redeeming token ${msg.text}`));
      return await Server.chatBot.sendMessage(
        msg.chat.id,
        'No se pudo activar la subscripción'
      );
    } finally {
      await Server.chatBot.removeTextListener(/.+/);
    }
  }
  const error = new Error(
    'Error getting message informations from telegram API'
  );
  Server.logger.error(error);
  throw error;
}

/**
 * Sends a message requesting the token to the user and returns a promise that resolves when the token is redeemed
 * @param msg - The message object
 *
 * @returns A promise that resolves when the token is redeemed
 *
 * @throws Error if the message object is not valid
 */
async function redeemToken(msg: Message): Promise<Message | boolean> {
  if (userRedeeming.includes(msg.chat.id)) return false;

  if (msg.chat.id && msg.text) {
    userRedeeming.push(msg.chat.id);

    await Server.chatBot.removeTextListener(/.+/);

    await Server.chatBot.sendMessage(
      msg.chat.id,
      'Escribe el código de la subscripción'
    );

    Server.logger.info(`Token requested to user ${msg.chat.id}`);

    // FIXME IMPORTANT there's a memory leak here
    // possible causes: the listener is not removed when the user sends the token
    // or the listener is not removed when the user sends a message that is not the token
    // or the promise is not resolved when the user sends the token
    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      Server.chatBot.onText(/.+/, (msgCB: Message) => {
        try {
          resolve(redeemTokenListener(msgCB));
        } catch (error) {
          reject(error);
        } finally {
          userRedeeming.splice(userRedeeming.indexOf(msg.chat.id), 1);
        }
      });
    });
  }
  const error = new Error(
    'Error getting message informations from telegram API'
  );
  Server.logger.error(error);
  throw error;
}

/**
 * Handles the creation of a new token on the route `/tokens`
 * @param request - The request object
 * @param reply - The reply object
 */
async function createToken(
  request: FastifyRequestTypebox<typeof CreateTokenSchema>,
  reply: FastifyReplyTypebox<typeof CreateTokenSchema>
) {
  try {
    const { groupId, subscriptionDurationInDays } = request.body;
    const token = await TokensService.createToken(
      uuid(),
      BigInt(groupId),
      subscriptionDurationInDays
    );
    reply.status(200).send({
      ...token,
      groupId: token.groupId.toString(),
    });
    Server.logger.info(
      `Token ${token.token} created for group ${token.groupId}`
    );
  } catch (error) {
    Server.logger.error(new Error(`Error creating token`));
    reply.status(500).send({
      message: `Cannot create token, Error: ${
        error instanceof Error ? error?.message : String(error)
      }`,
    });
  }
}

export default { redeemToken, createToken };
