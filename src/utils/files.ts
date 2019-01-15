import { readFile, writeFile } from 'fs';
import { join } from 'path';

export function read(...args: string[]): Promise<string> {
  const path = join(...args);

  return new Promise((done, fail) => {
    readFile(path, 'utf8', (err, data) => {
      return err ? fail() : done(data);
    });
  });
}

export function write(data: string, ...args: string[]) {
  const path = join(...args);

  return new Promise((done, fail) => {
    writeFile(path, data, (err) => {
      return err ? fail() : done();
    });
  });
}

export async function readJSON(...args: string[]): Promise<any[]> {
  const file = await read(...args);

  return file ? JSON.parse(file) : [];
}

export async function writeJSON(data: any, ...args: string[]) {
  const env = process.env.NODE_ENV || 'development';
  const indent = env === 'production' ? 0 : 2;
  const result = JSON.stringify(data, null, indent);

  return await write(result, ...args);
}
