"use strict";

const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const storage = require("electron-json-storage");
const NVPlaylist = require("./nv-playlist");
const NicoAPI = require("../nico-api/nico-api");
const NicoObject = require("../nico-api/nico-object");
const app_package = require("../../package.json");

var NicoV = {},
	NVMain = {},
	NVPlayer = {},
	playlist = new NVPlaylist(),
	NApi = new NicoAPI();
NVMain.window = null;
NVPlayer.window = null;
NicoV.mylist_cache = {};
NicoV.setting = {};
NicoV.video_cache = {};


/**
 * メインウィンドウを生成します
 */
NVMain.createWindow = function () {
	if (NVMain.window) {
		NVMain.window.close();
	}
	var setting = NicoV.setting.main;
	NVMain.window = new BrowserWindow({
		width: setting.width,
		minWidth: 640,
		height: setting.height,
		minHeight: 600,
		x: setting.x,
		y: setting.y,
		resizable: true,
		title: app_package.name+" v"+app_package.version
	});
//	NVMain.window.setMenu(null);
	if (setting.maximized) {
		NVMain.window.maximize();
	}
	NVMain.window.loadURL(`file://${app.getAppPath()}/page/index.html`);
	NVMain.window.on("close", NVMain.closeAction);
	NVMain.window.on("closed", function () {
		NVMain.window = null;
	});
}

/**
 * メインウィンドウが閉じられたとき
 */
NVMain.closeAction = function () {
	var win = NVMain.window,
		setting = NicoV.setting.main;
	setting.x = win.getPosition()[0];
	setting.y = win.getPosition()[1];
	setting.maximized = win.isMaximized();
	if (!setting.maximized) {
		setting.width = win.getSize()[0];
		setting.height = win.getSize()[1];
	}
}

/**
 * プレイヤーウィンドウを生成します
 */
NVPlayer.createWindow = function () {
	if (NVPlayer.window) {
		NVPlayer.window.close();
	}
	var setting = NicoV.setting.player;
	NVPlayer.window = new BrowserWindow({
		width: setting.width,
		minWidth: 300,
		height: setting.height,
		minHeight: 120,
		x: setting.x,
		y: setting.y,
		resizable: true,
		title: app_package.name
	});
	NVPlayer.window.setMenu(null);
	if (setting.maximized) {
		NVPlayer.window.maximize();
	}
	NVPlayer.window.loadURL(`file://${app.getAppPath()}/page/player.html`);

	NVPlayer.window.on("close", NVPlayer.closeAction);
	NVPlayer.window.on("closed", function () {
		NVPlayer.window = null;
		playlist.clearPlaylist();
	});
}

/**
 * プレイヤーウィンドウが閉じられたとき
 */
NVPlayer.closeAction = function () {
	var win = NVPlayer.window,
		setting = NicoV.setting.player;
	setting.x = win.getPosition()[0];
	setting.y = win.getPosition()[1];
	setting.maximized = win.isMaximized();
	if (!setting.maximized) {
		setting.width = win.getSize()[0];
		setting.height = win.getSize()[1];
	}
}

/**
 * NicoV起動処理
 */
NicoV.start = function () {
	NicoV.loadSetting().then(function () {
		NVMain.createWindow(NicoV.setting.main);
	}).catch(function (error) {
		console.log(error);
	});
};


/**
 * 設定を読み込みます
 * @return {Promise}
 */
NicoV.loadSetting = function () {
	return new Promise(function (resolve, reject) {
		storage.get("setting", function (error, data) {
			if (error) {
				reject(error);
			}
			NicoV.setting =
				NicoV.generateSettingFromJson(data);
			NApi.setUserSession(NicoV.setting.user_session);
			playlist.modeChange(NicoV.setting.player.mode);
			resolve();
		});
	});
};


/**
 * 設定を保存します
 * @return {Promise}
 */
NicoV.saveSetting = function () {
	return new Promise(function (resolve, reject) {
		storage.set("setting", NicoV.setting,
			function (error) {
			if (error) reject(error);
			resolve();
		});
	})
}


/**
 * 渡されたjsonから設定を生成します
 * @param {Object} data - NicoV.loadSetting()を見て
 * @return {Object}
 */
NicoV.generateSettingFromJson = function (data) {
	var setting = {
		user_session: "",
		mylist_group: [],
		main: {
			width: 800,
			height: 600,
			x: 0,
			y: 0,
			maximized: false,
			last_section: "setting-account",
			last_mylist: "deflist"
		},
		player: {
			width: 600,
			height: 350,
			x: 0,
			y: 0,
			maximized: false,
			volume: 0.1,
			mode: 0,
			show_menu: true,
			menu_width: 350
		}
	};
	if (!data) return setting;
	// user_session
	var user_session = (data.user_session!==undefined)?
		data.user_session : setting.user_session;
	// mylist_group
	var mylist_group = (data.mylist_group!==undefined)?
		data.mylist_group : setting.mylist_group;
	// window
	var main = data["main"],
		player = data["player"];
	if (!main) main = setting.main;
	if (!player) player = setting.player;
	// main
	["width", "height", "x", "y", "maximized",
		"last_section", "last_mylist"].forEach(
		function (prop) {
		main[prop] = main.hasOwnProperty(prop)?
			main[prop] : setting.main[prop];
	});
	// player
	["width", "height", "x", "y", "maximized",
		"volume", "mode", "show_menu", "menu_width"].forEach(
		function (prop) {
		player[prop] = player.hasOwnProperty(prop)?
			player[prop] : setting.player[prop];
	});

	setting = {
		user_session: user_session,
		mylist_group: mylist_group,
		main: main,
		player: player
	}
	return setting;
}

/**
 * 動画を再生するのに必要な情報を取得する
 * playCurrentVideoから呼び出すこと
 * @return {Promise}
 */
function getCurrentVideo () {
	if (playlist.getCurrent() < 0) {
		return;
	}
	var current = playlist.getCurrent(),
		item = playlist.getPlaylist()[current];
	if (NicoV.video_cache.video_id == item.video_id) {
		return Promise.resolve(NicoV.video_cache);
	}
	var video_promise = NApi.getVideo(item.video_id);
	return new Promise(function (resolve, reject) {
		video_promise.then(function (result) {
			resolve(result);
		});
		video_promise.catch(function (err) {
			reject(err);
		});
	});
}


/**
 * タイムアウトしてから動画を再生
 */
var playTimeout = null;
function timeoutPlayCurrentVideo () {
	updatePlayerTitle();
	clearTimeout(playTimeout);
	playTimeout = setTimeout(playCurrentVideo, 200);
}

/**
 * プレイヤーのタイトルを更新
 */
function updatePlayerTitle () {
	if (playlist.getCurrent() < 0) {
		return;
	}
	var current = playlist.getCurrent(),
		item = playlist.getPlaylist()[current],
		webContents = NVPlayer.window.webContents;
	NVPlayer.window.setTitle(item.title+" - "+app_package.name);
	webContents.send("player-updateCurrent", current);
}

/**
 * 現在位置の動画を再生する
 */
function playCurrentVideo () {
	if (playlist.getCurrent() < 0) {
		return;
	}
	var current = playlist.getCurrent(),
		item = playlist.getPlaylist()[current];
	getCurrentVideo().then(function (result) {
		if (item.video_id != result.video_id) {
			return;
		}
		NicoV.video_cache = result;
		var cookie_1 = {url: "http://.nicovideo.jp", name: "user_session", value: NicoV.getUserSession},
			cookie_2 = {url: "http://.nicovideo.jp", name: "nicohistory", value: result["nicohistory"]},
			webContents = NVPlayer.window.webContents;
		webContents.session.cookies.set(cookie_1, function (error) {
			if (error) throw error;
		});
		webContents.session.cookies.set(cookie_2, function (error) {
			if (error) throw error;
		});
		webContents.send("player-updateVideo", result);
	}).catch(function (error) {
		var webContents = NVPlayer.window.webContents;
		webContents.send("player-failedPlayVideo", error);
		console.log(error);
	});
}


// アプリの準備ができたらスタート
app.on("ready", NicoV.start);

// ウィンドウがすべて閉じられたら終了
app.on("window-all-closed", function () {
	if (process.platform !== "darwin") {
		NicoV.saveSetting().then(function () {
			app.quit();
		}).catch(function (error) {
			console.log(error);
			app.quit();
		});
	}
});

// メインウィンドウの読み込み完了
ipcMain.on("main-loadedWindow", function (event) {
	event.sender.send("main-updateMylistGroup", NicoV.setting.mylist_group);
	event.sender.send("main-updateUserSession", NicoV.setting.user_session);
	event.sender.send("main-showSection", NicoV.setting.main.last_section,
		NicoV.setting.main.last_mylist);
	NApi.loginTest().then(function () {
		event.sender.send("main-login", true);
	}).catch(function () {
		event.sender.send("main-login", false);
	});
});

// user_sessionでログイン
ipcMain.on("main-login", function (event, user_session) {
	NicoV.setting.user_session = user_session;
	NApi.setUserSession(user_session);
	NicoV.saveSetting();
	NApi.loginTest().then(function () {
		event.sender.send("main-login", true);
	}).catch(function () {
		event.sender.send("main-login", false);
	});
	if (NVPlayer.window) {
		NVPlayer.window.close();
	}
});

// マイリスト一覧保存リクエスト
ipcMain.on("main-saveMylistGroup", function (event, mylist_group) {
	NicoV.setting.mylist_group = mylist_group;
	NicoV.saveSetting();
});

// マイリスト表示リクエスト
ipcMain.on("main-showMylist", function (event, id, reload) {
	NicoV.setting.main.last_mylist = id;
	if (!reload && NicoV.mylist_cache.hasOwnProperty(id)) {
		event.sender.send("main-showMylist", NicoV.mylist_cache[id]);
		return;
	}
	NApi.getMylist(id).then(function (result) {
		NicoV.mylist_cache[id] = result;
		event.sender.send("main-showMylist", result);
	}).catch(function (error) {
		var dummy_mylist = new NicoObject.mylist();
		dummy_mylist.title+=error;
		dummy_mylist.id = id;
		event.sender.send("main-showMylist", dummy_mylist);
	});
});

// sectionの切り替え通知
ipcMain.on("main-sectionChange", function (event, section_id) {
	NicoV.setting.main.last_section = section_id;
});

// 動画を再生
ipcMain.on("main-playVideo", function (event, id) {
	NApi.getVideoData(id).then(function (result) {
		playlist.setPlaylist([result]);
		playlist.playVideo(0);
		if (NVPlayer.window) {
			NVPlayer.window.show();
			NVPlayer.window.webContents.send("player-updatePlaylist", playlist.getPlaylist());
			updatePlayerTitle();
			playCurrentVideo();
		}
		else {
			NVPlayer.createWindow(NicoV.setting.player);
		}
	}).catch(function (error) {
		event.sender.send("main-failedPlayVideo", error.message);
		console.log(error);
	});

});

// マイリスト再生リクエスト
ipcMain.on("main-playMylist", function (event, id, current) {
	if (!NicoV.mylist_cache.hasOwnProperty(id)) {
		NApi.getMylist(id).then(function (result) {
			playlist.setPlaylist(result.item);
			playlist.playVideo(current);
			playlist.playVideo(current);
			if (NVPlayer.window) {
				NVPlayer.window.show();
				NVPlayer.window.webContents.send("player-updatePlaylist", playlist.getPlaylist());
				updatePlayerTitle();
				playCurrentVideo();
			}
			else {
				NVPlayer.createWindow(NicoV.setting.player);
			}
		}).catch(function (error) {
			console.log(error);
		});
		return;
	}
	playlist.setPlaylist(NicoV.mylist_cache[id].item);
	playlist.playVideo(current);
	if (NVPlayer.window) {
		NVPlayer.window.show();
		NVPlayer.window.webContents.send("player-updatePlaylist", playlist.getPlaylist());
		updatePlayerTitle();
		playCurrentVideo();
	}
	else {
		NVPlayer.createWindow(NicoV.setting.player);
	}
});


// プレイヤーウィンドウ読み込み完了
ipcMain.on("player-loadedWindow", function (event) {
	event.sender.send("player-updatePlaylist", playlist.getPlaylist());
	event.sender.send("player-updateSetting", {
		volume: NicoV.setting.player.volume,
		mode: NicoV.setting.player.mode,
		show_menu: NicoV.setting.player.show_menu
	});
	updatePlayerTitle();
	playCurrentVideo();
});

// 指定番号の動画を再生
ipcMain.on("player-playVideo", function (event, num, title) {
	playlist.playVideo(num);
	updatePlayerTitle();
	playCurrentVideo();
});


// 次の動画を再生
ipcMain.on("player-playNextVideo", function (event) {
	playlist.playNextVideo(true);
	updatePlayerTitle();
	timeoutPlayCurrentVideo();
});

// 前の動画を再生
ipcMain.on("player-playPrevVideo", function (event) {
	playlist.playPrevVideo(true);
	updatePlayerTitle();
	timeoutPlayCurrentVideo();
});

// 再生終了
ipcMain.on("player-endedVideo", function (event) {
	playlist.playNextVideo(false);
	updatePlayerTitle();
	playCurrentVideo();
});

// プレイリストのシャッフル
ipcMain.on("player-shufflePlaylist", function (event) {
	playlist.shufflePlaylist();
	event.sender.send("player-updatePlaylist", playlist.getPlaylist());
	event.sender.send("player-updateCurrent", playlist.getCurrent());
});

// ボリューム変更
ipcMain.on("player-volumeChange", function (event, volume) {
	NicoV.setting.player.volume = volume;
});

// 再生モード変更
ipcMain.on("player-modeChange", function (event, mode) {
	NicoV.setting.player.mode = mode;
	playlist.modeChange(mode);
});

// メニュー表示
ipcMain.on("player-showMenu", function (event) {
	NicoV.setting.player.show_menu = true;
});

// メニュー非表示
ipcMain.on("player-hideMenu", function (event) {
	NicoV.setting.player.show_menu = false;
});

// メインウィンドウを表示
ipcMain.on("player-showMainWindow", function (event, section_id) {
	if (NVMain.window) {
		NVMain.window.show();
	}
	else {
		NVMain.createWindow();
	}
});

module.exports = NicoV;
