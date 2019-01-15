import { wuid } from '@jsweb/randkey';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import JSDB from './module';
import { readJSON, writeJSON } from './utils/files';

export default class DataBase {
  public base: string;
  public name: string;
  public file: string;
  public path: string;
  public timestamps: boolean;

  constructor(jsdb: JSDB, name: string) {
    this.timestamps = jsdb.timestamps;
    this.base = jsdb.base;
    this.name = name;

    this.file = `${name}.json`;
    this.path = join(this.base, this.file);

    this.createIfNotExists();
  }

  public async parse() {
    return await readJSON(this.path);
  }

  public async truncate() {
    return await writeJSON([], this.path);
  }

  public async push(...args: any[]) {
    if (!args.length) {
      return Promise.reject();
    }

    const data = await this.parse();

    args.forEach((item) => {
      item.id = wuid();

      if (this.timestamps) {
        item.createdAt = new Date();
        item.updatedAt = null;
      }
    });

    data.push(...args);

    await writeJSON(data, this.path);

    return args;
  }

  public async update(value: any, find?: (value: any) => boolean) {
    const { data, index, item } = await this.findToUpdate(value, find);

    if (item) {
      data[index] = { ...item, ...value, id: item.id };
      await writeJSON(data, this.path);
      return data[index];
    }

    return Promise.reject(value);
  }

  public async replace(value: any, find?: (value: any) => boolean) {
    const { data, index, item } = await this.findToUpdate(value, find);

    if (item) {
      data[index] = { ...value, id: item.id };
      await writeJSON(data, this.path);
      return data[index];
    }

    return Promise.reject(value);
  }

  public async delete(id: string, find?: (value: any) => boolean) {
    const { data, index, item } = await this.findToUpdate({ id }, find);

    if (item) {
      data.splice(index, 1);
      return writeJSON(data, this.path);
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

      if (this.timestamps) {
        item.createdAt = item.createdAt || new Date();
        item.updatedAt = new Date();
      }

      data[index] = { ...item, ...value, id: item.id };
    });

    await writeJSON(data, this.path);
    return items.length;
  }

  public async filterReplace(value: any, filter: (value: any) => boolean) {
    if (value.id) {
      return this.replace(value);
    }

    const { data, items } = await this.filterToUpdate(value, filter);

    items.forEach((item: any) => {
      const index = data.findIndex((obj: any) => obj.id === item.id);

      if (this.timestamps) {
        item.createdAt = item.createdAt || new Date();
        item.updatedAt = new Date();
      }

      data[index] = { ...value, id: item.id };
    });

    await writeJSON(data, this.path);
    return items.length;
  }

  public async filterDelete(filter: (value: any) => boolean) {
    const data = await this.parse();
    const items = data.filter(filter);

    items.forEach((item) => {
      const index = data.findIndex((obj) => obj.id === item.id);

      data.splice(index, 1);
    });

    return writeJSON(data, this.path);
  }

  // --- Privates ---

  private createIfNotExists() {
    const ok = existsSync(this.path);

    if (!ok) {
      writeFileSync(this.path, '[]', 'utf8');
    }
  }

  private async findToUpdate(value: any, find?: (value: any) => boolean) {
    const fn = value.id ? (obj: any) => obj.id === value.id : find;

    if (!fn) {
      return Promise.reject(value);
    }

    const data = await this.parse();
    const index = data.findIndex(fn);
    const item = data[index];

    if (item && this.timestamps) {
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
