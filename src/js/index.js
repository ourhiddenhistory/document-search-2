
const client = new $.es.Client({
  hosts: 'https://api.ourhiddenhistory.org',
});

client.ping({
  requestTimeout: 30000,
}, (error) => {
  if (error) {
    alert('elasticsearch cluster is down!');
  }
});

const filterValue = (obj, key, value) => obj.find(v => v[key] === value);

/**
 * Modules
 */
String.prototype.lpad = function(padString, length) {
  var str = this;
  while (str.length < length)
    str = padString + str;
  return str;
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

/** Class representing a single elasticsearch hit. */
class Listing {
  /**
   * @param {Object} hit - single elasticsearch hit
   * @param {Object} doclist - document list
   */
  constructor(hit, doclist) {
    this.file = hit._source.file.filename;
    this.id = this.file.replace('.txt', '');
    this.searched = [];

    this.groupId = this.getGroupId();
    this.docId = this.getDocId();
    this.page = this.getPage();
    this.pageNext = null;
    this.pagePrev = null;

    this.docname = this.getDocName(doclist);
    this.sourceHref = this.getSourceUrl(doclist);
    this.img = this.getImgPath();
    this.txt = this.getTxtPath();

    this.entry = hit._source.content;
  }

  getGroupId() {
    return this.id.slice(0, 3);
  }

  getDocId() {
    let regex = new RegExp('(_[0-9]{1,4})$');
    let doc = this.id.replace(regex, '');
    doc = doc.slice(4);
    return doc;
  }

  getPage() {
    let groupId = this.getGroupId();
    let docId = this.getDocId();
    return this.id.replace(groupId+'-'+docId+'_', '');
  }

  getSourceType(doclist) {
    let type = false;
    let file = {};
    let collection = filterValue(doclist, 'id', this.groupId);
    if(collection && collection.files){
      file = filterValue(collection.files, 'id', this.docId);
      if(file && file.type){
        type = file.type;
      }
    }
    return type;
  }

  getSourceUrl(doclist) {
    let source = false;
    let file = {};
    let collection = filterValue(doclist, 'id', this.groupId);
    if(collection && collection.files){
      file = filterValue(collection.files, 'id', this.docId);
      if(file && file.source){
        source = file.source;
      }
    }
    if(source === false) return;
    switch(this.getSourceType(doclist)) {
      case 'archive':
        source = source+'#page/n'+this.page;
        break;
      case 'pdf':
        source = source+'#page='+this.page;
        break;
      case 'nara':
        source = 'https://www.archives.gov/files/research/jfk/releases/'+this.docId+'.pdf#page='+this.page;
        break;
      default:
        source = source+'#page/n'+this.getPage();
    }
    return source;
  }

  getTxtPath() {

  }

  getImgPath() {
    let page = this.page.padStart(4, 0);
    let host = 'https://doc-search.nyc3.digitaloceanspaces.com/docs_images/';
    let src = this.groupId+'/'+this.groupId+'-'+this.docId+'_'+page+'.png';
    return host+src;
  }

  getDocName(doclist){
    let docname = [];
    let collection = filterValue(doclist, 'id', this.groupId);
    if(collection && collection.collection){
      docname.push(collection.collection);
      if(collection.files){
        let file = filterValue(collection.files, 'id', this.docId);
        if(file && file.doc_name){
          docname.push(file.doc_name);
        }
      }
    }
    if(!this.docId.match(/^[0-9]{3}$/))
    docname.push(this.docId);
    return docname;
  }

  extractSearch(search) {
    this.searched = ExtractSentences.extract(this.entry, search);
  }
}

/** class to assist in building elastic search queries */
class GenerateEsQuery {
  /**
   * Create a point.
   * @param {String} stringInput - user search string.
   * @returns {Object} json representation of search
   */
  static generate(stringInput) {
    const esQuery = {
      query: {
        bool: {
          must: [],
        },
      },
    };
    const stringParts = stringInput.match(/("[^"]+"|[^"\s]+)/g);
    stringParts.forEach((str) => {
      const searchObj = {};
      const cleanStr = str.replace(/^"([^"]+)"$/, '$1').replace(/\s+/, ' ');
      if (GenerateEsQuery.isPhrase(cleanStr)) {
        searchObj.match_phrase = {
          content: cleanStr,
        };
      } else {
        searchObj.match = {
          content: cleanStr,
        };
      }
      esQuery.query.bool.must.push(searchObj);
    });
    return esQuery;
  }
  /**
   * Check if string is a phrase by looking for a space
   * @param {String} str - string to check.
   * @returns {Boolean} is phrase?
   */
  static isPhrase(str) {
    return (str.indexOf(' ') >= 0);
  }
}

/**
 * For block of text, extract sentences containing any part
 * of the search phrase and highlight it
 *
 * Sentence Splitter:
 * https://stackoverflow.com/a/34784856/399696
 * - Added allowance for Mr., Mrs., Dr. etc... ([A-Z][a-z]{1,2}\.)
 *
 * RegEx Escape Str:
 * https://stackoverflow.com/a/6969486/399696
 *
 * Highligher:
 * https://markjs.io/
 *
 * Text files:
 * http://www.textfiles.com/etext/AUTHORS/SHAKESPEARE/
 */
class ExtractSentences {
  /**
   * @param {String} text - block of text
   * @param {String} search - extract sentences containing this text
   * @return {Array} array of extracted sentences
   */
  static extract(text, search) {
    const abbrRegex = /\b(\w\.\w\.|[A-Z][a-z]{1,2}\.)|([.?!]|\n+)\s+(?=[A-Za-z])/g;
    const result = text.replace(abbrRegex, (m, g1, g2) => g1 || `${g2}\r`);
    const textSplit = result.replace(/\n/g, ' ')
      .split('\r')
      .map(str => str.trim());

    const searchParts = search.match(/("[^"]+"|[^"\s]+)/g);
    const cleanedParts = searchParts.map(x => x.replace(/^"([^"]+)"$/, '$1').replace(/\s+/, ' '));
    const searchFormatted = cleanedParts.join('|');
    const find = new RegExp(ExtractSentences.escapeRegExp(searchFormatted), 'i');
    const textFiltered = textSplit.map((el) => {
      // can use the following to add preceeding and following lines
      // let pre = (typeof arr[i-1] !== "undefined" ? arr[i-1] : null);
      // let post = (typeof arr[i+1] !== "undefined" ? arr[i+1] : null);
      const pre = null;
      const post = null;
      const string = [pre, el, post].filter(x => x).join(' ');
      return (find.test(string) ? string : null);
    }).filter(e => e);

    return textFiltered;
  }
  /**
   * @param {String} str search string to use as regex
   * @return {String} str escaped for regex
   */
  static escapeRegExp(str) {
    // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g with pipe
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$]/g, '\\$&'); // eslint-disable-line no-useless-escape
  }
}

/**
 * changeUrlWithNewSearch
 * @param string full url to adjust
 * @param string search term
 */
var changeUrlWithNewSearch = function(url, searchterm) {
  let currentPath = url.split('?')[0];
  let newUrl = currentPath + '?search='+searchterm;
  return newUrl;
}

/**
 * changeUrlWithNewDocument
 * @param string full url to adjust
 * @param array path parts
 */
var changeUrlWithNewDocument = function(url, document) {
  let currentParams = url.split('?')[1] || '';
  let newUrl = '/doc-search/' + document.join('/') + '?' + currentParams;
  return newUrl;
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * UI Components
 */

let ajaxSearch = null;
let ajaxPage = null;

let currentListing = null;
function changePage(direction) {
  let newPage = 0;
  if(direction == 'prev'){
    newPage = Number(currentListing.page) - 1;
  }else{
    newPage = Number(currentListing.page) + 1;
  }
  newPage = currentListing.groupId+'-'+currentListing.docId+'_'+newPage+'.txt';
  let lastPageContent = $('.entry-panel__content').html();
  getPage(newPage, lastPageContent);
  $('.entry-panel__content').html('LOADING...');
}

/**
 * @param {String} page - page id to retrieve
 * @param {String} lastPageContent - original page content in case of failure
 * @returns {void}
 */
function getPage(page, lastPageContent) {

  if (ajaxPage != null) ajaxPage.abort();

  ajaxPage = client.search({
    size: 1,
    pretty: null,
    q: `file.filename:${page}`,
  }).then((response) => {
    ajaxPage = null;

    if(response.hits.hits.length == 0) {
      $('.entry-panel__content').html(lastPageContent);
      alert(`no more pages in this document. This is page ${currentListing.page}.`);
      return;
    }
    const listing = new Listing(response.hits.hits[0], docList);
    // set search param in url
    const curPath = window.location.pathname + window.location.search;
    const newUrl = changeUrlWithNewDocument(curPath, [listing.id]);
    history.pushState({}, null, newUrl);

    displayListingInEntryPanel(listing);
  }, (err) => {
      console.trace(err.message);
  });
}

const path = window.location.pathname;
if (['', '/', 'index.html'].indexOf() !== -1) {
  const pathParts = path.split('/');
  const page = `${pathParts[2]}.txt`;
  getPage(page, null);
}

/**
 * Controller
 */
let listings = [];
let imgLock = false;

$('.toolbar-entry__disp-img-lock').on('click', function() {
  let setTo = !imgLock;
  let removeClass = (setTo ? 'btn-secondary' : 'btn-info');
  let addClass = (setTo ? 'btn-info' : 'btn-secondary');
  $(this).removeClass(removeClass).addClass(addClass);
  imgLock = setTo;
});

$('.toolbar-entry__page-next').on('click', function(){
  changePage('next');
});

$('.toolbar-entry__page-prev').on('click', function(){
  changePage('prev');
});

$('.toolbar-entry__disp-img').on('click', function(){
  let img = $('<img class="display-img" />');
  img.attr('src', entryImg);
  $('.entry-panel__content').html(img[0].outerHTML);
  $('.entry-panel__content--entry img')
    .wrap('<span style="display:inline-block"></span>')
    .css('display', 'block')
    .parent()
    .zoom({ on: 'click' });
});

$('.toolbar-entry__disp-txt').on('click', function(){
  displayListingInEntryPanel(currentListing);
});

function setPdfLink(href){
  if(!href){
    $('.toolbar-entry__open-pdf')
      .addClass('disabled')
      .removeAttr('href');
  }else{
    $('.toolbar-entry__open-pdf')
      .removeClass('disabled')
      .attr('href', href);
  }
}

$(document).keypress(function(e) {
  if(e.which == 13) {
    $("#search_btn").trigger('click');
  }
});

$('.results-container').on('click', '.open-entry-js', function(e){
  entryIndex = $(this).data('entry');
  if(listings.length == 0) return;
  displayListingInEntryPanel(listings[entryIndex]);
});

let entryImg = null;
let entryIndex = null;
function displayListingInEntryPanel(listing) {
  let searchTrimmed = $("#search").val().replace(/['"]+/g, '');
  $('.entry-panel__content').closest('.scrolling-pane').scrollTop(0);
  if(imgLock){
    let img = $('<img class="display-img" />');
    img.attr('src', listing.img);
    $('.entry-panel__content').html(img[0].outerHTML);
    $('.entry-panel__content--entry img')
      .wrap('<span style="display:inline-block"></span>')
      .css('display', 'block')
      .parent()
      .zoom({ on: 'click' });
  }else{
    $('.entry-panel__content').html(listing.entry);
    let instance = new Mark($('.entry-panel__content')[0]);
    instance.mark(searchTrimmed);
  }
  setPdfLink(listing.sourceHref);
  entryImg = listing.img;
  currentListing = listing;
  // set search param in url
  let newUrl = changeUrlWithNewDocument(window.location.pathname + window.location.search, [listing.id]);
  history.pushState({}, null, newUrl);
}

let TEXT = '';
let totalPages = 0;
let currentPage = 0;
let search = '';
const size = 100;

$("#search_btn").on('click', function(e){

  $(".results-container").html('Loading...');

  search = $("#search").val();
  if(search.length <= 2){
    alert('search must be at least 2 characters long');
    $(".result").html('');
    return;
  }

  currentPage = 1;
  if(ajaxSearch != null) ajaxSearch.abort();

  ajaxSearch = client.search({
    size: size,
    from: 0,
    pretty: null,
    body: GenerateEsQuery.generate(search),
  }).then((response) => {
    ajaxSearch = null;

    // set search param in url
    let newUrl = changeUrlWithNewSearch(window.location.pathname, search);
    history.pushState({}, null, newUrl);

    if(response.hits.total == 0){
      displayResults(response);
      return;
    }
    totalPages = Math.ceil(response.hits.total / 100);
    $pagination.twbsPagination('destroy');
    $pagination.twbsPagination($.extend({}, {}, {
      startPage: currentPage,
      totalPages: totalPages,
      onPageClick: function (event, page) {
        getResults(search, size, page, displayResults);
        $('.search-panel').closest('.scrolling-pane').scrollTop(0);
      }
    }));
  }, (err) => {
      console.trace(err.message);
  });
});

// automatically trigger for search param
search = getParameterByName('search');
if(search){
  $("#search").val(search);
  $("#search_btn").trigger('click');
}

/**
 * @param {String} searchParam - search parameter
 * @param {Int} recordCount - record count to return
 * @param {Int} page - page of records to retrieve
 * @param {Func} callback - function to run on completion
 * @returns {void}
 */
function getResults(searchParam, recordCount, page, callback) {
  currentPage = page;
  const from = (recordCount * (page - 1));

  if (ajaxSearch != null) ajaxSearch.abort();

  ajaxSearch = client.search({
    size: recordCount,
    from,
    pretty: null,
    body: GenerateEsQuery.generate(searchParam),
  }).then((response) => {
    ajaxSearch = null;
    callback(response.hits.hits);
  });
}

/**
 * @return {void}
 */
function displayResults(response) {
  listings = [];
  const container = [];
  response.forEach((el) => {
    const listing = new Listing(el, docList);
    listing.extractSearch(search);
    container.push(listing);
  });
  listings = container;

  if(!listings.length){
    $(".results-container").html('No Results');
    return;
  }

  $(".results-container").empty();
  let resultsDiv = $('<div></div>');
  resultsDiv.addClass('results');
  listings.forEach((el, i) => {
    const lis = [];
    el.searched.forEach((e) => {
      lis.push(`<li>${e}</li>`);
    });
    const mainDiv = `
    <div class="listing">
      <div class="entry-link open-entry-js" data-entry="${i}">
        <div class="entry-link__collection">${el.docname[0]}</div>
        <div class="entry-link__document">${el.docname[1]}, page: ${el.page}</div>
      </div>
      <ul class="entry-link__text-found">
        ${lis.join('\n')}
      </ul>
    </div>`;
    resultsDiv.append(mainDiv);
  });
  var instance = new Mark(resultsDiv[0]);
  let searchTrimmed = search.replace(/['"]+/g, '');
  instance.mark(searchTrimmed);
  $(".results-container").append(resultsDiv[0].outerHTML);
}

$.ajaxSetup({
  error: function(xhr, status, error) {
    console.log(xhr);
  }
});

$.get(
  'https://api.ourhiddenhistory.org/_cat/count?format=json&pretty',
  function (response) {
    let msg = `${Number(response[0].count).toLocaleString()} pages indexed`;
    $('.docsearch__indexed-cnt').html(msg);
});

var $pagination = $('.search-panel__pagination');

$('[data-toggle="tooltip"]').tooltip();

/**
 * pan/zoom
 *
 */
$('.entry-panel__content--entry').zoom({ on: 'click' });
