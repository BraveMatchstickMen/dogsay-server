'use strict'

var koa = require('koa')
var logger = require('koa-logger')
var session = require('koa-session')
var bodyParser = require('koa-bodyParser')
var app = koa()

app.keys = ['imooc']
app.use(logger())
app.use(session(app))
app.use(bodyParser())

var router = require('./config/routers')()

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(1234)
console.log('Listening: 1234')
