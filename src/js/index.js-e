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

function alphabetical_sort_object_of_objects(data, attr) {
    var arr = [];
    for (var prop in data) {
        if (data.hasOwnProperty(prop)) {
            var obj = {};
            obj[prop] = data[prop];
            obj.tempSortName = data[prop][attr].toLowerCase();
            arr.push(obj);
        }
    }

    arr.sort(function(a, b) {
        var at = a.tempSortName,
            bt = b.tempSortName;
        return at > bt ? 1 : ( at < bt ? -1 : 0 );
    });

    var result = [];
    for (var i=0, l=arr.length; i<l; i++) {
        var obj = arr[i];
        delete obj.tempSortName;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                var id = prop;
            }
        }
        var item = obj[id];
        result.push(item);
    }
    return result;
}

const filterValue = (obj, key, value)=> obj.find(v => v[key] === value);

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

class Listing {

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
    console.log('groupId: '+this.groupId);
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
    console.log(collection);
    console.log(docname);
    return docname.join(' / ');
  }

  extractSearch(search){
    this.searched = new ExtractSentences(this.entry, search, 1);
  }
}

class ExtractSentences {

  constructor(text, search, additional){
    this.text = text;
    this.search = search;
    return this.extract();
  }

  extract(){
    let SE = this;
    let abbrRegex = /\b(\w\.\w\.|[A-Z][a-z]{1,2}\.)|([.?!]|\n+)\s+(?=[A-Za-z])/g;
    let result = SE.text.replace(abbrRegex, function(m, g1, g2){
      return g1 ? g1 : g2+"\r";
    });

    let textSplit = result.replace(/\n/g, " ")
      .split("\r")
      .map(function(str){
      return str.trim();
    });

    SE.search = SE.search.replace(/(\s+)/, '|');
    let find = new RegExp(SE.escapeRegExp(SE.search), "i");
    let textFiltered = textSplit.map(function(el, i, arr){
      //let pre = (typeof arr[i-1] !== "undefined" ? arr[i-1] : null);
      //let post = (typeof arr[i+1] !== "undefined" ? arr[i+1] : null);
      let pre = null, post = null;
      let string = [pre, el, post].filter(x => x).join(' ');
      return (find.test(string) ? string : null);
    }).filter(textFiltered => textFiltered);

    return textFiltered;
  }

  escapeRegExp(str) {
    // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g with pipe
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$]/g, "\\$&");
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


function getPage(page, lastPageContent){

  if(ajaxPage != null) ajaxPage.abort();

  ajaxPage = $.get(
    'https://api.ourhiddenhistory.org/_search?q=file.filename:'+page+'&size=1&pretty',
    function (response) {

      ajaxPage = null;

      if(response.hits.hits.length == 0){
        $('.entry-panel__content').html(lastPageContent);
        alert('no more pages in this document. This is page '+currentListing.page+'.');
        return;
      }
      let listing = new Listing(response.hits.hits[0], docList);
      // set search param in url
      let newUrl = changeUrlWithNewDocument(window.location.pathname + window.location.search, [listing.id]);
      history.pushState({}, null, newUrl);

      displayListingInEntryPanel(listing);
    }
  );
}

let path = window.location.pathname;
if(path != 'index.html' && path != ''){
  let pathParts = path.split('/');
  let page = pathParts[2]+'.txt'
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

function parseResponse(response, container) {
  container = [];
  response.hits.hits.map((el, i) => {
    let file = el._source.file.filename;
    let entry = el._source.content;
    let string = new ExtractSentences(entry, search, 1);
    let listing = new Listing(string, entry, file, docList);
    container.push(listing);
  });
  return container;
}

let TEXT = '';
let totalPages = 0;
let currentPage = 0;
let search = '';
const size = 100;

$("#search_btn").on('click', function(e){

  $(".results-container").html('Loading...');

  search = $("#search").val().replace(/['"]+/g, '');
  if(search.length <= 3){
    alert('search must be at least 3 characters long');
    $(".result").html('');
    return;
  }

  currentPage = 1;
  if(ajaxSearch != null) ajaxSearch.abort();
  ajaxSearch = $.get(
    'https://api.ourhiddenhistory.org/_search?q=content:'+search+'&size='+size+'&from=0&default_operator=AND&pretty',
    function(response){
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
    }
  );
});

// automatically trigger for search param
search = getParameterByName('search');
if(search){
  $("#search").val(search);
  $("#search_btn").trigger('click');
}


function getResults(search, size, page, callback){
  currentPage = page;
  let from = (size * (page - 1));
  $.get(
    'https://api.ourhiddenhistory.org/_search?q=content:'+search+'&size='+size+'&from='+from+'&default_operator=AND&pretty',
    callback
  );
}

function displayResults(response){
  listings = [];
  let container = [];
  response.hits.hits.map((el, i) => {
    let file = el._source.file.filename;
    let entry = el._source.content;
    let listing = new Listing(el, docList);
    listing.extractSearch(search);
    container.push(listing);
  });
  listings = container;
  console.log(listings);
  if(!listings.length){
    $(".results-container").html('No Results');
    return;
  }

  $(".results-container").empty();
  let resultsDiv = $('<div></div>');
  resultsDiv.addClass('results');
  listings.map((el, i, arr) => {
    let mainDiv = $('<div></div>');
    mainDiv.addClass('listing');
    let li = el.searched.map(e => {
      return '<li>'+e+'</li>';
    });
    let strUl = $('<ul>'+li.join('')+'</ul>');
    strUl.addClass('text-found');
    let fileDiv = $('<div>'+el.docname+', page: '+el.page+'</div>');
    fileDiv.addClass('entry-link');
    fileDiv.addClass('open-entry-js');
    fileDiv.attr('data-entry', i);
    mainDiv.html(fileDiv[0].outerHTML+strUl[0].outerHTML);
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
