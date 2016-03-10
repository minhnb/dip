"use strict";

const router = require('koa-router')();

var geocoderProvider = 'google';
var httpAdapter = 'http';

const geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');
const validator = require('../../validators');

module.exports = router;

router.use('/', auth.authenticate())
	.post('add wish list', '/',
		validator.wishList(),
		ctx => {
			let longitude = ctx.request.body.longitude,
				latitude = ctx.request.body.latitude;
			let user = ctx.state.user;
			let location = {};
			return geocoder.reverse({lat: latitude, lon: longitude})
		    .then(function(res) {
		    	if(res) {
			        location =  {
		            	city: res[0].administrativeLevels.level2long,
		            	state: res[0].administrativeLevels.level1long
		            }
		            return db.wishList
		                .findOne({location: location})
		                .exec();  
		    	} else {
		    		ctx.throw(400, 'Geo error');
		    	}        
		    })
		    .then(wishList => {
	        	if(!wishList) {
	        		let userArr = [];
	        		userArr.push(user);
					var wishList = new db.wishList({
					    users: userArr,
					    location: location,
					    status: 'open'
					});	
	        	} else {
	    			if(wishList.users.indexOf(user._id) != -1) {
						ctx.throw(400, 'User exist') 
	    			} else {
	    				wishList.users.push(user);
	    			}	
	        	}

	    		return wishList.save().then(() => {
	    		    ctx.response.status = 200;	  
	    		    ctx.body = {status: 'success'}         
	    		});     	
	        });	 
		}
	)

module.exports = router;