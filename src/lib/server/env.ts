export function env(name: string, required = true): string {
  const v = process.env[name];
  if (!v && required) throw new Error(`Missing environment variable ${name}`);
  return v ?? "";
}
