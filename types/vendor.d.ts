declare module "busboy" {
  const Busboy: any;
  export default Busboy;
}

declare module "bcryptjs" {
  export function hash(password: string, saltRounds: number): Promise<string>;
  export function compare(password: string, hash: string): Promise<boolean>;
}
