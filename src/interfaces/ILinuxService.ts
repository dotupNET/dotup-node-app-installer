export interface ILinuxService {
  Description: string;
  After: string;
  // [Service]
  ExecStart: string;
  Restart: string;
  User: string;
  // # Use 'nogroup' group for Ubuntu / Debian
  // # use 'nobody' group for Fedora
  Group: string;
  Environment: string[];
  WorkingDirectory: string;
  // [Install]
  WantedBy: string;
}
