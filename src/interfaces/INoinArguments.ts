export interface INoinArguments {
  app?: boolean;
  production?: boolean;
  service: string;
  targetPath?: string;
  userName: string;
  repositoryName: string;
  override?: boolean;
}