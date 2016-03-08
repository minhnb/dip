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
		validator.wishLists(),
		ctx => {
			let longitude = ctx.request.body.longitude,
				latitude = ctx.request.body.longitude;

			return geocoder.reverse({lat:45.767, lon:4.833})
		    .then(function(res) {
		        console.log(res);
		        let user = ctx.state.user;
		        let wishlist = new db.wishLists({
		            user: user,
		            location: {
		            	city: res[0].administrativeLevels.level2long,
		            	state: res[0].administrativeLevels.level1long
		            } 
		        });
		        return wishlist.save().then(wishlist => {
		            ctx.response.status = 200;	  
		            ctx.body = {status: 'success'}         
		        });
		    })
		    .catch(function(err) {
		        ctx.throw(500, 'Geo Coder Error');
		    });
		}
	)
	
module.exports = router;