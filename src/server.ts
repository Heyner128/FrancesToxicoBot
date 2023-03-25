import { PrismaClient } from '@prisma/client';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import TelegramBot from 'node-telegram-bot-api';
import fastify from 'fastify';
import { createLogger, format, transports } from 'winston';

const database = new PrismaClient();

const chatBot = new TelegramBot(process.env.BOT_TOKEN ?? '', {
  polling: true,
});

const httpServer = fastify().withTypeProvider<TypeBoxTypeProvider>();

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
    new transports.File({ filename: './logs/error.log', level: 'error' }),
    new transports.File({ filename: './logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), logTextFormat),
    })
  );
}

export default { database, chatBot, httpServer, logger };
