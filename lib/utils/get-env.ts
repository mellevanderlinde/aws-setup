import * as process from 'node:process'

export function getEnv(name: string): string {
  if (!process.env[name]) {
    throw new Error(`Environment variable ${name} is missing`)
  }
  return process.env[name]
}
