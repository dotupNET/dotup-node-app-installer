import { renderFile } from 'ejs';
import { ILinuxService } from './ILinuxService';

export class LinuxService {

  async generateFile(templateFilePath: string, data: ILinuxService): Promise<string> {
    return await renderFile<string>(templateFilePath, data);
  }

}
