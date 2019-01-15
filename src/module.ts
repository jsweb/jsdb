import { join } from 'path';
import { mkdir, rm } from 'shelljs';
import DataBase from './database';

export default class JSDB {
  public timestamps: boolean = false;
  public base: string;
  private stores: any = {};

  constructor(...args: string[]) {
    this.base = join(process.cwd(), ...args);
    mkdir('-p', this.base);
  }

  public setTimestamps(auto: boolean) {
    this.timestamps = auto;
  }

  public store(name: string) {
    this.stores[name] = this.stores[name] || new DataBase(this, name);
    return this.stores[name];
  }

  public drop(name: string) {
    rm(this.stores[name].path);
    delete this.stores[name];
  }
}
