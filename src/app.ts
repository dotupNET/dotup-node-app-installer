#!/usr/bin/env node

import commander from 'commander';
import path from 'path';
import { Configurator } from './Configurator';
import { InstallMode } from './Enumerations';
import { LinuxService } from './LinuxService';
import { PackageJsonReader } from './PackageJsonReader';
import { shelly } from './Shelly';
import rimraf = require('rimraf');
import { PostCommands } from './PostCommands';

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
      .option('-a, --app', 'Install as application', false)
      .option('-s, --service <servicename>', 'Install as service')
      .option('-p, --production [true/false]', 'Build and install packages in production mode')
      .option('-u, --userName <username>', 'Github user name')
      .option('-r, --repositoryName <repositoryname>', 'Github repository name')
      .option('-t, --target [targetpath]', 'Target path to install to.')
      .option('-o, --override [true/false]', 'Override tmp and target folders.')
      .parse(process.argv);

    this.rootDir = shelly.pwd().toString();
    const dir = shelly.exec('npm root -g').toString().split('\n')[0];
    this.noinDir = path.join(dir, 'dotup-node-app-installer', 'dist');

    // Get configuration
    this.loadConfig(this.rootDir, <any>args);

    const commands = new PostCommands(this.config);
    commands.execute();
  }

  async install(): Promise<void> {

    // Get git configuration
    await this.getGitConfig();
    this.repositoryDir = path.join(shelly.getTempDir(), this.config.git.repositoryName);

    // Clone repository. Should override if exists?
    await this.clone();

    // Load config from repository
    this.loadConfig(this.repositoryDir);

    // Install dependencies and Build project
    this.build();

    // Load cloned project package json
    const preader = new PackageJsonReader(this.repositoryDir);

    // Copy project to target and install dependencies
    await this.createTarget(preader);

    // Clean up
    rimraf.sync(this.repositoryDir);

    // Install service
    const mode = await this.getInstallMode();
    if (mode === InstallMode.service) {
      await this.installService(preader);
    }

    // Post commands
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
      throw new Error('Clone failed');
    }

  }

  build(): void {
    // cd into repository
    shelly.cd(this.repositoryDir);

    // Install packages
    shelly.echoGreen('Installing dependencies');
    shelly.exec(`npm install`);

    // Build project
    shelly.echoGreen('Building project');
    shelly.exec(`gulp project-build`);
  }

  async createTarget(preader: PackageJsonReader): Promise<void> {
    // copy to target

    shelly.echoGreen('Copy binaries to target');
    let source = path.join(preader.getPathToExec(this.repositoryDir));
    shelly.echoGrey(`Source '${source}'`);
    shelly.echoGrey(`Target '${this.config.targetPath}'`);
    shelly.cp(source, this.config.targetPath);

    source = path.join(this.repositoryDir, 'package.json');
    shelly.cp(source, this.config.targetPath);

    // cd into target path
    shelly.cd(this.config.targetPath);

    // Install packages
    const isProduction = await this.getIsProduction();
    const installProd = isProduction ? '--production' : '';
    shelly.echoGreen('Installing dependencies');
    shelly.exec(`npm install ${installProd}`);
  }

  async installService(preader: PackageJsonReader): Promise<void> {

    if (
      this.config.systemd.ExecStart === undefined ||
      this.config.systemd.WorkingDirectory === undefined
    ) {
      this.config.systemd.ExecStart = preader.getBin(this.config.targetPath);
      this.config.systemd.WorkingDirectory = preader.getPathToExec(this.config.targetPath);
    }

    const service = await this.getLinuxService();
    const template = path.join(this.noinDir, 'assets', 'template.service');

    // Generate service file
    const ls = new LinuxService();
    const serviceFile = await ls.generateFile(template, service);

    // Install
    shelly.echoGreen(`Installing linux service '${this.config.service}'`);
    ls.install(this.config, serviceFile);

    shelly.echoGreen('Installation completed');

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
