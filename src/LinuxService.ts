import { renderFile } from 'ejs';
import { ILinuxService } from './interfaces/ILinuxService';
import { shelly } from './Shelly';
import { INoinConfig } from './interfaces/INoinConfig';
import fs from 'fs';
import path from 'path';

export class LinuxService {

  async generateFile(templateFilePath: string, data: ILinuxService): Promise<string> {
    return await renderFile<string>(templateFilePath, data);
  }

  install(config: INoinConfig, serviceFile: string): void {
    const serviceName = `${config.service}.service`;
    const srcFile = path.join(shelly.getTempDir(), serviceName);
    const targetFile = `/etc/systemd/system/${serviceName}`;
    const cmd = `sudo mv ${srcFile} ${targetFile}`;

    // Write to tmp
    fs.writeFileSync(srcFile, serviceFile);

    // move to target folder
    shelly.exec(cmd);

    shelly.exec('sudo systemctl daemon-reload');
    shelly.exec(`sudo systemctl enable ${serviceName}`);
    shelly.exec(`sudo systemctl restart ${serviceName}`);
  }

}
