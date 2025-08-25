export function getEnv(name: string): string {
  // eslint-disable-next-line node/prefer-global/process
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is missing`);
  }
  return value;
}
