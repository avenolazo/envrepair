/**
 * Detects if the current process is running in a Continuous Integration (CI) environment.
 * Helps prevent the CLI from hanging when executing interactive prompt loops in automated environments.
 *
 * @returns True if running inside a known CI/CD environment, false otherwise.
 */
export const isCI = (): boolean =>
  process.env.CI === "true" ||
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.GITLAB_CI === "true" ||
  process.env.CIRCLECI === "true" ||
  process.env.JENKINS_URL !== undefined ||
  process.env.BUILDKITE === "true" ||
  process.env.TF_BUILD === "True" ||
  process.env.CODEBUILD_BUILD_ID !== undefined
