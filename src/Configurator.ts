import fs from 'fs';
import path from 'path';
import { Enquirer } from './Enquirer';
import { InstallMode } from './Enumerations';
import { INoinArguments } from './INoinArguments';
import { IGitConfig, INoinConfig } from './INoinConfig';
import { shelly } from './Shelly';
import { ILinuxService } from './ILinuxService';
import rimraf from 'rimraf';

export class Configurator {

  config: INoinConfig;

  loadConfig(dir: string, args?: Partial<INoinArguments>): INoinConfig {
    const configFile = path.join(dir, '.noin.json');
    if (fs.existsSync(configFile)) {
      shelly.echoGrey(`Loading configuration from file ${configFile}`);

      const fileConfig = <INoinConfig>JSON.parse((fs.readFileSync(configFile, 'utf8')));
      this.config = fileConfig;
    } else if (args === undefined) {
      shelly.echoYellow(`No configuration provided`);
      args = <INoinConfig>{};
    } else {
      shelly.echoGrey(`Loading configuration from arguments`);
      this.config = {
        app: args.app,
        production: args.production,
        service: args.service,
        targetPath: args.targetPath,
        override: args.override,
        systemd: <any>{},
        git: {
          repositoryName: args.repositoryName,
          userName: args.userName,
          url: ''
        }
      };
    }

    return this.config;
  }

  async getInstallMode(): Promise<InstallMode> {
    if (this.config.app === true) {
      return InstallMode.app;
    }

    if (this.config.service !== undefined) {
      return InstallMode.service;
    }

    const mode = await Enquirer.getInstallMode();

    if (mode === InstallMode.service) {
      // service
      this.config.app = false;

      if (this.config.service === undefined) {
        const name = await Enquirer.getServiceName();
        this.config.service = name;
      }
    } else {
      // app
      this.config.app = true;
      this.config.service = undefined;
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
    this.config.systemd = await Enquirer.getLinuxService(this.config.systemd);

    return this.config.systemd;
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

}
