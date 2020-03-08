#!/usr/bin/env node

import commander from "commander";
import path from "path";
import { Configurator } from "./Configurator";
import { InstallMode } from "./Enumerations";
import { LinuxService } from "./LinuxService";
import { PackageJsonReader } from "./PackageJsonReader";
import { shelly } from "./Shelly";
import rimraf = require("rimraf");
import { PostCommands } from "./PostCommands";
import { IAppConfig } from "./interfaces/IAppConfig";
import { INoinArguments } from "./interfaces/INoinArguments";
import { Environment } from "./Environment";

export class App extends Configurator {

  readonly noinDir: string;
  readonly rootDir: string;
  repositoryDir: string;

  constructor() {
    super();

    /*
    TODO: sudo ln -s /home/pi/moto/motobox/dist/app.js /usr/bin/motobox
     */

    const args = commander
      .option("-a, --app", "Install as application", false)
      .option("-s, --service <servicename>", "Install as service")
      .option("-p, --production [true/false]", "Build and install packages in production mode")
      .option("-u, --userName <username>", "Github user name")
      .option("-r, --repositoryName <repositoryname>", "Github repository name")
      .option("-t, --target [targetpath]", "Target path to install to.")
      .option("-o, --override [true/false]", "Override tmp and target folders.")
      .parse(process.argv || []);

    this.rootDir = shelly.pwd().toString();
    shelly.silent(true);
    const dir = shelly.exec("npm root -g").toString().split("\n")[0];
    shelly.silent(false);
    this.noinDir = path.join(dir, "dotup-node-app-installer", "dist");

    // Get configuration
    this.loadConfig(this.rootDir, args as Partial<INoinArguments>);
  }

  async install(): Promise<void> {

    // cd into temp folder
    shelly.cdTemp();

    // Get git configuration
    await this.getGitConfig();
    this.repositoryDir = path.join(shelly.getTempDir(), this.config.git.repositoryName);

    // Clone repository. Should override if exists?
    await this.clone();

    // Load config from repository
    this.loadConfig(this.repositoryDir);

    // Load cloned project package json
    const preader = new PackageJsonReader(this.repositoryDir);

    // Get install mode (runtime service or app)
    const mode = await this.getInstallMode();
    const runtimeConfig = this.cm.getPlatformConfig();
    runtimeConfig.bin = preader.getBin(runtimeConfig.targetPath);

    // Install dependencies and Build project
    this.build(this.config.InstallScript, this.config.BuildScript);

    // Copy project to target and install dependencies
    await this.createTarget(preader, mode);

    // Create dotenv file
    const env = new Environment();
    const platformConfig = this.cm.getPlatformConfig();
    env.createFile(
      path.join(platformConfig.targetPath, ".env"),
      this.cm.getRuntimeConfig(mode)
    );

    // Install service
    if (this.cm.canInstallService(mode)) {
      await this.installService(preader, env);
    } else {
      await this.getApp(mode);
    }

    // Clean up
    rimraf.sync(this.repositoryDir);

    // Post commands
    const commands = new PostCommands(this.cm);
    commands.execute();

    // Done
    shelly.echoGreen("Installation completed");
  }

  async clone(): Promise<void> {
    // Clone repository. Should override if exists?
    const canClone = await this.canClone();
    if (canClone) {
      shelly.mkdir(this.repositoryDir);
      // cd into temp
      shelly.cdTemp();

      // Clone repository
      shelly.echoGreen(`Cloning ${this.config.git.url}`);
      shelly.exec(`git clone --depth 1 ${this.config.git.url}`);
    } else {
      shelly.echoRed(`Repository folder '${this.repositoryDir}' already exists`);
      throw new Error("Clone failed");
    }

  }

  build(installScript?: string, buildScript?: string): void {
    // cd into repository
    shelly.cd(this.repositoryDir);

    // Install packages
    shelly.echoGreen("Installing dependencies");
    const installCommand = installScript ? installScript : "npm install";
    shelly.exec(installCommand);

    // Build project
    shelly.echoGreen("Building project");
    const buildCommand = buildScript ? buildScript : "gulp project-build";
    shelly.exec(buildCommand);

  }

  // TODO: Refactor
  async createTarget(preader: PackageJsonReader, mode: InstallMode): Promise<void> {
    const platformConfig = this.cm.getPlatformConfig();

    // copy to target
    shelly.echoGreen("Copy binaries to target");
    let source = path.join(preader.getPathToExec(this.repositoryDir));
    shelly.echoGrey(`Source '${source}'`);
    shelly.echoGrey(`Target '${platformConfig.targetPath}'`);
    shelly.cp(source, platformConfig.targetPath);

    source = path.join(this.repositoryDir, "package.json");
    shelly.cp(source, platformConfig.targetPath);

    // cd into target path
    shelly.cd(platformConfig.targetPath);

    // Install packages
    const isProduction = await this.getIsProduction();
    const installProd = isProduction ? "--production" : "";
    shelly.echoGreen("Installing dependencies");
    shelly.exec(`npm install ${installProd}`);
  }

  async installService(preader: PackageJsonReader, env: Environment): Promise<void> {

    const runtimeConfig = this.cm.getPlatformConfig();
    const serviceConfig = this.cm.getServiceConfig();

    if (serviceConfig === undefined) {
      throw new Error("serviceConfig === undefined");
    }

    const serviceName = serviceConfig.serviceName;
    const targetPath = runtimeConfig.targetPath;

    if (
      serviceConfig.ExecStart === undefined ||
      serviceConfig.WorkingDirectory === undefined
    ) {
      const node = shelly.which("node");
      const bin = preader.getBin(targetPath);
      let exec = `${node}`;
      if (env.filePath !== undefined) {
        exec = `${exec} -r dotenv/config ${bin} dotenv_config_path=${path.join(targetPath, ".env")}`;
      } else {
        exec = `${exec} ${bin}`;
      }
      serviceConfig.ExecStart = exec;
      serviceConfig.WorkingDirectory = preader.getPathToExec(targetPath);
    }

    const service = await this.getLinuxService();
    const template = path.join(this.noinDir, "assets", "template.service");

    if (service === undefined) {
      throw new Error("service === undefined");
    }

    // Generate service file
    const ls = new LinuxService();
    const serviceFile = await ls.generateFile(template, service);

    // Install
    shelly.echoGreen(`Installing linux service '${serviceName}'`);
    ls.install(serviceConfig, serviceFile);
  }
  //   // Create temp and target path
  //   this.mkdir();

  //   // Go to temp
  //   this.shelly(shell.cd(shell.tempdir()));
  //   this.logGrey(`Working directory: ${shell.tempdir()}`);

  //   // Clone repository
  //   this.logGrey(`Cloning ${this.config.git.url}`);
  //   this.exec(`git clone --depth 1 ${this.config.git.url}`);
  //   shell.cd(this.config.git.repositoryName);
  //   this.logGrey(shell.pwd());

  //   // Install packages
  //   this.logGrey('Installing dependencies')
  //   this.exec(`npm install`);

  //   if (!shell.which('gulp')) {
  //     // Install gulp cli
  //   }

  //   // Build project
  //   this.logGrey('Building project')
  //   this.exec(`gulp project-build`);

  //   // Copy to target
  //   // this.logGrey('Installing dependencies')
  //   // const installProd = this.config.production ? '--production' : '';
  //   // this.exec(`npm install ${installProd}`);

  //   // Cleanup

  //   // Install as service?
  //   this.logGreen('Installed');
  // }

}

const app = new App();
app.install();
