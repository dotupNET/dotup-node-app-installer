#!/usr/bin/env node

import commander from 'commander';
import path from 'path';
import { Configurator } from './Configurator';
import { InstallMode } from './Enumerations';
import { LinuxService } from './LinuxService';
import { PackageJsonReader } from './PackageJsonReader';
import { shelly } from './Shelly';
import rimraf = require('rimraf');

export class App extends Configurator {

  readonly rootDir: string;
  repositoryDir: string;

  constructor() {
    super();

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

    // Get configuration
    this.loadConfig(this.rootDir, <any>args);
  }

  async install(): Promise<void> {

    // Get git configuration
    await this.getGitConfig();
    this.repositoryDir = path.join(shelly.getTempDir(), this.config.git.repositoryName);

    // Clone repository. Should override if exists?
    this.clone();

    // Load config from repository
    this.loadConfig(this.repositoryDir);

    // Install dependencies and Build project
    this.build();

    // Load cloned project package json
    const preader = new PackageJsonReader(this.repositoryDir);

    // Copy project to target and install dependencies
    this.createTarget(preader);

    // Clean up
    rimraf.sync(this.repositoryDir);

    // Install service
    // const mode = await this.getInstallMode();
    // if (mode === InstallMode.service) {
    //   await this.installService(preader);
    // }

  }


  async clone(): Promise<void> {
    // Clone repository. Should override if exists?
    const canClone = await this.canClone();
    if (canClone) {
      // cd into temp
      shelly.cdTemp();

      // Clone repository
      shelly.echoGrey(`Cloning ${this.config.git.url}`);
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
    shelly.echoGrey('Installing dependencies');
    shelly.exec(`npm install`);

    // Build project
    shelly.echoGrey('Building project');
    shelly.exec(`gulp project-build`);
  }

  async createTarget(preader: PackageJsonReader): Promise<void> {
    // copy to target
    const target = preader.getPathToExec(this.config.targetPath);

    let source = preader.getPathToExec(this.repositoryDir);
    shelly.cp(source, target);

    source = path.join(this.repositoryDir, 'package.json');
    shelly.cp(source, target);

    // cd into target path
    shelly.cd(this.config.targetPath);

    // Install packages
    const isProduction = await this.getIsProduction();
    const installProd = isProduction ? '--production' : '';
    shelly.echoGrey('Installing dependencies');
    shelly.exec(`npm install ${installProd}`);
  }

  async installService(preader: PackageJsonReader): Promise<void> {

    this.config.systemd.ExecStart = preader.getBin(this.config.targetPath);
    this.config.systemd.WorkingDirectory = preader.getPathToExec(this.config.targetPath);

    const service = await this.getLinuxService();
    const t = path.join(this.rootDir, 'dist', 'assets', 'template.service');

    const ls = new LinuxService();
    const serviceFile = await ls.generateFile(t, service);

    console.log(serviceFile);

    shelly.exec('sudo systemctl daemon-reload');
    shelly.exec('sudo systemctl enable motobox');
    shelly.exec('sudo systemctl restart motobox');

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
