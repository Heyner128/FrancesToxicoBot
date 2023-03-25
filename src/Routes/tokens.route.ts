import { CreateTokenSchema, TokenType } from '../Models/tokens.dto';
import TokensController from '../Controllers/tokens.controller';
import Server from '../server';

function init() {
  Server.httpServer.post<{ Body: TokenType; Reply: TokenType }>(
    '/tokens',
    {
      schema: CreateTokenSchema,
    },
    TokensController.createToken
  );
  Server.logger.info('Tokens routes initialized');
}

export default { init };
