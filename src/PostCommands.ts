import { replacePath } from 'dotup-ts-types';
import { ConfigManager } from './ConfigManager';
import { shelly } from './Shelly';
import _ from 'lodash';

export class PostCommands {
  private readonly cm: ConfigManager;

  constructor(config: ConfigManager) {
    this.cm = config;
  }

  execute(): void {
    const mode = this.cm.getInstallMode();
    const platform = this.cm.getPlatformConfig();
    const runtime = this.cm.getRuntimeConfig(mode);

    _.merge(runtime, platform);
    if (runtime === undefined || runtime.postCommands === undefined || runtime.postCommands.length < 1) {
      return;
    }

    shelly.echoGreen('Executing post commands');

    const commands = runtime.postCommands;
    commands.forEach(command => {
      const cmd = replacePath(command, runtime);
      shelly.echoGrey(cmd);
      shelly.exec(cmd);
    });

  }

}
