import { renderFile } from 'ejs';
import { ILinuxService } from './ILinuxService';
import { shelly } from './Shelly';
import { INoinConfig } from './INoinConfig';
import fs from 'fs';

export class LinuxService {

  async generateFile(templateFilePath: string, data: ILinuxService): Promise<string> {
    return await renderFile<string>(templateFilePath, data);
  }

  install(config: INoinConfig, serviceFile: string): void {

    fs.writeFileSync(`/etc/systemd/system/${config.service}.service`, serviceFile);

    shelly.exec('sudo systemctl daemon-reload');
    shelly.exec('sudo systemctl enable motobox');
    shelly.exec('sudo systemctl restart motobox');
  }

}
