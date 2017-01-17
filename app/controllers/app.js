"use strict"

var mongoose = require('mongoose')
var User = mongoose.model('User')
var config = require('../../config/config')
var sha1 = require('sha1')

exports.signature = function *(next) {
	var body = this.request.body
	var type = body.type
	var timestamp = body.timestamp
	var folder
	var tags

	if (type === 'avatar') {
		folder = 'avatar'
		tags = 'app,avatar'
	}
	else if (type === 'video') {
		folder = 'video'
		tags = 'app,video'
	}
	else if (type === 'audio') {
		folder = 'audio'
		tags = 'app,audio'
	}

	var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.cloudinary.api_secret

    signature = sha1(signature)

	this.body = {
		success: true,
		data: signature
	}
}

exports.hasBody = function *(next) {
	var body = this.request.body || {}

	if (Object.keys(body).length === 0) {
		this.body = {
			success: false,
			err: '是不是漏掉什么了'
		}

		return next
	}

	yield next
}

exports.hasToken = function *(next) {
	var accessToken = this.query.accessToken

	if (!accessToken) {
		accessToken = this.request.body.accessToken
	}

	if (!accessToken) {
		this.body = {
			success: false,
			err: '钥匙丢了'
		}

		return next
	}

	var user = yield User.findOne({
		accessToken: accessToken
	})
	.exec()

	if (!user) {
		this.body = {
			success: false,
			err: '用户没登录'
		}

		return next
	}

	this.session = this.session || {}
	this.session.user = user

	yield next
}