import { mkdir, exists, readFile, writeFile } from 'fs/promises';
import path from 'path';

import handlebars from 'handlebars';

import { createLogger } from '@pokemon/logger';

const logger = createLogger('pokemon:scripts:scaffold');

export default async function scaffold(type, name) {
  const packageRoot = path.resolve(process.cwd(), '..', '..');
  switch (type) {
    case 'lib': {
      logger.info('Scaffolding library %s...', name);

      logger.info('Creating directory...');

      const dirpath = path.resolve(path.join(packageRoot, 'packages', name));

      if (await exists(dirpath)) {
        throw new Error(`Directory ${dirpath} already exists`);
      }

      await mkdir(dirpath, { recursive: true });

      logger.info('Writing files...');

      const TSCONFIG_TEMPLATE_FILE = await readFile(
        path.resolve(process.cwd(), 'templates', 'lib', 'tsconfig.json.hbs'),
        { encoding: 'utf-8' }
      );

      const TSCONFIG = handlebars.compile(TSCONFIG_TEMPLATE_FILE)({ name });

      const PACKAGE_JSON_TEMPLATE_FILE = await readFile(
        path.resolve(process.cwd(), 'templates', 'lib', 'package.json.hbs'),
        { encoding: 'utf-8' }
      );

      const PACKAGE_JSON = handlebars.compile(PACKAGE_JSON_TEMPLATE_FILE)({
        name
      });

      const BUILD_TEMPLATE_FILE = await readFile(
        path.resolve(process.cwd(), 'templates', 'lib', 'build.ts.hbs'),
        { encoding: 'utf-8' }
      );

      const BUILD = handlebars.compile(BUILD_TEMPLATE_FILE)({ name });

      await writeFile(path.join(dirpath, 'tsconfig.json'), TSCONFIG, {
        encoding: 'utf-8'
      });
      await writeFile(path.join(dirpath, 'package.json'), PACKAGE_JSON, {
        encoding: 'utf-8'
      });
      await writeFile(path.join(dirpath, 'build.ts'), BUILD, {
        encoding: 'utf-8'
      });

      await mkdir(path.join(dirpath, 'lib'));
      await mkdir(path.join(dirpath, 'lib', '__tests__'));

      const LIB_INDEX_TEMPLATE_FILE = await readFile(
        path.resolve(process.cwd(), 'templates', 'lib', 'lib--index.ts.hbs'),
        { encoding: 'utf-8' }
      );

      const LIB_INDEX = handlebars.compile(LIB_INDEX_TEMPLATE_FILE)({ name });

      await writeFile(path.join(dirpath, 'lib', 'index.ts'), LIB_INDEX, {
        encoding: 'utf-8'
      });

      const LIB_TEST_TEMPLATE_FILE = await readFile(
        path.resolve(
          process.cwd(),
          'templates',
          'lib',
          'lib--tests--index.test.ts.hbs'
        ),
        { encoding: 'utf-8' }
      );

      const LIB_TEST = handlebars.compile(LIB_TEST_TEMPLATE_FILE)({ name });

      await writeFile(
        path.join(dirpath, 'lib', '__tests__', 'index.test.ts'),
        LIB_TEST,
        { encoding: 'utf-8' }
      );

      logger.info('Scaffolded library %s', name);

      break;
    }
    case 'rs-app': {
      logger.warn('rs-app scaffolding not yet implemented');
      break;
    }
    case 'ts-app': {
      logger.warn('ts-app scaffolding not yet implemented');
      break;
    }
    case 'web-app': {
      logger.warn('web-app scaffolding not yet implemented');
      break;
    }
    default: {
    }
  }
}
