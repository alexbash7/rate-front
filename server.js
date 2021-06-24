const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');
// test

const app = express();

// app.use('/', serveStatic(path.join(__dirname, '/dist')));
app.use(express.static(__dirname + '/dist'));

const port = process.env.PORT || 8080;
app.listen(port);