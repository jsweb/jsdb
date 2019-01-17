import { join } from 'path';
import { mkdir, rm } from 'shelljs';
import Store from './store';

export default class Database {
  private PATH: string;
  private TIMESTAMPS: boolean = false;
  private STORES: { [name: string]: Store } = {};

  public get path(): string {
    return this.PATH;
  }

  public get timestamps(): boolean {
    return this.TIMESTAMPS;
  }

  public set timestamps(auto: boolean) {
    this.TIMESTAMPS = auto;
  }

  constructor(...args: string[]) {
    this.PATH = join(process.cwd(), ...args);
    mkdir('-p', this.PATH);
  }

  public store(name: string) {
    this.STORES[name] = this.STORES[name] || new Store(this, name);
    return this.STORES[name];
  }

  public drop(name: string) {
    const store = this.STORES[name];
    const path = join(this.PATH, `${name}.json`);

    if (store) {
      delete this.STORES[name];
    }

    rm(path);
  }
}
