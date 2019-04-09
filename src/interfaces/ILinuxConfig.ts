import { ILinuxServiceConfig } from './ILinuxServiceConfig';
import { IRuntimeConfig } from './IRuntimeConfig';
import { IPlatformConfig } from './IPlatformConfig';

export interface ILinuxConfig extends IPlatformConfig {
  systemd?: ILinuxServiceConfig;
}
