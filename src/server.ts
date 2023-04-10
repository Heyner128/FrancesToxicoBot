import { PrismaClient } from '@prisma/client';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import TelegramBot, { Update } from 'node-telegram-bot-api';
import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { createLogger, format, transports } from 'winston';

const logTextFormat = format.printf(
  ({ level, message, timestamp, stack }) =>
    `${timestamp} ${level}: ${stack || message}`
);

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    logTextFormat
  ),
  transports: [
    new transports.File({
      filename: './logs/error.log',
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
    }),
    new transports.File({
      filename: './logs/combined.log',
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

const database = new PrismaClient();

const chatBot = new TelegramBot(process.env.BOT_TOKEN ?? '');

const httpServer = fastify().withTypeProvider<TypeBoxTypeProvider>();

if (process.env.NODE_ENV !== 'production') {
  // enables console logging in development
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), logTextFormat),
    })
  );
} else {
  // enables console logging in development
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), logTextFormat),
    })
  );
  // enables webhook in production
  if (!process.env.PUBLIC_URL) throw new Error('PUBLIC_URL is not defined!');
  await chatBot.setWebHook(
    `${process.env.PUBLIC_URL}/webhook${process.env.BOT_TOKEN}`
  );
  httpServer.post<{
    Body: Update;
  }>(
    `/webhook${process.env.BOT_TOKEN}`,
    async (request: FastifyRequest, reply: FastifyReply) => {
      chatBot.processUpdate(request.body as Update);
      reply.send(200);
    }
  );
}

export default { database, chatBot, httpServer, logger };
