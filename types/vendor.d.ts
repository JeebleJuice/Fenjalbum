declare module "busboy" {
  // The package is intentionally shimmed because this version does not ship declarations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Busboy: any;
  export default Busboy;
}

declare module "bcryptjs" {
  export function hash(password: string, saltRounds: number): Promise<string>;
  export function compare(password: string, hash: string): Promise<boolean>;
}
