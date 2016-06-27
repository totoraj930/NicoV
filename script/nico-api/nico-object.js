var NicoMylist = function () {
	this.title = "";
	this.creator = "";
	this.description = "";
	this.item = [];
	this.id = "";
};

var NicoVideo = function () {
	this.title = "";
	this.video_id = "";
	this.length_seconds = "";
	this.thumbnail_url = "";

	this.movie_type = "";
	this.description = "";

	this.nicohistory = "";
	this.url = "";
};

module.exports = {
	mylist: NicoMylist,
	video: NicoVideo
};
