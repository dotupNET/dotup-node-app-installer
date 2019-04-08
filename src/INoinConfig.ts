import { ILinuxService } from './ILinuxService';

export interface INoinConfig {
  app: boolean;
  production: boolean;
  service: string;
  targetPath: string;
  git: IGitConfig;
  override: boolean;
  systemd: ILinuxService;
}

export interface IGitConfig {
  url: string;
  userName: string;
  repositoryName: string
}
