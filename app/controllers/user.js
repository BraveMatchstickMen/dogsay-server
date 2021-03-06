"use strict"

var xss = require('xss')
var mongoose = require('mongoose')
var User = mongoose.model('User')
var uuid = require('uuid')
var sms = require('../service/sms')

exports.signup = function *(next) {
	console.log(this.request.body)
	console.log(this.request.body.phoneNumber)
	var phoneNumber = xss(this.request.body.phoneNumber.trim())

	var user = yield User.findOne({
		phoneNumber: phoneNumber
	}).exec()

	var verifyCode = sms.getCode()

	if (!user) {
		var accessToken = uuid.v4()

		user = new User({
			nickname: '新🐶宝',
			avatar: 'http://img3.duitang.com/uploads/item/201511/29/20151129193025_KGM58.jpeg',
			phoneNumber: xss(phoneNumber),
			verifyCode: verifyCode,
			accessToken: accessToken
		})
	}
	else {
		user.verifyCode = verifyCode
	}

	try {
	  user = yield user.save()
	}
	catch(e) {
	  this.body = {
		success: false
	  }
	  return next
	}

	var msg = '您的注册验证码是：' + user.verifyCode

	try {
		sms.send(user.phoneNumber, msg)
	}
	catch (e) {
		console.log(e)

		this.body = {
			success: false,
			err: '短信服务异常'
		}

		return next
	}

	this.body = {
		success: true
	}
}

exports.verify = function *(next) {
	console.log(this.request.body)

	var verifyCode = this.request.body.verifyCode
	var phoneNumber = this.request.body.phoneNumber

	console.log(verifyCode, phoneNumber)

	if (!verifyCode || !phoneNumber) {
		this.body = {
			success: false,
			err: '验证没通过'
		}

		return next
	}

	var user = yield User.findOne({
		phoneNumber: phoneNumber,
		verifyCode: verifyCode
	}).exec()

	console.log(user)

	if (user) {
		user.verified = true
		user = yield user.save()

		this.body = {
			success: true,
			data: {
				nickname: user.nickname,
				accessToken: user.accessToken,
				avatar: user.avatar,
				_id: user._id
			}
		}
	}
	else { 
		this.body = {
			success: false,
			err: '验证未通过'
		}
	}
}

exports.update = function *(next) {
	var body = this.request.body
	var user = this.session.user

    // 逗号后不加空格
	var fields = 'avatar,gender,age,nickname,breed'.split(',')

	fields.forEach(function(field) {
		if (body[field]) {
			user[field] = xss(body[field].trim())
		}
	})

	user = yield user.save()

	this.body = {
		success: true,
		data: {
			nickname: user.nickname,
			accessToken: user.accessToken,
			avatar: user.avatar,
			age: user.age,
			breed: user.breed,
			gender: user.gender,
			_id: user._id
		}
	}
}