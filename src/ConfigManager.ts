import fs from 'fs';
import os from 'os';
import path from 'path';
import { InstallMode } from './Enumerations';
import { ILinuxConfig } from './interfaces/ILinuxConfig';
import { ILinuxServiceConfig } from './interfaces/ILinuxServiceConfig';
import { INoinArguments } from './interfaces/INoinArguments';
import { INoinConfig } from './interfaces/INoinConfig';
import { IPlatformConfig } from './interfaces/IPlatformConfig';
import { IRuntimeConfig } from './interfaces/IRuntimeConfig';
import { IWindowsConfig } from './interfaces/IWindowsConfig';
import { shelly } from './Shelly';

export class ConfigManager {

  config: INoinConfig;

  loadConfig(dir: string, args?: Partial<INoinArguments>): INoinConfig {
    const configFile = path.join(dir, '.noin.json');

    if (fs.existsSync(configFile)) {
      // Config from file
      shelly.echoGrey(`Loading configuration from file ${configFile}`);
      const fileConfig = <INoinConfig>JSON.parse((fs.readFileSync(configFile, 'utf8')));
      this.config = fileConfig;

    } else if (args === undefined) {
      // No configuration
      shelly.echoYellow(`No configuration provided`);
      args = <INoinArguments>{};

    } else {
      // Config from args
      shelly.echoGrey(`Loading configuration from arguments`);
      this.config = {
        production: args.production,
        override: args.override,
        git: {
          repositoryName: args.repositoryName,
          userName: args.userName,
          url: ''
        },
        linux: os.platform() === 'linux' ? <ILinuxConfig>{} : undefined,
        win32: os.platform() === 'win32' ? <IWindowsConfig>{} : undefined
      };

      if (args.app !== undefined) {
        this.setAppConfig(args.targetPath);
      } else {
        if (args.service !== undefined) {
          this.config.linux.systemd = <ILinuxServiceConfig>{};
          this.config.linux.systemd.WorkingDirectory = args.targetPath;
        }
      }

      return this.config;
    }
  }

  getInstallMode(): InstallMode {
    const runtime = this.getPlatformConfig<ILinuxConfig>();
    if (runtime.app !== undefined && runtime.systemd === undefined) {
      return InstallMode.app;
    }

    if (runtime.systemd !== undefined && runtime.app === undefined) {
      return InstallMode.service;
    }

    return undefined;
  }

  async getIsProduction(): Promise<boolean> {
    return this.config.production;
  }

  getServiceConfig(): ILinuxServiceConfig {
    if (this.config.linux === undefined) { return undefined; }

    return this.config.linux.systemd;
  }

  canInstallService(mode: InstallMode): boolean {
    if (mode === InstallMode.service) {
      if (os.platform() === 'linux') {
        return true;
      } else {
        shelly.echoYellow(`Service installation not support on platform '${os.platform()}'`);
      }
    }

    return false;
  }

  setAppConfig(targetPath: string): void {
    const runtimeConfig: Partial<IPlatformConfig> = {
      targetPath: targetPath
    };

    if (os.platform() === 'win32') {
      this.config.win32 = <IWindowsConfig>{};
      this.config.win32.app = <IRuntimeConfig>runtimeConfig;
    } else if (os.platform() === 'linux') {
      this.config.linux = <ILinuxConfig>{};
      this.config.linux.app = <IRuntimeConfig>runtimeConfig;
    } else {
      throw new Error(`Platform '${os.platform()}' not supported`);
    }
  }

  getRuntimeConfig(mode: InstallMode): IRuntimeConfig {
    if (mode === InstallMode.app) {
      return this.getPlatformConfig<IPlatformConfig>().app;
    } else {
      return this.config.linux.systemd;
    }
  }

  getPlatformConfig<T extends IPlatformConfig>(): T {
    const result = (<any>this.config)[os.platform()];

    if (result === undefined) {
      throw new Error(`Platform '${result}' not configured`);
    }

    return result;
  }

}
