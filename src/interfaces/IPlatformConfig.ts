import { IRuntimeConfig } from './IRuntimeConfig';

export interface IPlatformConfig {
  targetPath: string;
  bin?: string;
  app?: IRuntimeConfig;
}
