#!/usr/bin/env node

import { program } from 'commander';
import load from '../index';
// @ts-ignore
import packageConfig from '../../package.json';

const { version } = packageConfig;

program
  .version(version)
  .description('Load page')
  .option('-o, --output [path]', 'output path', process.cwd())
  .arguments('<href>')
  .action((href, arg) => {
    const { output } = arg;
    load(href, output);
  });

program.parse(process.argv);
