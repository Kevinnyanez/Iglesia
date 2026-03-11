export function getRequiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export function getOptionalEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  return value || undefined;
}
