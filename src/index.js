// @ts-check
import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';

const generateFileName = (href) => href.replace(/(^\w+:|^)\/\//, '').replace(/[^A-Za-z\d]/g, '-');

export default (href, outputPath) => (
  axios.get(href)
    .then((res) => res.data)
    .then((data) => fs.writeFile(path.join(outputPath, `${generateFileName(href)}.html`), data))
    .catch((err) => {
      console.log(err);
    })
);
