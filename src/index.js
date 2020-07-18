// @ts-check
import { promises as fsp, existsSync, mkdirSync } from 'fs';
import path from 'path';
import url from 'url';
import axios from 'axios';
import cheerio from 'cheerio';

const tags = ['img', 'link', 'script'];

const resourseLoaders = {
  img: (link) => axios.get(link, { responseType: 'stream' }).then((res) => ({ link, data: res.data })),
  link: (link) => axios.get(link, { responseType: 'json' }).then((res) => ({ link, data: res.data })),
  script: (link) => axios.get(link, { responseType: 'json' }).then((res) => ({ link, data: res.data })),
};

const tagAttributeLinks = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const removeExtension = (filename) => filename.replace(/\.[^/.]+$/, '');

const getExtension = (filename) => path.extname(filename).slice(1);

const getClearPathname = (href) => removeExtension(url.parse(href).pathname.slice(1));

const generatePathName = (href, sufix = '') => `${href.replace(/(^\w+:|^)\/\//, '').replace(/[^A-Za-z\d]/g, '-').replace(/-+$/ig, '')}${sufix}`;

const generateLocalLink = (href, localDirName) => {
  const pathname = getClearPathname(href);
  const extension = getExtension(href);
  const localName = generatePathName(pathname, `${extension ? `.${extension}` : ''}`);
  return path.join(localDirName, localName);
};

const writeFile = (outputPath, data) => fsp.writeFile(outputPath, data);

const findLinks = (context, tagNames, hostname) => (
  tagNames.map((tag) => {
    const links = [];
    context(tag).each((index, elem) => {
      const link = context(elem).attr(tagAttributeLinks[tag]);
      if (link && link.includes(hostname)) {
        links.push({ link, tag });
      }
    });
    return links;
  }).flat(Infinity)
);

const replaceLinks = (contex, tagNames, directoryName) => {
  tagNames.forEach((tag) => {
    contex(tag).each((index, elem) => {
      const link = contex(elem).attr(tagAttributeLinks[tag]);
      if (link) {
        const localLink = generateLocalLink(link, directoryName);
        contex(elem).attr(tagAttributeLinks[tag], localLink);
      }
    });
  });

  return contex.html();
};

const loadResourses = (links) => {
  const promises = links.map(({ tag, link }) => resourseLoaders[tag](link));
  return Promise.all(promises);
};

const createResoursesDirectory = (dirPath) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath);
  }
};

export default (href, outputPath) => {
  let $;

  const { hostname } = url.parse(href);
  const resoursesDirectory = generatePathName(href, '_files');
  const resoursesDirectoryPath = path.join(process.cwd(), resoursesDirectory);

  return axios.get(href)
    .then((res) => res.data)
    .then((html) => {
      $ = cheerio.load(html);
      return findLinks($, tags, hostname);
    })
    .then((links) => loadResourses(links))
    .then((resourses) => {
      createResoursesDirectory(resoursesDirectoryPath);

      const promises = resourses
        .map(({ data, link }) => ({ data, link: generateLocalLink(link, resoursesDirectory) }))
        .map(({ data, link }) => writeFile(path.join(outputPath, link), data));

      return Promise.all(promises);
    })
    .then(() => {
      const page = replaceLinks($, tags, resoursesDirectory);
      return writeFile(path.join(outputPath, generatePathName(href, '.html')), page);
    })
    .catch((err) => {
      console.log(err);
    });
};
