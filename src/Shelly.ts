import chalk from 'chalk';
import shell, { ShellString } from 'shelljs';
import path from 'path';

export namespace shelly {

  export function pwd(): ShellString {
    return shell.pwd();
  }

  export function cdTemp(): string {
    // Go to temp
    return cd(shell.tempdir().toString());
  }

  export function getTempDir(): string {
    return shell.tempdir().toString();
  }

  export function rm(dir: string): ShellString {
    return run(shell.rm('-rf', dir));
  }

  export function cp(source: string, target: string): ShellString {
    run(shell.mkdir('-p', target));
    return run(shell.cp('-R', source, target));
  }

  export function cd(...dir: string[]): string {
    // Go to directory
    const p = path.join(...dir);
    run(shell.cd(p));
    echoGrey(`Working directory: ${p}`);

    return p;
  }

  export function exec(cmd: string): ShellString {
    const result = shell.exec(cmd);
    if (result.code !== 0) {
      echoRed(result.stderr);
      shell.exit(1);
    }

    return result;
  }

  export function run(result: ShellString): ShellString {
    if (result.code !== 0) {
      echoRed(result.stderr);
      shell.exit(1);
    }

    return result;
  }

  export function echoGreen(message: string): void {
    shell.echo(chalk.green(message));
  }

  export function echoRed(message: string): void {
    shell.echo(chalk.red(message));
  }

  export function echoBlue(message: string): void {
    shell.echo(chalk.blue(message));
  }

  export function echoYellow(message: string): void {
    shell.echo(chalk.yellow(message));
  }

  export function echoGrey(message: string): void {
    shell.echo(chalk.grey(message));
  }

}