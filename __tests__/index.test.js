// @ts-check

import os from 'os';
import { promises as fsp } from 'fs';
import nock from 'nock';
import path from 'path';
import load from '../src/index';

const getFixturePath = (fileName) => path.join('__fixtures__', fileName);
const tempDirectory = os.tmpdir();
const expectedPageName = 'hexlet-io-courses.html';

let expectedPageContent;
beforeAll(async () => {
  expectedPageContent = await fsp.readFile(getFixturePath('page.html'), 'utf-8');
});

test('Load page', async () => {
  const scope = nock('https://hexlet.io')
    .get('/courses')
    .reply(200, expectedPageContent);

  await load('https://hexlet.io/courses', tempDirectory);

  expect(scope.isDone()).toBe(true);

  const actualPageContent = await fsp.readFile(path.join(tempDirectory, expectedPageName), 'utf-8');

  expect(actualPageContent).toBe(expectedPageContent);
});
