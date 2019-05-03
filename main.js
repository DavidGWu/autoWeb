const info = require("./const.js");
const Helper = require('./Helper.js');

const login = require('./login.js');
const scanLocation = require('./scanLocation.js');
const requestOwnership = require('./requestOwnership.js');
const rejectOwnershipRequest = require('./rejectOwnershipRequest.js');
const appealOwnershipRequest = require('./appealOwnershipRequest.js');
const scanGmailForOwnershipRequests = require('./scanGmailForOwnershipRequests.js');
const appealSuspended = require('./appealSuspended.js');

/* setup express and puppeteer*/
const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies
/* end setup express */

var nodemailer = require('nodemailer');


//Google Account Log in
app.post('/login', function (req, res) {
  var browser = puppeteer.launch({ headless: false, defaultViewport: null });
  if (!req.body.email || !req.body.password)
    return res.status(400).json('email, and password are required');

  login.GoogleLogin(browser, req.body.email, req.body.recoveryemail, req.body.password)
    .then(async result => {
      if (result.status) {
        res.json("Google Account Login Success");
        if (!req.body.stayAfterScan)
          (await browser).close();
        stayBrowser(browser, req.body.stayAfterScan);
      }
      else
        res.status(400).json("Failed, Error:   " + result.err);
    });

});


//Request for restaurant ownership 
app.post('/requestOwnership', function (req, res) {
  var browser = puppeteer.launch({ headless: false, defaultViewport: null });
  if (!req.body.email || !req.body.password || !req.body.place_id) {
    return res.status(400).json('GMB email or password or place_id missing');
  }

  login.GoogleLogin(browser, req.body.email, req.body.recoveryemail, req.body.password)
    .then(async result => {
      if (result.status) {
        requestOwnership.requestOwnership(browser, req.body.place_id)
          .then(async result => {
            if (result.status)
              res.json(result);
            if (!req.body.stayAfterScan)
              (await browser).close();
            else
              res.status(400).json("Failed, Error:   " + err);
          });
      }
      else
        res.status(400).json("Failed, Error:   " + result.err);
    });
});

app.post('/scanLocations3', function (req, res) {
  var browser = puppeteer.launch({ headless: false, defaultViewport: null });
  if (!req.body.email || !req.body.password || !req.body.appealIdsToSkipDetails)
    return res.status(400).json('email, password, and appealIdsToSkipDetails are required');

  login.GoogleLogin(browser, req.body.email, req.body.recoveryemail, req.body.password)
    .then(result => {
      if (result.status) {
        scanLocation.scanLocations(browser, req.body.email, req.body.appealIdsToSkipDetails)
          .then(async result => {
            if (result.status) {
              res.json(result.result);
              if (!req.body.stayAfterScan)
                (await browser).close();
            } else {
              res.status(400).json("Failed, Error:   " + result.err);
            }

          });
      }
      else
        res.status(400).json("Failed, Error:   " + result.err);
    });
});


app.post('/appealGmbRequest', function (req, res) {
  var browser = puppeteer.launch({ headless: false, defaultViewport: null });
  if (!req.body.email || !req.body.password || !req.body.arci || !req.body.place_id)
    return res.status(400).json('email, password, and arci are required');

  login.GoogleLogin(browser, req.body.email, req.body.recoveryemail, req.body.password)
    .then(result => {
      if (result.status) {
        appealOwnershipRequest.appealOwnershipRequest(browser, req.body.arci, req.body.place_id)
          .then(async result => {
            if (result.status) {
              res.json(result);
              console.log("DEBUG: Returned Appeal id:", result.appealId);
              if (!req.body.stayAfterScan)
                (await browser).close();
            }
            else res.status(400).json("Failed, Error:   " + result.err);
          });
      }
      else
        res.status(400).json("Failed, Error:   " + result.err);
    });
});

app.post('/rejectGmbRequest', function (req, res) {
  var browser = puppeteer.launch({ headless: false, defaultViewport: null });
  if (!req.body.email || !req.body.password || !req.body.arci)
    return res.status(400).json('email, password, and arci are required');

  login.GoogleLogin(browser, req.body.email, req.body.recoveryemail, req.body.password)
    .then(result => {
      if (result.status) {
        rejectOwnershipRequest.rejectOwnershipRequest(browser, req.body.arci)
          .then(async result => {
            if (result.status) {
              res.json("Success!");
              if (!req.body.stayAfterScan)
                (await browser).close();
            }
            else res.status(400).json("Failed, Error:   " + result.err);
          });
      }
      else
        res.status(400).json("Failed, Error:   " + result.err);
    });
});


app.post('/retrieveGmbRequests', function (req, res) {
  var browser = puppeteer.launch({ headless: false, defaultViewport: null });
  if (!req.body.email || !req.body.password)
    return res.status(400).json('email, and password are required');

  login.GoogleLogin(browser, req.body.email, req.body.recoveryemail, req.body.password)
    .then(result => {
      if (result.status) {
        scanGmailForOwnershipRequests.scanGmailForOwnershipRequests(browser)
          .then(async result => {
            if (result.status) {
              res.json(result.result);
              if (!req.body.stayAfterScan)
                (await browser).close();
            }

            else res.status(400).json("Failed, Error:   " + result.err);
          });
      }
      else
        res.status(400).json("Failed, Error:   " + result.err);
    });
});

app.post('/appealSuspended', function (req, res) {
  var browser = puppeteer.launch({ headless: false, defaultViewport: null });
  if (!req.body.email || !req.body.password || !req.body.params)
    return res.status(400).json('email, password, and params are required');
  const params = req.body.params;
  const requiredFields = ['name', 'email', 'bizName', 'address'];

  if (requiredFields.some(f => !params[f]))
    return res.status(400).json(requiredFields);

  login.GoogleLogin(browser, req.body.email, req.body.recoveryemail, req.body.password)
    .then(result => {
      if (result.status) {
        appealSuspended.appealSuspended(browser, params)
          .then(async result => {
            if (result.status) {
              res.json("Appeal Suspended Successful!");
              if (!req.body.stayAfterScan)
                (await browser).close();
            }
            else res.status(400).json("Failed, Error:   " + result.err);
          });
      }
      else
        res.status(400).json("Failed, Error:   " + result.err);
    });
});

app.post('/updateWebsite', function (req, res) {
  var browser = puppeteer.launch({ headless: false, defaultViewport: null });
  if (!req.body.email || !req.body.password || !req.body.appealId || !req.body.websiteUrl || !req.body.menuUrl || !req.body.orderAheadUrl || !req.body.reservationsUrl)
    return res.status(400).json('email, password, appealId, and website are required');


  login.GoogleLogin(browser, req.body.email, req.body.recoveryemail, req.body.password)
    .then(async result => {
      if (result.status) {
        updateWebsite.updateWebsite(browser, req.body.appealId, req.body.websiteUrl, req.body.menuUrl, req.body.orderAheadUrl, req.body.reservationsUrl)
        res.json("Action complete!");
        if (!req.body.stayAfterScan)
          (await browser).close();
      }
      else
        res.status(400).json("Failed, Error:   " + result.err);
    });

});





// start the server
const server = app.listen(info.ServerPort);
// increase the timeout to 15 minutes
server.timeout = 900000;
console.log('Main: Server started at port ', info.ServerPort);


