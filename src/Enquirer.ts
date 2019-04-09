import enquirer from 'enquirer';
import { INoinArguments } from './interfaces/INoinArguments';
import { InstallMode } from './Enumerations';
import { IGitConfig } from './interfaces/IGitConfig';
import { ILinuxService } from './interfaces/ILinuxService';
import * as _ from 'lodash';

export namespace Enquirer {

  export async function getInstallMode(): Promise<InstallMode> {
    const result = await enquirer.prompt<INoinArguments>({
      type: 'select',
      name: 'service',
      choices: [
        {
          name: 'Install as application',
          value: 'app'
        },
        {
          name: 'Install as service',
          value: 'service'
        }
      ],
      message: 'Choose installation mode.'
    });

    if (result.service === 'service') {
      // service
      return InstallMode.service;
    } else {
      // app
      return InstallMode.app;
    }

  }

  export async function getServiceName(defaultValue?: string): Promise<string> {
    const result = await enquirer.prompt<INoinArguments>({
      type: 'input',
      name: 'service',
      required: true,
      message: 'Enter service name.',
      initial: defaultValue
    });

    return result.service;
  }

  export async function getIsProduction(): Promise<boolean> {
    const result = await enquirer.prompt<INoinArguments>({
      type: 'confirm',
      name: 'production',
      message: 'Install and build for production environment?',
      initial: 'y'
    });

    return result.production;
  }

  export async function shouldOverrideTemp(): Promise<boolean> {
    const result = await enquirer.prompt<INoinArguments>({
      type: 'confirm',
      name: 'override',
      message: 'Repository already exists. Override folder content?',
      initial: 'y'
    });

    return result.override;
  }

  export async function getGitConfig(config: Partial<IGitConfig>): Promise<IGitConfig> {

    // github user name
    let result = await enquirer.prompt<INoinArguments>({
      type: 'input',
      name: 'userName',
      message: 'Enter github username?',
      initial: config.userName,
      required: true,
      skip: config.userName !== undefined
    });

    const userName = result.userName;

    // github repository
    result = await enquirer.prompt<INoinArguments>({
      type: 'input',
      name: 'repositoryName',
      message: 'Enter github repository?',
      initial: config.repositoryName,
      required: true,
      skip: config.repositoryName !== undefined
    });

    const repositoryName = result.repositoryName;


    return {
      userName: userName,
      repositoryName: repositoryName,
      url: undefined
    };
  }

  export async function getLinuxService(config: Partial<ILinuxService>): Promise<ILinuxService> {

    const result = _.cloneDeep<ILinuxService>(<any>config);

    // Service description
    let answer = await enquirer.prompt<ILinuxService>({
      type: 'input',
      name: 'Description',
      message: 'Service description',
      initial: config.Description,
      required: true,
      skip: config.Description !== undefined
    });

    result.Description = answer.Description;

    // After
    answer = await enquirer.prompt<ILinuxService>({
      type: 'input',
      name: 'After',
      message: 'Start after',
      initial: config.After,
      required: true,
      skip: config.After !== undefined
    });

    result.After = answer.After;

    // Restart
    answer = await enquirer.prompt<ILinuxService>({
      type: 'input',
      name: 'Restart',
      message: 'Restart mode',
      initial: config.Restart,
      required: true
    });

    result.Restart = answer.Restart;

    // User
    answer = await enquirer.prompt<ILinuxService>({
      type: 'input',
      name: 'User',
      message: 'User',
      initial: config.User,
      required: true
    });

    result.User = answer.User;

    // Group
    answer = await enquirer.prompt<ILinuxService>({
      type: 'input',
      name: 'Group',
      message: 'Group',
      initial: config.Group,
      required: true
    });

    result.Group = answer.Group;

    // WorkingDirectory
    answer = await enquirer.prompt<ILinuxService>({
      type: 'input',
      name: 'WorkingDirectory',
      message: 'WorkingDirectory (Target directory)',
      initial: config.WorkingDirectory,
      required: true,
      skip: config.WorkingDirectory !== undefined
    });

    result.WorkingDirectory = answer.WorkingDirectory;

    // WantedBy
    answer = await enquirer.prompt<ILinuxService>({
      type: 'input',
      name: 'WantedBy',
      message: 'WantedBy',
      initial: config.WantedBy,
      required: true,
      skip: config.WantedBy !== undefined
    });

    result.WantedBy = answer.WantedBy;

    return result;
  }

}
