#!/usr/bin/env node

/**
 * Generate json from list of links and can also provide list of doc names
 * @param {Filepath} source - file containing newline separated list of source links
 * @param {Integer} startAt - number to start json ids at
 * @param {Filepath} names - file containing newline separated list of doc_names
 * @throws {Error} throws error if link count doesn't match name count (if name list provided)
 */

const fs = require('fs');
const path = require('path');
const padStart = require('string.prototype.padstart');

padStart.shim();

const INPUT = process.argv[2];
const START_CNT = Number(process.argv[3]) || 1;
const NAMES_INPUT = process.argv[4] || false;
const OUTPUT = `${path.dirname(INPUT)}/${path.basename(INPUT, '.txt')}.json`;

const fileContents = fs.readFileSync(INPUT, 'utf8');
const lines = fileContents.split('\n');

let docNames = [];
if (NAMES_INPUT) {
  docNames = fs.readFileSync(NAMES_INPUT, 'utf8')
    .split('\n');
  if (docNames.length !== lines.length) {
    throw new Error(`Source lines do not match Name lines (${docNames.length} vs. ${lines.length})!`);
  }
}

const storeArr = [];
lines.forEach((el, i) => {
  const obj = {
    id: el,
    //id: String(i + START_CNT).padStart(3, '0'),
    // id: decodeURI(path.basename(el.trim(), '.pdf')), For Nuremburg Trials
    doc_name: decodeURI(path.basename(el.trim(), '.pdf')).replace(/_/g, ' ').replace(/-/g, ' '),
    source: `https://catalog.archives.gov/OpaAPI/media/7564912/content/arcmedia/dc-metro/jfkco/641323/${el}/${el}.pdf`,
  };
  if (NAMES_INPUT) {
    obj.doc_name = docNames[i]
      .trim()
      .replace('_', ' ')
      .replace(/\s\s+/g, ' ');
  }
  storeArr.push(obj);
});

const json = JSON.stringify(storeArr, null, 2);
fs.writeFile(OUTPUT, json, (err) => {
  if (err) {
    return console.log(err);
  }
  return err;
});