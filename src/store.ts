import { wuid } from '@jsweb/randkey';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import Database from './module';
import { readJSON, writeJSON } from './utils/files';

export default class Store {
  private TIMESTAMPS: boolean;
  private DATABASE: string;
  private PATH: string;

  public get path(): string {
    return this.PATH;
  }

  constructor(db: Database, name: string) {
    this.TIMESTAMPS = db.timestamps;
    this.DATABASE = db.path;
    this.PATH = join(this.DATABASE, `${name}.json`);

    this.createIfNotExists();
  }

  public async parse() {
    return await readJSON(this.PATH);
  }

  public async truncate() {
    return await writeJSON([], this.PATH);
  }

  public async push(...args: any[]) {
    if (!args.length) {
      return Promise.reject();
    }

    const data = await this.parse();

    args.forEach((item) => {
      item.id = wuid();

      if (this.TIMESTAMPS) {
        item.createdAt = new Date();
        item.updatedAt = null;
      }
    });

    data.push(...args);

    await writeJSON(data, this.PATH);

    return args;
  }

  public async update(value: any, find?: (value: any) => boolean) {
    const { data, index, item } = await this.findToUpdate(value, find);

    if (item) {
      data[index] = { ...item, ...value, id: item.id };
      await writeJSON(data, this.PATH);
      return data[index];
    }

    return Promise.reject(value);
  }

  public async replace(value: any, find?: (value: any) => boolean) {
    const { data, index, item } = await this.findToUpdate(value, find);

    if (item) {
      data[index] = { ...value, id: item.id };
      await writeJSON(data, this.PATH);
      return data[index];
    }

    return Promise.reject(value);
  }

  public async delete(id: string, find?: (value: any) => boolean) {
    const { data, index, item } = await this.findToUpdate({ id }, find);

    if (item) {
      data.splice(index, 1);
      return writeJSON(data, this.PATH);
    }

    return Promise.reject(id);
  }

  public async find(find: (value: any) => boolean) {
    const data = await this.parse();

    return data.find(find);
  }

  public async filter(filter: (value: any) => boolean) {
    const data = await this.parse();

    return data.filter(filter);
  }

  public async filterUpdate(value: any, filter: (value: any) => boolean) {
    if (value.id) {
      return this.update(value);
    }

    const { data, items } = await this.filterToUpdate(value, filter);

    items.forEach((item: any) => {
      const index = data.findIndex((obj: any) => obj.id === item.id);

      if (this.TIMESTAMPS) {
        const now = new Date();

        item.createdAt = item.createdAt || now;
        item.updatedAt = now;
      }

      data[index] = { ...item, ...value, id: item.id };
    });

    await writeJSON(data, this.PATH);
    return items;
  }

  public async filterReplace(value: any, filter: (value: any) => boolean) {
    if (value.id) {
      return this.replace(value);
    }

    const { data, items } = await this.filterToUpdate(value, filter);

    items.forEach((item: any) => {
      const index = data.findIndex((obj: any) => obj.id === item.id);

      if (this.TIMESTAMPS) {
        const now = new Date();

        item.createdAt = item.createdAt || now;
        item.updatedAt = now;
      }

      data[index] = { ...value, id: item.id };
    });

    await writeJSON(data, this.PATH);
    return items;
  }

  public async filterDelete(filter: (value: any) => boolean) {
    const data = await this.parse();
    const items = data.filter(filter);

    items.forEach((item) => {
      const index = data.findIndex((obj) => obj.id === item.id);

      data.splice(index, 1);
    });

    await writeJSON(data, this.PATH);
    return items.length;
  }

  // --- Privates --- //

  private createIfNotExists() {
    return existsSync(this.PATH) || writeFileSync(this.PATH, '[]', 'utf8');
  }

  private async findToUpdate(value: any, find?: (value: any) => boolean) {
    const fn = value.id ? (obj: any) => obj.id === value.id : find;

    if (!fn) {
      return Promise.reject(value);
    }

    const data = await this.parse();
    const index = data.findIndex(fn);
    const item = data[index];

    if (item && this.TIMESTAMPS) {
      item.creaatedAt = item.creaatedAt || new Date();
      item.updatedAt = new Date();
    }

    return { data, index, item };
  }

  private async filterToUpdate(value: any, filter: (value: any) => boolean) {
    if (value.id) {
      return this.update(value);
    }

    if (!filter) {
      return Promise.reject(value);
    }

    const data = await this.parse();
    const items = data.filter(filter);

    return { data, items };
  }
}
