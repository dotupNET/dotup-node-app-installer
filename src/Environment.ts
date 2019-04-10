import { IRuntimeConfig } from './interfaces/IRuntimeConfig';
import fs from 'fs';

export class Environment {

  filePath: string;

  createFile(filePath: string, config: IRuntimeConfig): void {
    if (config.Environment === undefined || config.Environment.length < 1) {
      return;
    }

    const content = config.Environment.map(line => `${line} \n`);
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });

    this.filePath = filePath;
  }

}

