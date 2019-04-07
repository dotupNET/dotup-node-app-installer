export interface INoinConfig {
  production: boolean;
  service: string,
  targetPath: string;
  git: IGitConfig;
}

export interface IGitConfig {
  userName: string;
  repositoryName: string
}