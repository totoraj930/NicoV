"use strict";
const electron = require("electron");
const ipc = electron.ipcRenderer;


var allows_request = true;
$(function() {
	setButtonListener();
	ipc.send("player-loadedWindow");
});

// 設定更新
ipc.on("player-updateSetting", function (event, setting) {
	$("#video")[0].volume = setting.volume;
	updateMode(setting.mode);
	if (!setting.show_menu) {
		$(".side").addClass("closed");
	}
});

// プレイリスト更新
ipc.on("player-updatePlaylist", function (event, playlist) {
	updatePlaylist(playlist);
});

// 動画更新
ipc.on("player-updateVideo", function (event, video) {
	$("#video")[0].src = video.url;
	setVideoListener();
});

// 現在位置更新
ipc.on("player-updateCurrent", function (event, current) {
	$("#playlist li p[data-num]").removeClass("active");
	$("#playlist li p[data-num]").each(function () {
		if ($(this).attr("data-num") == current) {
			$(this).addClass("active");
		}
	});
	var top = $("#playlist li p.active").parent().position().top;
	$(".side-main").animate({
		scrollTop: $(".side-main").scrollTop() + top - 60
	}, 150);
});

// 動画再生失敗
ipc.on("player-failedPlayVideo", function (event, error) {
	alert(`動画再生に失敗しました\n${error}`);
});
/*+
 * プレイリストを更新
 */
function updatePlaylist (playlist) {
	var li_html = "";
	for (let i=0; i < playlist.length; i++) {
		var title = playlist[i].title;
		li_html += `<li><p data-num="${i}">${title}</p></li>`;
	}
	$("#playlist").html(li_html);
	setPlaylistListener();
}

/**
 * プレイリストのリスナ登録
 */
function setPlaylistListener () {
	var target = $("#playlist li p[data-num]");
	target.off("click");
	target.on("click", function () {
		if ($(this).hasClass("active")) {
			return;
		}
		target.removeClass("active");
		$(this).addClass("active");
		var num = $(this).attr("data-num");
		allows_request = false;
		setTimeout(function () {allows_request = true}, 1000);
		ipc.send("player-playVideo", num);
	});
}

/**
 * ボタン関係のリスナ登録
 */
function setButtonListener () {
	$("#mode").on("click", toggleMode);
	$("#shuffle").on("click", shufflePlaylist);
	$("#show_main").on("click", function () {
		ipc.send("player-showMainWindow");
	});
	$("#close_side").on("click", function () {
		$(".side").addClass("closed");
		ipc.send("player-hideMenu");
	});
	$("#open_side").on("click", function () {
		$(".side").removeClass("closed");
		ipc.send("player-showMenu");
	});
}

/**
 * videoのリスナ登録
 */
function setVideoListener () {
	var target = $("#video");
	target.off();
	target.on({
		"canplay": function () {
//			$video[0].play();
		},
		"ended": function () {
			if (allows_request) {
				ipc.send("player-endedVideo");
			}
		},
		"error": function () {
			alert("動画の読み込みでエラーが発生しました");
		},
		"volumechange": function () {
			ipc.send("player-volumeChange", target[0].volume);
		}
	});
}

/**
 * プレイリストのシャッフルリクエスト
 */
function shufflePlaylist () {
	ipc.send("player-shufflePlaylist");
}

/**
 * 再生モードの切り替え
 */
function toggleMode () {
	var mode = $("#mode").attr("data-mode")-0;
	mode++;
	if (mode > 2 || mode < 0) {
		mode = 0;
	}
	$("#mode").attr("data-mode", mode);
	var text = "";
	switch (mode) {
		case 0:
			text = "通常再生";
			break;
		case 1:
			text = "全曲ループ";
			break;
		case 2:
			text = "1曲ループ";
			break;
	}
	$("#mode").text(text);
	ipc.send("player-modeChange", mode);
}

/**
 * 再生モードを更新する
 * @param {int} mode - 0~2
 */
function updateMode (mode) {
	if (mode < 0 || mode > 2) {
		return;
	}
	$("#mode").attr("data-mode", mode);
	var text = "";
	switch (mode) {
		case 0:
			text = "通常再生";
			break;
		case 1:
			text = "全曲ループ";
			break;
		case 2:
			text = "1曲ループ";
			break;
	}
	$("#mode").text(text);
}
