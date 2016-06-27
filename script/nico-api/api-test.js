"use strict";
const NicoAPI = require("./nico-api");
const api = new NicoAPI();

api.setUserSession("user_session_30633604_cbd3eb0792d75026103737c8cb8c4d1d82abf2821c44cf960fa01bffccf03f38");

//api.getMylistGroup().then(function (result) {
//	console.log(result);
//}).catch(function (error) {
//	console.log(error);
//});

api.getMylist("55635929").then(function (result) {
	console.log(result);
}).catch(function (error) {
	console.log(error);
});

//api.getMylist("deflist").then(function (result) {
//	console.log(result);
//}).catch(function (error) {
//	console.log(error);
//});

//api.getVideoData("sm9").then(function (result)  {
//	console.log(result);
//}).catch(function (error) {
//	console.log(error);
//});

//api.getVideo("sm28668522").then(function (result) {
//	console.log(result);
//}).catch(function (error) {
//	console.log(error);
//});


