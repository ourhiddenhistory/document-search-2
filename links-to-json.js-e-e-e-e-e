#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const padStart = require('string.prototype.padstart');

padStart.shim();

const INPUT = process.argv[2];
const OUTPUT = `${path.dirname(INPUT)}/${path.basename(INPUT, '.txt')}.json`;

const fileContents = fs.readFileSync(INPUT, 'utf8');
const lines = fileContents.split('\n');

const storeArr = [];
lines.forEach((el, i) => {
  const obj = {
    id: String(i + 1).padStart(3, '0'),
    doc_name: decodeURI(path.basename(el.trim(), '.pdf')),
    source: el.trim(),
  };
  storeArr.push(obj);
});

const json = JSON.stringify(storeArr, null, 2);
fs.writeFile(OUTPUT, json, (err) => {
  if (err) {
    return console.log(err);
  }
  return err;
});
