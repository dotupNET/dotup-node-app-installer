import enquirer from "enquirer";
import { InstallMode } from "./Enumerations";
import { IGitConfig } from "./interfaces/IGitConfig";
import { ILinuxServiceConfig } from "./interfaces/ILinuxServiceConfig";
import { INoinArguments } from "./interfaces/INoinArguments";
import { IAppConfig } from "./interfaces/IAppConfig";
import { IPlatformConfig } from "./interfaces/IPlatformConfig";
import { ObjectTools } from "@dotup/dotup-ts-types";

export namespace Enquirer {

  export async function getInstallMode(): Promise<InstallMode> {
    const result = await enquirer.prompt<INoinArguments>({
      type: "select",
      name: "service",
      choices: [
        {
          name: "Install as application",
          value: "app"
        },
        {
          name: "Install as service",
          value: "service"
        }
      ],
      message: "Choose installation mode."
    });

    if (result.service === "Install as service") {
      // service
      return InstallMode.service;
    } else {
      // app
      return InstallMode.app;
    }

  }

  export async function getTargetPath(defaultValue?: string): Promise<string> {
    const answer = await enquirer.prompt<IPlatformConfig>({
      type: "input",
      name: "targetPath",
      message: "Target directory",
      initial: defaultValue === undefined ? "" : defaultValue,
      required: true,
      skip: defaultValue !== undefined
    });

    return answer.targetPath;
  }

  export async function getIsProduction(): Promise<boolean> {
    const result = await enquirer.prompt<INoinArguments>({
      type: "confirm",
      name: "production",
      message: "Install and build for production environment?",
      initial: "y"
    });

    return result.production || true;
  }

  export async function shouldOverrideTemp(): Promise<boolean> {
    const result = await enquirer.prompt<INoinArguments>({
      type: "confirm",
      name: "override",
      message: "Repository already exists. Override folder content?",
      initial: "y"
    });

    return result.override || false;
  }

  export async function getGitConfig(config: Partial<IGitConfig>): Promise<IGitConfig> {

    // github user name
    let result = await enquirer.prompt<INoinArguments>({
      type: "input",
      name: "userName",
      message: "Enter github username?",
      initial: config.userName,
      required: true,
      skip: config.userName !== undefined
    });

    const userName = result.userName;

    // github repository
    result = await enquirer.prompt<INoinArguments>({
      type: "input",
      name: "repositoryName",
      message: "Enter github repository?",
      initial: config.repositoryName,
      required: true,
      skip: config.repositoryName !== undefined
    });

    const repositoryName = result.repositoryName;


    return {
      userName: userName,
      repositoryName: repositoryName,
      url: ""
    };
  }

  export async function getApp(config: Partial<IAppConfig>): Promise<IAppConfig> {

    const result = ObjectTools.DeepCopy<IAppConfig>(config as IAppConfig);
    // const result = _.cloneDeep<IAppConfig>(<any>config);

    // User
    let answer = await enquirer.prompt<IAppConfig>({
      type: "input",
      name: "User",
      message: "User",
      initial: config.User,
      required: true
    });

    result.User = answer.User;

    // Group
    answer = await enquirer.prompt<IAppConfig>({
      type: "input",
      name: "Group",
      message: "Group",
      initial: config.Group,
      required: true
    });

    result.Group = answer.Group;

    return result;
  }

  export async function getLinuxService(config: Partial<ILinuxServiceConfig>): Promise<ILinuxServiceConfig> {

    const result = ObjectTools.DeepCopy<ILinuxServiceConfig>(config as ILinuxServiceConfig);
    // const result = _.cloneDeep<ILinuxServiceConfig>(<any>config);

    // Service name
    let answer = await enquirer.prompt<ILinuxServiceConfig>({
      type: "input",
      name: "serviceName",
      message: "Service name",
      initial: config.serviceName === undefined ? "" : config.serviceName,
      required: true,
      skip: config.serviceName !== undefined
    });

    result.serviceName = answer.serviceName;

    // Service description
    answer = await enquirer.prompt<ILinuxServiceConfig>({
      type: "input",
      name: "Description",
      message: "Service description",
      initial: config.Description,
      required: true,
      skip: config.Description !== undefined
    });

    result.Description = answer.Description;

    // After
    answer = await enquirer.prompt<ILinuxServiceConfig>({
      type: "input",
      name: "After",
      message: "Start after",
      initial: config.After,
      required: true,
      skip: config.After !== undefined
    });

    result.After = answer.After;

    // Restart
    answer = await enquirer.prompt<ILinuxServiceConfig>({
      type: "input",
      name: "Restart",
      message: "Restart mode",
      initial: config.Restart,
      required: true
    });

    result.Restart = answer.Restart;

    // User and Group
    const app = await getApp(config);
    result.User = app.User;
    result.Group = app.Group;

    // WorkingDirectory
    answer = await enquirer.prompt<ILinuxServiceConfig>({
      type: "input",
      name: "WorkingDirectory",
      message: "WorkingDirectory (Target directory)",
      initial: config.WorkingDirectory,
      required: true,
      skip: config.WorkingDirectory !== undefined
    });

    result.WorkingDirectory = answer.WorkingDirectory;

    // WantedBy
    answer = await enquirer.prompt<ILinuxServiceConfig>({
      type: "input",
      name: "WantedBy",
      message: "WantedBy",
      initial: config.WantedBy,
      required: true,
      skip: config.WantedBy !== undefined
    });

    result.WantedBy = answer.WantedBy;

    return result;
  }

}
