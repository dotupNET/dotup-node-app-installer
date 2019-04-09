import { ILinuxService } from './ILinuxService';
import { IGitConfig } from './IGitConfig';

export interface INoinConfig {
  app: boolean;
  production: boolean;
  service: string;
  targetPath: string;
  git: IGitConfig;
  override: boolean;
  systemd: ILinuxService;
  postCommands: string[];
}
