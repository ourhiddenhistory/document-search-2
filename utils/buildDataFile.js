#!/usr/bin/env node

/**
 * combine individual json files in docsData dir into single array and write to NOWRITE.json
 */

const fs = require('fs');
const glob = require('glob-fs')({ gitignore: true });

const compare = (a, b) => {
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
};

const INPUT = 'docsData/';
const OUTPUT = '_data/DOCS_NOWRITE.json';
const files = glob.readdirSync(`${INPUT}*.json`, { cwd: '.' });
const data = [];

files.forEach((el) => {
  const fileContents = fs.readFileSync(el, 'utf8');
  data.push(JSON.parse(fileContents));
});

data.sort(compare);

fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2));
