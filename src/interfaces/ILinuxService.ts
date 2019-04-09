import { IRuntimeConfig } from './IRuntimeConfig';

export interface ILinuxService extends IRuntimeConfig {
  Description: string;
  After: string;
  // [Service]
  ExecStart: string;
  Restart: string;
  User: string;
  // # Use 'nogroup' group for Ubuntu / Debian
  // # use 'nobody' group for Fedora
  Group: string;
  // [Install]
  WantedBy: string;
  WorkingDirectory: string;
}
