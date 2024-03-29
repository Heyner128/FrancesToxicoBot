import { GetGroupsSchema, GroupsType } from '../Models/groups.dto';
import GroupsController from '../Controllers/groups.controller';
import Server from '../server';
import HelperFunctions from '../Utils/helperFunctions.util';
import { ApiHeaders } from '../Utils/types.util';

/**
 * Adds the groups routes, and adds the hooks of pre-validation and validation to fastify
 */
function init() {
  Server.chatBot.on('my_chat_member', GroupsController.botMembershipUpdate);
  Server.chatBot.on('new_chat_members', GroupsController.newMembers);
  Server.chatBot.on('left_chat_member', GroupsController.leftMember);
  Server.httpServer.get<{
    Reply: GroupsType;
    Headers: ApiHeaders;
  }>(
    '/groups',
    {
      schema: GetGroupsSchema,
      preValidation: HelperFunctions.apiKeyPreValidation,
    },
    GroupsController.getGroups
  );
  Server.logger.info('Groups routes initialized');
}

export default { init };
