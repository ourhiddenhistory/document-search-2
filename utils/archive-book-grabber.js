var casper = require("casper").create({
  verbose: true,
  logLevel: "debug",
  viewportSize: {
    width: 1600,
    height: 1200,
  },
  pageSettings: {
    loadImages: true, // The WebPage instance used by Casper will
    loadPlugins: false, // use these settings
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4",
  }
});

// print out all the messages in the headless browser context
casper.on("remote.message", function(msg) {
  this.echo("remote message caught: " + msg);
});

// print out all the messages in the headless browser context
casper.on("page.error", function(msg, trace) {
  this.echo("Page Error: " + msg, "ERROR");
});

var url = "https://example.org/account/login.php";

casper.start(url, function() {

  casper.waitForSelector('form.iaform', function(){
    this.fillSelectors('form.iaform', {
      'input[name="username"]': 'info@altviewstv-fanclub.org',
      'input[name="password"]': 'XXXXXX',
    }, true);
    casper.capture('screenshots/login.png');
  });

  casper.waitForSelector('a.mypic span', function(){
    casper.thenEvaluate(function(){
       console.log("Page Title " + document.title);
       console.log("Your name is " + document.querySelector('a.mypic span').textContent );
    });
    casper.capture('screenshots/loggedin.png');
  });
});

casper.thenOpen('https://example.org/stream/ontrailofassassi00jimg#page/n0/mode/1up', function() {
  casper.waitForSelector('div#BRpageview #pagediv0', function(){

  });
});

var i = 1;
casper.repeat(446, function(){
  casper.then(function(){
    casper.wait(10000, function(){
      casper.capture('screenshots/trail_'+i+'.png');
      this.click('button.book_right');
      i++;
    });
  });
});

casper.thenOpen('https://example.org/stream/whokilledjfk00ogle#page/n0/mode/1up', function() {
  casper.waitForSelector('div#BRpageview #pagediv0', function(){

  });
});

var i = 1;
casper.repeat(102, function(){
  casper.then(function(){
    casper.wait(10000, function(){
      casper.capture('screenshots/ogelesby_'+i+'.png');
      this.click('button.book_right');
      i++;
    });
  });
});

casper.run();
