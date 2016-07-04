"use strict";

const router = require('koa-router')();

var geocoderProvider = 'google';
var httpAdapter = 'http';

const geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');
const validator = require('../../validators');

const dipErrorDictionary = require('../../constants/dipErrorDictionary');
const DIPError = require('../../helpers/DIPError');

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
		    		// ctx.throw(400, 'Geo error');
					throw new DIPError(dipErrorDictionary.GEO_ERROR);
		    	}        
		    })
		    .then(wishList => {
	        	if(!wishList) {
					var wishList = new db.wishList({
					    location: location,
					    status: 'open'
					});	
					wishList.users.addToSet(user);
	        	} else {
	        		wishList.users.addToSet(user);
	        	}

	    		return wishList.save().then(() => {
	    		    ctx.response.status = 200;	  
	    		    ctx.body = {status: 'success'}         
	    		});     	
	        });	 
		}
	)

module.exports = router;