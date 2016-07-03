"use strict";
const http = require("http");
const cheerio = require("cheerio");
const URLS = require("./nico-urls");
const NicoObject = require("./nico-object");
const NicoMylist = NicoObject.mylist;
const NicoVideo = NicoObject.video;

var NicoAPI = function () {
	this._user_session = "";
};

module.exports = NicoAPI;

/**
 * 現在のuser_sessionを取得する
 * @return {String}
 */
NicoAPI.prototype.getUserSession =
	function () {
	return this._user_session;
}


/**
 * user_sessionを設定する
 * @param {String} user_session - user_session
 */
NicoAPI.prototype.setUserSession =
	function (user_session) {
	this._user_session = user_session;
}


/**
 * ログインテスト
 * @param {Promise}
 */
NicoAPI.prototype.loginTest =
	function () {
	return this.getByHttp({
		hostname: "www.nicovideo.jp",
		port: 80,
		path: "/my/top/",
		method: "GET",
		headers: {
			"Cookie": "user_session="+this.getUserSession()
		}
	});
}


/**
 * 自分のマイリスト一覧を取得する
 * @return {Promise}
 */
NicoAPI.prototype.getMylistGroup =
	function () {
	var that = this;
	return new Promise (function (resolve, reject) {
		that.getByHttp({
			hostname: URLS.mylist.hostname,
			port: 80,
			path: URLS.mylist.mylistgroup,
			method: "GET",
			headers: {
				"Cookie": "user_session="+that.getUserSession()
			}
		}).then(function (result) {
			var json = JSON.parse(result.body);
			if (json["mylistgroup"]) {
				json["mylistgroup"].unshift({
					"id": "deflist",
					"name": "とりあえずマイリスト"
				});
				resolve(json["mylistgroup"]);
			}
			else {
				reject(new Error("getMylistGroup() - failed"));
			}
		}).catch(function (error) {
			reject(error);
		});
	});
};


/**
 * マイリストを取得する
 * @param {String} id - マイリストID
 * @return {Promise}
 */
NicoAPI.prototype.getMylist =
	function (id) {
	if (id == "deflist") {
		return this.getDefaultMylist();
	}
	else {
		return this.getNormalMylist(id);
	}
}


/**
 * 通常のマイリストを取得する
 * @param {String} id - マイリストID
 * @return {Promise}
 */
NicoAPI.prototype.getNormalMylist =
	function (id) {
	var that = this;
	return new Promise(function (resolve, reject) {
		that.getByHttp({
			hostname: URLS.mylist.hostname,
			port: 80,
			path: URLS.mylist.mylist_rss+id+"?rss=2.0",
			method: "GET",
			headers: {
				"Cookie": "user_session="+that.getUserSession()
			}
		}).then(function (result) {
			resolve(that.generateNicoMylistFromNormal(result.body));
		}).catch(function (error) {
			reject(error);
		});
	});
}


/**
 * とりあえずマイリストを取得する
 * @return {Promise}
 */
NicoAPI.prototype.getDefaultMylist =
	function () {
	var that = this;
	return new Promise(function (resolve, reject) {
		that.getByHttp({
			hostname: URLS.deflist.hostname,
			port: 80,
			path: URLS.deflist.path,
			method: "GET",
			headers: {
				"Cookie": "user_session="+that.getUserSession()
			}
		}).then(function (result) {
			var json = JSON.parse(result.body);
			resolve(that.generateNicoMylistFromDeflist(json));
		}).catch(function (error) {
			reject(error);
		});
	});
}


/**
 * とりあえずマイリストからNicoMylistを生成する
 * @param {Object} json - deflistのjson
 * @return {NicoMylist}
 */
NicoAPI.prototype.generateNicoMylistFromDeflist =
	function (json) {
	var mylist = new NicoMylist();
	mylist.id = "deflist";
	mylist.title = "とりあえずマイリスト";
	var items = json["mylistitem"];
	if (!items) return mylist;

	for (var i=0; i < items.length; i++) {
		var item = items[i];
		if (item["item_type"] != "0") continue;
		var data = items[i]["item_data"];
		var video = new NicoVideo();
		video.title = data.title;
		video.video_id = data.video_id;
		video.length_seconds = data.length_seconds;
		video.thumbnail_url = data.thumbnail_url;

		mylist.item.push(video);
	}
	return mylist;
}


/**
 * 通常のマイリストからNicoMylistを生成する
 * @param {String} rss - マイリストページのRSS
 * @return {NicoMylist}
 */
NicoAPI.prototype.generateNicoMylistFromNormal =
	function (rss) {
	var $ = cheerio.load(rss, {
		xmlMode: true
	});
	var mylist = new NicoMylist();

	var title = $("channel > title").text()
		.match(/^.+?\s(.+)\u2010[^\u2010]+?$/);
	if (!title || title.length-1 > 1) {
		mylist.title = "No title";
	}
	else {
		mylist.title = title[1];
	}
	mylist.description =
		($("channel > description").text().length === 0)
		? "" : $("channel > description").text();
	mylist.creator = $("channel > dc\\:creator").text();
	// 非公開なら終了
	if (!mylist.creator) {
		mylist.title = "このマイリストは非公開です";
		return mylist;
	}
	var id = $("channel > link").text().split("/");
	if (!id) return mylist;
	mylist.id = id.slice(-1)+"";

	var that = this;
	// マイリストアイテムを確認&追加
	$("channel > item").each(function (i, elem) {
		var item = $(this);
		var description = item.children("description").text();
		var video = new NicoVideo();
		video.title = item.children("title").text();
		video.video_id = item.children("link").text().split("/")[4];
		// ニコニコムービーメーカーの動画を除外
		if (video.video_id.match(/^nm/)) {
			return;
		}
		video.length_seconds = 0;
		var length_second =
			description.match(
				/<strong class="nico-info-length">([0-9|:]+?)<\/strong>/);
		if (length_second && length_second[1]) {
			length_second = length_second[1].split(":");
			length_second = (length_second[0]-0)*60+(length_second[1]-0);
			video.length_seconds = length_second;
		}
		video.thumbnail_url =
			description.match(
				/http:\/\/.+\.smilevideo\.jp\/smile\?i=[0-9]+/)[0];
		mylist.item.push(video);
	});
	return mylist;
}


/**
 * 動画情報を取得してNicoVideoで返す
 * @param {String} id - 動画ID
 * @return {Promise}
 */
NicoAPI.prototype.getVideoData =
	function (id) {
	var that = this;
	return new Promise(function (resolve, reject) {
		that.getByHttp({
			hostname: URLS.getthumbinfo.hostname,
			port: 80,
			path: URLS.getthumbinfo.path+id,
			method: "GET",
			headers: {
				"Cookie": "user_session="+that.getUserSession()
			}
		}).then(function (result) {
			var $ = cheerio.load(result.body, {
				xmlMode: true
			});
			var status =
				$("nicovideo_thumb_response").attr("status");
			if (status != "ok") {
				reject(new Error("getVideoData() - Status error"));
			}
			var video = new NicoVideo();
			video.video_id = id;
			video.title = $("title").text();
			video.length_seconds =
				$("length").text();
			video.length_seconds =
				video.length_seconds.split(":");
			video.length_seconds =
				(video.length_seconds[0]-0)*60+
				(video.length_seconds[1]-0);

			video.thumbnail_url = $("thumbnail_url").text();
			video.movie_type = $("movie_type").text();
			video.description = $("description").text();

			resolve(video);
		}).catch(function (error) {
			reject(error);
		});
	})
}


/**
 * 最適な方法で動画を再生するのに必要な情報を取得する
 * @param {String} id - 動画ID
 * @ return {Promise}
 */
NicoAPI.prototype.getVideo =
	function (id) {
	var that = this;
	return new Promise(function (resolve, reject) {
		var video;
		that.getVideoData(id).then(function (result) {
			video = result;
			if (result.movie_type == "mp4") {
				// mp4ならPC用
				return that.getNormalVideo(id);
			}
			else if (result.movie_type == "swf") {
				// swfだったら終了
				reject(new Error("swf形式の動画はサポートされていません"));
			}
			else {
				// それ以外ならスマホ用
				return that.getSmartVideo(id);
			}
		}).then(function (result) {
			video.url = result.url;
			video.nicohistory = result.nicohistory;
			resolve(video);
		}).catch(function (error) {
			reject(error);
		});
	});
}


/**
 * PC用の動画のURLとnicohistoryを取得する
 * @param {String} id - 動画ID
 * @ return {Promise}
 */
NicoAPI.prototype.getNormalVideo =
	function (id) {
	var that = this,
		id = id,
		cookie,
		options = {
			port: 80,
			method: "GET",
			headers: {
				"Cookie": "user_session="+this.getUserSession()
			}
		};

	return new Promise(function (resolve, reject) {
		options.hostname = URLS.video_page.hostname;
		options.path = URLS.video_page.path+id+"?watch_harmful=1";
		var redirect = false;
		that.getByHttp(options).then(function (result) {
			// チャンネル動画だと301が帰ってくるのでそっちの方を取得
			if (result.headers.hasOwnProperty("location")) {
				var location = result.headers["location"];
				id = location.split("/").slice(-1)[0].split("?")[0];
				options.path = URLS.video_page.path+id+"?watch_harmful=1";
				redirect = true;
				return that.getByHttp(options);
			}
			// 動画ページからnicohistoryを取得
			cookie = result.headers["set-cookie"]+"";
			cookie = cookie.match(/nicohistory=(.+?);/);
			if (!cookie || !cookie[1])
				return Promise.reject(new Error("`nicohistory` does not exist."));
			cookie = cookie[1];

		}).then(function (result) {
			if (!redirect) return;
			// 動画ページからnicohistoryを取得
			cookie = result.headers["set-cookie"]+"";
			cookie = cookie.match(/nicohistory=(.+?);/);
			if (!cookie || !cookie[1])
				return Promise.reject(new Error("`nicohistory` does not exist."));
			cookie = cookie[1];
		}).then(function () {
			// getflv
			options.hostname = URLS.getflv.hostname;
			options.path = URLS.getflv.path+id;
			return that.getByHttp(options);

		}).then(function (result) {
			// 全て完了
			var ret = {};
			ret.nicohistory = cookie;
			ret.url = result.body.match(/url=(.+?)&/);
			if (!ret.url || !ret.url[1]) {
				return Promise.reject(new Error("`video_url` does not exist."));
			}
			ret.url = decodeURIComponent(ret.url[1]);
			resolve(ret);
		}).catch(function (error) {
			reject(new Error("getNromalVideo() - "+error));
		});
	});
}


/**
 * スマホ用の動画のnicohistoryと動画URLを取得する
 * @param {String} video_id - 動画ID
 * @return {Promise}
 */
NicoAPI.prototype.getSmartVideo =
	function (id) {
	var that = this,
		id = id,
		options = {
			port: 80,
			method: "GET",
			headers: {
				"Cookie": "user_session="+this.getUserSession()
			}
		};

	return new Promise(function (resolve, reject) {
		options.hostname = URLS.sp_video_page.hostname;
		options.path = URLS.sp_video_page.path+id+"?watch_harmful=1";

		that.getByHttp(options).then(function (result) {
			// watch_api_url
			var watch_api_url =
				result.body.match(/data-watch_api_url="(.+?)"/);
			if (!watch_api_url || !watch_api_url[1]) {
				return Promise.reject(new Error("`watch_api_url` does not exist."));
			}
			watch_api_url = watch_api_url[1].replace(/&amp;/g, "&")
				.replace("http://", "").split("/");
			options.hostname = watch_api_url[0];
			watch_api_url.shift();
			options.path = "/"+watch_api_url.join("/");
			// idを一応watch_api_urlに合わせる
			id = watch_api_url.slice(-1)[0].split("?")[0];
			return that.getByHttp(options);

		}).then(function (result) {
			// watch_auth_key
			var json = JSON.parse(result.body);
			var watch_auth_key = json["watchAuthKey"];
			if (!watch_auth_key) {
				return Promise.reject(new Error("`watch_auth_key` does not exist."));
			}
			return watch_auth_key;

		}).then(function (watch_auth_key) {
			// getflv
			options.hostname = URLS.getflv.hostname;
			options.path = URLS.getflv.path+id
				+"&device=iphone3&watch_auth_key="+watch_auth_key;
			console.log(options.hostname+options.path);
			return that.getByHttp(options);

		}).then(function (result) {
			// 全て完了
			var ret = {};
			ret.nicohistory = result.headers["set-cookie"]+"";
			ret.nicohistory =
				ret.nicohistory.match(/nicohistory=(.+?);/);
			if (!ret.nicohistory || !ret.nicohistory[1]) {
				return Promise.reject(new Error("`nicohistory` does not exist."));
			}
			ret.nicohistory = ret.nicohistory[1];

			ret.url = (result.body+"").match(/url=(.+?)&/);
			if (!ret.url || !ret.url[1]) {
				return Promise.reject(new Error("`video_url` does not exist."));
			}
			ret.url = decodeURIComponent(ret.url[1]);

			resolve(ret);
		}).catch(function (error) {
			reject(new Error("getSmartVideo() - "+error));
		});
	});
}

/**
 * HTTPで取得する
 * @param {Object} options - httpリクエストオプション
 * @return {Promise}
 */
NicoAPI.prototype.getByHttp =
	function (options) {
	return new Promise(function (resolve, reject) {
		var req = http.request(options, function (res) {
			res.setEncoding("utf8");
			var body = "";
			if (res.statusCode < 200 || res.statusCode > 301) {
				reject(new Error(res.statusCode));
			}

			res.on("data", function (chunk) {
				body += chunk;
			});
			res.on("end", function () {
				resolve({
					headers: res.headers,
					body: body
				});
			});

		});

		req.on("error", function (error) {
			reject(error);
		});
		req.end();
	});
};


