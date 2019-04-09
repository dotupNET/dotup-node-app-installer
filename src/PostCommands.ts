import { INoinConfig } from './interfaces/INoinConfig';
import { shelly } from './Shelly';
import { replace } from 'dotup-ts-types';

export class PostCommands {
  private readonly config: INoinConfig;

  constructor(config: INoinConfig) {
    this.config = config;
  }

  execute(): void {

    if (this.config === undefined || this.config.postCommands === undefined || this.config.postCommands.length < 1) {
      return;
    }

    shelly.echoGreen('Executing post commands');

    const commands = this.config.postCommands;
    commands.forEach(command => {
      const cmd = replace(command, this.config);
      shelly.exec(cmd);
    });

  }

}
