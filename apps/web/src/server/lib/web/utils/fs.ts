import fs from 'fs/promises';
import path from 'path';

export async function getBrowserJavascriptBundle() {
  const assetsDir = path.resolve(process.cwd(), 'out', 'www');
  const files = await fs.readdir(assetsDir, {
    encoding: 'utf-8',
    recursive: true,
    withFileTypes: true
  });
  const file = files.find(
    (f) => f.isFile() && f.name.startsWith('browser') && f.name.endsWith('.js')
  );
  if (file) {
    return path.join('/www', file.name);
  }

  return null;
}

export async function getBrowserCssSheet() {
  const assetsDir = path.resolve(process.cwd(), 'out', 'www');
  const files = await fs.readdir(assetsDir, {
    encoding: 'utf-8',
    recursive: true,
    withFileTypes: true
  });
  const file = files.find(
    (f) => f.isFile() && f.name.startsWith('browser') && f.name.endsWith('.css')
  );
  if (file) {
    return path.join('/www', file.name);
  }

  return null;
}
