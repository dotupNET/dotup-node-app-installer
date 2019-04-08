import { renderFile } from 'ejs';
import { ILinuxService } from './ILinuxService';
import { shelly } from './Shelly';
import { INoinConfig } from './INoinConfig';
import fs from 'fs';
import path from 'path';

export class LinuxService {

  async generateFile(templateFilePath: string, data: ILinuxService): Promise<string> {
    return await renderFile<string>(templateFilePath, data);
  }

  install(config: INoinConfig, serviceFile: string): void {
    const srcFile = path.join(shelly.getTempDir(), `${config.service}.service`);
    const targetFile = `/etc/systemd/system/${config.service}.service`;
    const cmd = `sudo mv ${srcFile} ${targetFile}`;

    // Write to tmp
    fs.writeFileSync(srcFile, serviceFile);

    // move to target folder
    shelly.exec(cmd);

    shelly.exec('sudo systemctl daemon-reload');
    shelly.exec('sudo systemctl enable motobox');
    shelly.exec('sudo systemctl restart motobox');
  }

}
