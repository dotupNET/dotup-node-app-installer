import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { ConfigManager } from './ConfigManager';
import { Enquirer } from './Enquirer';
import { InstallMode } from './Enumerations';
import { IGitConfig } from './interfaces/IGitConfig';
import { ILinuxConfig } from './interfaces/ILinuxConfig';
import { ILinuxService } from './interfaces/ILinuxService';
import { ILinuxServiceConfig } from './interfaces/ILinuxServiceConfig';
import { INoinConfig } from './interfaces/INoinConfig';
import { shelly } from './Shelly';
import { INoinArguments } from './interfaces/INoinArguments';

export class Configurator {

  cm: ConfigManager;
  get config(): INoinConfig {
    return this.cm.config;
  }

  loadConfig(dir: string, args?: Partial<INoinArguments>) {
    this.cm = new ConfigManager();
    this.cm.loadConfig(dir, args);
  }

  async getInstallMode(): Promise<InstallMode> {
    const runtime = this.cm.getPlatformConfig<ILinuxConfig>();

    let mode = this.cm.getInstallMode();

    if (mode === undefined) {
      mode = await Enquirer.getInstallMode();
    }

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
      this.cm.setAppConfig(workingDirectory);
    }

    return mode;
  }

  async getIsProduction(): Promise<boolean> {
    const result = this.cm.getIsProduction();
    if (result === undefined) {
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
    const config = this.cm.getServiceConfig();
    this.config.linux.systemd = await Enquirer.getLinuxService(config);

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

}
