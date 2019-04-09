import { IRuntimeConfig } from './IRuntimeConfig';

export interface IPlatformConfig {
  targetPath: string;
  app?: IRuntimeConfig;
}
