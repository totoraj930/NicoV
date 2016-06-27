"use strict";
var Playlist = function () {
	// プレイリスト([NicoVideo, ...])
	this._playlist = [];
	// 現在位置
	this._current = -1;
	// 0: 通常, 1: 全曲ループ, 2: 1曲ループ
	this._play_mode = 0;
}
module.exports = Playlist;

/**
 * 指定した番号の動画を再生
 * @param {int} num - 動画の番号
 * @return {int}
 */
Playlist.prototype.playVideo =
	function (num) {
	if (!this._playlist[num]) return -1;
	this._current = num;
	return this._current;
}

/**
 * 次の動画を再生
 * @param {Boolean} forcing - 強制的に動画を再生するか(ボタン操作の場合はtrue)
 * @return {int}
 */
Playlist.prototype.playNextVideo =
	function (forcing) {
	if (this._playlist.length <= 0) {
		// プレイリストに動画がなければ終了
		return -1;
	}
	else if (forcing) {
		// 強制移動
		if (++this._current >= this._playlist.length) {
			this._current = 0;
		}
		return this._current;
	}
	else if (this._play_mode == 2) {
		// 1曲ループ
		return this._current;
	}
	else {
		// 通常&全曲ループ
		if (++this._current >= this._playlist.length) {
			// 全曲ループなら最初に戻す
			if (this._play_mode == 1) this._current = 0;
			// 通常なら終了
			else this._current = -1;
		}
		return this._current;
	}
	return -1;
}

/**
 * 前の動画を再生
 * @param {Boolean} forcing - 強制的に動画を再生するか(ボタン操作の場合はtrue)
 * @return {int}
 */
Playlist.prototype.playPrevVideo =
	function (forcing) {
	if (this._playlist.length <= 0) {
		// プレイリストに動画がなければ終了
		return -1;
	}
	else if (forcing) {
		// 強制移動
		if (--this._current < 0) {
			this._current = this._playlist.length-1;
		}
		return this._current;
	}
	else if (this._play_mode == 2) {
		// 1曲ループ
		return this._current;
	}
	else {
		// 通常&全曲ループ
		if (--this._current < 0) {
			// 全曲ループなら最後に戻す
			if (this._play_mode == 1) this._current = this._playlist.length-1;
			// 通常なら終了
			else this._current = -1;
		}
		return this._current;
	}
	return -1;
}


/**
 * 現在位置を取得
 * @return {int}
 */
Playlist.prototype.getCurrent =
	function () {
	return this._current;
}

/**
 * プレイリストを取得
 * @return {Array}
 */
Playlist.prototype.getPlaylist =
	function () {
	return this._playlist;
}

/**
 * プレイリストを設定
 * @param {Array} playlist - NicoVideoの入った配列
 * @return {Boolean}
 */
Playlist.prototype.setPlaylist =
	function (playlist) {
	if (!Array.isArray(playlist)) return false;

	this._playlist = [];
	// NicoVideoは同じものを使って配列だけを新しく生成
	// これで配列を並べ替えても問題ない
	for (var i=0; i < playlist.length; i++) {
		this._playlist.push(playlist[i]);
	}
	this._current = -1;
	return true;
}

/**
 * プレイリストをクリアする
 */
Playlist.prototype.clearPlaylist =
	function () {
	this._playlist = [];
	this._current = -1;
}

/**
 * プレイリストをシャッフル
 */
Playlist.prototype.shufflePlaylist =
	function () {
	var n = this._playlist.length,
		now = this._playlist[this._current],
		playing = this._current >= 0,
		t, i;
	if (playing) {
		this._playlist.splice(this._current, 1);
		n--;
	}
	while (n) {
		i = Math.floor(Math.random() * n--);
		t = this._playlist[n];
		this._playlist[n] = this._playlist[i];
		this._playlist[i] = t;
	}
	if (playing) {
		this._playlist.unshift(now);
		this._current = 0;
	}
}

/**
 * 再生モードを変更する
 * @param {int} mode - 再生モード(0~2)
 * @return {Boolean}
 */
Playlist.prototype.modeChange =
	function (mode) {
	if (mode >= 0 && mode <= 2) {
		this._play_mode = mode;
		return true;
	}
	return false;
}

