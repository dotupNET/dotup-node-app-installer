import { INoinConfig } from './interfaces/INoinConfig';
import { shelly } from './Shelly';
import { replace } from 'dotup-ts-types';
import { IPlatformConfig } from './interfaces/IPlatformConfig';
import os from 'os';
import { ConfigManager } from './ConfigManager';

export class PostCommands {
  private readonly config: ConfigManager;

  constructor(config: ConfigManager) {
    this.config = config;
  }

  execute(): void {
    const mode = this.config.getInstallMode();
    const runtime = this.config.getRuntimeConfig(mode);
    if (runtime === undefined || runtime.postCommands === undefined || runtime.postCommands.length < 1) {
      return;
    }

    shelly.echoGreen('Executing post commands');

    const commands = runtime.postCommands;
    commands.forEach(command => {
      const cmd = replace(command, this.config);
      shelly.exec(cmd);
    });

  }

}
