
const Helper = require('./Helper.js');


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


//test send Email Notification:
Helper.sendEmail("gmail","wuguangzheng91@gmail.com","pass","wuguangzheng91@gmail.com","wuguangzheng91@gmail.com","qMenu Automation Email Service", "Test Body");
async function test() {
    const browser = await puppeteer.launch({ headless: false, devtools: true, defaultViewport: null });
}

test();

