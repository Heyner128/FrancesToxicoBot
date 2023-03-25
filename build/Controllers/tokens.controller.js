import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import TokensService from '../Services/tokens.service';
import SubscriptionsService from '../Services/subscriptions.service';
import Server from '../server';
async function redeemTokenListener(msg) {
    if (msg.chat.id && msg.text) {
        try {
            const token = await TokensService.redeemToken(msg.text);
            Server.logger.info(`${msg.from?.id ?? 'NO_SENDER_ID'} redeemed token ${msg.text}`);
            const subscription = await SubscriptionsService.createSubscription(BigInt(msg.chat.id), token.groupId, dayjs().add(token.subscriptionDurationInDays, 'day').toDate());
            Server.logger.info(`Subscription created for group ${subscription.groupId} until ${subscription.expiresAt} `);
            await Server.chatBot.removeTextListener(/.+/);
            return await Server.chatBot.sendMessage(msg.chat.id, `Subscripción activada correctamente, expira el ${dayjs(subscription.expiresAt).format('DD/MM/YYYY')}`);
        }
        catch (error) {
            Server.logger.error(`Error redeeming token ${msg.text}:`, error);
            await Server.chatBot.removeTextListener(/.+/);
            return Server.chatBot.sendMessage(msg.chat.id, 'No se pudo activar la subscripción');
        }
    }
    const error = new Error('Error getting message informations from telegram API');
    Server.logger.error(error);
    throw error;
}
async function redeemToken(msg) {
    if (msg.chat.id && msg.text) {
        await Server.chatBot.sendMessage(msg.chat.id, 'Escribe el código de la subscripción');
        Server.logger.info(`Token requested to user ${msg.chat.id}`);
        return new Promise((resolve, reject) => {
            Server.chatBot.onText(/.+/, (msgCB) => {
                try {
                    resolve(redeemTokenListener(msgCB));
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    const error = new Error('Error getting message informations from telegram API');
    Server.logger.error(error);
    throw error;
}
async function createToken(request, reply) {
    try {
        const { groupId, subscriptionDurationInDays } = request.body;
        const token = await TokensService.createToken(uuid(), BigInt(groupId), subscriptionDurationInDays);
        reply.status(200).send({
            ...token,
            groupId: token.groupId.toString(),
        });
        Server.logger.info(`Token ${token.token} created for group ${token.groupId}`);
    }
    catch (error) {
        Server.logger.error('Error creating token:', error);
        reply.status(500).send({
            message: `Cannot create token, Error: ${error instanceof Error ? error?.message : String(error)}`,
        });
    }
}
export default { redeemToken, createToken };
