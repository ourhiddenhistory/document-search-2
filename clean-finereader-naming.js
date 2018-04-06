#!/usr/bin/env node

/**
 * script to fix the "_2" that FineReader appends to the text output of single
 * page scans.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob-fs')({ gitignore: true });
const padStart = require('string.prototype.padstart');

padStart.shim();

const DIR_CSV = process.argv[2];
const DIRS = DIR_CSV.split(',');
const PROCEED = process.argv[3] || false;

const BASEPATH = '/Users/ourhiddenhistory/Desktop/BCCI/es';

/**
 * @param {String} file - full filepath
 * @returns {Array} ['docId', 'page']
 */
function parseFilename(file) {
  if (file === false) return false;
  const basename = path.basename(file, '.txt');
  const pos = basename.lastIndexOf('_');
  const docId = basename.substring(0, pos);
  const page = basename.substring((pos + 1), basename.length);
  return [docId, page];
}

/**
 * @param {Array} current - current file parts
 * @param {Array} prev - prev file parts
 * @param {Array} next - next file parts
 * @returns {Boolean} is file from one page doc?
 */
function fileIsFromOnePageDoc(current, prev, next) {
  return (prev[0] !== current[0] && current[0] !== next[0]);
}

DIRS.forEach((dir) => {
  const absDir = `${BASEPATH}/${dir}/`;
  const files = glob.readdirSync(`${absDir}*.txt`, { cwd: '/' });
  files.forEach((file, i) => {
    const currentFilepath = `/${file}`;
    const prevFilepath = files[(i - 1)] || false;
    const nextFilepath = files[(i + 1)] || false;
    const currentFileparts = parseFilename(currentFilepath);
    const prevFileparts = parseFilename(prevFilepath);
    const nextFileparts = parseFilename(nextFilepath);

    const isOnePage = fileIsFromOnePageDoc(currentFileparts, prevFileparts, nextFileparts);
    // console.log(`${currentFileparts} | ${isOnePage}`);
    if (isOnePage && currentFileparts[1] === '2') {
      //console.log(`${currentFileparts} | ${isOnePage}`);
      const newFilepath = `${absDir}${currentFileparts[0]}_1.txt`;
      if (!PROCEED){
        console.log(`${currentFilepath} will be renamed to ${newFilepath}`);
      }else{
        fs.rename(currentFilepath, newFilepath, (err) => {
          if (err) {
            console.log(err); return;
          }
          console.log(`RENAMED TO: ${newFilepath}`);
        });
      }
    }

  });
});
