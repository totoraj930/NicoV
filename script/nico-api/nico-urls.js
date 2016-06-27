var NicoURLS = {
	deflist: {// とりあえずマイリスト
		hostname: "www.nicovideo.jp",
		path: "/api/deflist/list/"
	},
	mylist: {// マイリスト
		hostname: "www.nicovideo.jp",
		mylistgroup: "/api/mylistgroup/list",
		mylist_rss: "/mylist/"
	},
	getflv: {// 動画
		hostname: "flapi.nicovideo.jp",
		path: "/api/getflv?v="
	},
	getthumbinfo: {// 動画情報
		hostname: "ext.nicovideo.jp",
		path: "/api/getthumbinfo/"
	},
	video_page: {// 動画再生ページ
		hostname: "www.nicovideo.jp",
		path: "/watch/"
	},
	sp_video_page: {// スマホ動画再生ページ
		hostname: "sp.nicovideo.jp",
		path: "/watch/"
	}
};

module.exports = NicoURLS;
