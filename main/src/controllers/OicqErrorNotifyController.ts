import Instance from '../models/Instance';
import OicqClient from '../client/OicqClient';
import { QQClient } from '../client/QQClient';
import flags from '../constants/flags';

export default class OicqErrorNotifyController {
  private locked = false;

  public constructor(private readonly instance: Instance,
                     private readonly oicq: QQClient) {
    if (oicq instanceof OicqClient) {
      oicq.oicq.on('system.offline', async ({ message }) => {
        if (this.locked) return;
        this.locked = true;
        if (!(instance.flags & flags.DISABLE_OFFLINE_NOTICE))
          await this.instance.ownerChat.sendMessage(`<i>QQ 机器人掉线</i>\n${message}`);
      });
      oicq.oicq.on('system.online', async () => {
        this.locked = false;
      });
    }
    // TODO: NapCat
  }
}
