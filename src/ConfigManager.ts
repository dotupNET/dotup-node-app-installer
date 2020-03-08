import fs from "fs";
import os from "os";
import path from "path";
import { InstallMode } from "./Enumerations";
import { ILinuxConfig } from "./interfaces/ILinuxConfig";
import { ILinuxServiceConfig } from "./interfaces/ILinuxServiceConfig";
import { INoinArguments } from "./interfaces/INoinArguments";
import { INoinConfig } from "./interfaces/INoinConfig";
import { IPlatformConfig } from "./interfaces/IPlatformConfig";
import { IAppConfig } from "./interfaces/IAppConfig";
import { IWindowsConfig } from "./interfaces/IWindowsConfig";
import { shelly } from "./Shelly";
import { ObjectTools } from "@dotup/dotup-ts-types";

export class ConfigManager {

  config: INoinConfig;

  loadConfig(dir: string, args?: Partial<INoinArguments>): INoinConfig | undefined {
    const configFile = path.join(dir, ".noin.json");

    if (fs.existsSync(configFile)) {
      // Config from file
      shelly.echoGrey(`Loading configuration from ${configFile}`);
      const fileConfig = JSON.parse((fs.readFileSync(configFile, "utf8"))) as INoinConfig;
      this.config = fileConfig;

    } else if (args === undefined) {
      // No configuration
      shelly.echoYellow("No configuration provided");
      args = {} as INoinConfig;

    } else {
      // Config from args
      shelly.echoGrey("Loading configuration from arguments");
      this.config = {
        production: args.production || true,
        override: args.override || true,
        git: {
          repositoryName: args.repositoryName || "",
          userName: args.userName || "",
          url: ""
        },
        linux: os.platform() === "linux" ? {} as ILinuxConfig : undefined,
        win32: os.platform() === "win32" ? {} as IWindowsConfig : undefined
      };

      if (args.app !== undefined && args.targetPath) {
        this.setPlatformConfig({ targetPath: args.targetPath });
      } else {
        if (args.service !== undefined && args.targetPath) {
          this.config.linux!.systemd = {} as ILinuxServiceConfig;
          this.config.linux!.systemd.WorkingDirectory = args.targetPath;
        }
      }

      return this.config;
    }
  }

  getInstallMode(): InstallMode | undefined {
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

  getServiceConfig(): ILinuxServiceConfig | undefined {
    if (this.config.linux === undefined) { return undefined; }
    // this.config.linux.systemd.WorkingDirectory = this.config.linux.targetPath;
    return this.config.linux.systemd;
  }

  canInstallService(mode: InstallMode): boolean {
    if (mode === InstallMode.service) {
      if (os.platform() === "linux") {
        return true;
      } else {
        shelly.echoYellow(`Service installation not support on platform '${os.platform()}'`);
      }
    }

    return false;
  }

  setPlatformConfig(config: Partial<IPlatformConfig>): void {

    if (os.platform() === "win32") {
      if (this.config.win32 === undefined) {
        this.config.win32 = {} as IWindowsConfig;
      }
      ObjectTools.CopyEachSource(this.config.win32, config);
    } else if (os.platform() === "linux") {
      if (this.config.linux === undefined) {
        this.config.linux = {} as ILinuxConfig;
      }
      ObjectTools.CopyEachSource(this.config.linux, config);
    } else {
      throw new Error(`Platform '${os.platform()}' not supported`);
    }
  }

  getRuntimeConfig(mode: InstallMode | undefined): IAppConfig | undefined {
    if (mode === InstallMode.app) {
      return this.getPlatformConfig<IPlatformConfig>().app;
    } else {
      return this.config.linux?.systemd;
    }
  }

  getPlatformConfig<T extends IPlatformConfig>(): T {
    const result = (this.config as any)[os.platform()];

    if (result === undefined) {
      shelly.echoYellow(JSON.stringify(this.config, undefined, 2));
      throw new Error(`Platform '${result}' not configured`);
    }

    return result;
  }

}
