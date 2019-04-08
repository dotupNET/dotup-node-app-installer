#!/usr/bin/env node

import commander, { Command, Option } from 'commander';
import path from 'path';
import fs from 'fs';
import shell, { ShellString } from 'shelljs';
import { INoinConfig } from './INoinConfig';
import chalk from 'chalk';

export class App {
  config: INoinConfig;
  currentDir: string;

  constructor() {

    this.currentDir = shell.pwd().toString();

    const args = commander
      .option('-a, --app', 'Install as application', false)
      .option('-s, --service <servicename>', 'Install as service')
      .option('-p, --production', 'Build and install packages in production mode')
      .option('-u, --userName <username>', 'Github user name')
      .option('-r, --repositoryName <repositoryname>', 'Github repository name')
      .option('-t, --target <targetpath>', 'Target path to install to.')
      .parse(process.argv);

    // Get configuration
    this.config = this.getConfig(args);

    const url = `https://github.com/${this.config.git.userName}/${this.config.git.repositoryName}.git`;

    // Create temp and target path
    this.mkdir();
    // Go to temp
    this.shelly(shell.cd(shell.tempdir()));
    this.logGrey(`Working directory: ${shell.tempdir()}`);

    // Clone repository
    this.logGrey(`Cloning ${url}`);
    this.exec(`git clone --depth 1 ${url}`);
    shell.cd(this.config.git.repositoryName);
    this.logGrey(shell.pwd());

    // Install packages
    this.logGrey('Installing dependencies')
    this.exec(`npm install`);

    if (!shell.which('gulp')) {
      // Install gulp cli
    }

    // Build project
    this.logGrey('Building project')
    this.exec(`gulp project-build`);

    // Copy to target
    // this.logGrey('Installing dependencies')
    // const installProd = this.config.production ? '--production' : '';
    // this.exec(`npm install ${installProd}`);

    // Cleanup

    // Install as service?
    this.logGreen('Installed');
  }

  exec(cmd: string) {
    const result = shell.exec(cmd);
    // shell.echo(result.stdout);
    if (result.code !== 0) {
      // shell.echo(`Error: ${cmd}`);
      // shell.echo(result.stderr);
      this.logRed(result.stderr);
      shell.exit(1);
    }
  }

  getConfig(args: Command): INoinConfig {
    const configFile = path.join(this.currentDir, '.noin.json');
    if (fs.existsSync(configFile)) {
      this.logGrey(`Loading configurations from file ${configFile}`);

      const fileConfig = <INoinConfig>JSON.parse((fs.readFileSync(configFile, 'utf8')));
      return fileConfig;
    }

    this.logGrey(`Loading configurations from arguments`);
    return {
      production: args.production,
      service: args.service,
      targetPath: args.targetPath,
      git: {
        repositoryName: args.repositoryName,
        userName: args.userName
      }
    };
  }

  mkdir() {
    // Temp build folder
    const root = path.join(shell.tempdir(), this.config.git.repositoryName);
    this.shelly(shell.mkdir('-p', root));

    // Target folder
    // this.shelly(shell.mkdir('-p', this.config.targetPath));
  }

  shelly(result: ShellString): ShellString {
    // shell.echo(result.stdout);
    if (result.code !== 0) {
      // shell.echo(`Error: ${cmd}`);
      // shell.echo(result.stderr);
      this.logRed(result.stderr);
      shell.exit(1);
    }

    return result;
  }

  logGreen(message: string) {
    shell.echo(chalk.green(message));
  }
  logRed(message: string) {
    shell.echo(chalk.red(message));
  }
  logBlue(message: string) {
    shell.echo(chalk.blue(message));
  }
  logYellow(message: string) {
    shell.echo(chalk.yellow(message));
  }
  logGrey(message: string) {
    shell.echo(chalk.grey(message));
  }

}

const app = new App();
