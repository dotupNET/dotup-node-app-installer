import fs from 'fs';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';
import { Enquirer } from './Enquirer';
import { InstallMode } from './Enumerations';
import { IGitConfig } from './interfaces/IGitConfig';
import { ILinuxService } from './interfaces/ILinuxService';
import { ILinuxServiceConfig } from './interfaces/ILinuxServiceConfig';
import { INoinArguments } from './interfaces/INoinArguments';
import { INoinConfig } from './interfaces/INoinConfig';
import { IRuntimeConfig } from './interfaces/IRuntimeConfig';
import { shelly } from './Shelly';
import { IWindowsConfig } from './interfaces/IWindowsConfig';
import { ILinuxConfig } from './interfaces/ILinuxConfig';
import { ITypedProperty } from 'dotup-ts-types';
import { IPlatformConfig } from './interfaces/IPlatformConfig';

export class Configurator {

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
        postCommands: [],
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

  async getInstallMode(): Promise<InstallMode> {
    const runtime = this.getPlatformConfig<ILinuxConfig>();
    if (runtime.app !== undefined && runtime.systemd === undefined) {
      return InstallMode.app;
    }

    if (runtime.systemd !== undefined && runtime.app === undefined) {
      return InstallMode.service;
    }

    const mode = await Enquirer.getInstallMode();

    if (mode === InstallMode.service) {
      // service
      if (runtime.systemd === undefined) {
        const name = await Enquirer.getServiceName();
        runtime.systemd = <ILinuxServiceConfig>{};
        runtime.systemd.serviceName = name;
      }
    } else {
      // app
      const workingDirectory = await Enquirer.getWorkingDirectory();
      this.setAppConfig(workingDirectory);
    }

    return mode;
  }

  async getIsProduction(): Promise<boolean> {
    if (this.config.production === undefined) {
      this.config.production = await Enquirer.getIsProduction();
    }

    return this.config.production;
  }

  async getGitConfig(): Promise<IGitConfig> {
    if (this.config.git === undefined || this.config.git.repositoryName === undefined || this.config.git.userName === undefined) {
      this.config.git = await Enquirer.getGitConfig(this.config.git);
    }

    this.config.git.url = `https://github.com/${this.config.git.userName}/${this.config.git.repositoryName}.git`;

    return this.config.git;
  }

  async getLinuxService(): Promise<ILinuxService> {
    const config = this.getServiceConfig();
    this.config.linux.systemd = await Enquirer.getLinuxService(config);

    return this.config.linux.systemd;
  }

  getServiceConfig(): ILinuxServiceConfig {
    if (this.config.linux === undefined) { return undefined; }

    return this.config.linux.systemd;
  }

  async canClone(): Promise<boolean> {
    const target = path.join(shelly.getTempDir(), this.config.git.repositoryName);
    if (fs.existsSync(target)) {
      const override = await Enquirer.shouldOverrideTemp();
      if (override) {
        rimraf.sync(target);
        return true;
      }
    } else {
      return true;
    }

    return false;
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

  private setAppConfig(targetPath: string): void {
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
