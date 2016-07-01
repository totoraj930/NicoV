"use strict";

// マイリスト表示リクエストの結果
ipc.on("main-showMylist", function (event, mylist) {
	if ($("#mylist").attr("data-id") == mylist.id) {
		updateMylistHtml(mylist);
	}
});

/*
 * マイリストの取得リクエストをなげる
 * @param {String} - マイリストID
 */
function showMylist (id) {
	$("#mylist_items .mylist-item").off("click");
	$("#mylist").attr("data-id", id);
	$("#mylist_title").text("読み込み中");
	$("#mylist_items").html("");
	$(".button-list").removeClass("active");
	$(`.button-list p[data-list-id="${id}"]`).addClass("active");
	ipc.send("main-showMylist", id);
}

/*
 * 表示中のマイリストを再読み込みする
 */
function reloadMylist () {
	var id = $("#mylist").attr("data-id");
	$("#mylist_title").text("読み込み中");
	$("#mylist_items").html("");
	ipc.send("main-showMylist", id, true);
}

/*
 * マイリストの再生リクエストをなげる
 * @param {String} - マイリストID
 * @param {ind} - 再生位置
 */
function playMylist (id, current) {
	console.log(id)
	ipc.send("main-playMylist", id, current);
}

/*
 * マイリストの表示を更新
 * @param {Object} - NicoMylist
 */
function updateMylistHtml (mylist) {
	var items = mylist.item,
		items_html = "";
	for (let i=0; i < items.length; i++) {
		var item = items[i],
			time = item.length_seconds;
		time = ~~(time/60)+":"+("0"+time%60).slice(-2);

		items_html +=`
<section data-num="${i}" data-id="${item.video_id}" class="mylist-item">
	<div class="thumb" style="background-image: url('${item.thumbnail_url}');">
		<p class="time">${time}</p>
	</div>
	<h1>${item.title}</h1>
</section>`;
	}
	$("#mylist_title").text(mylist.title);
	$("#mylist_items").html(items_html);
	$("#mylist_items .mylist-item").on("click", function () {
		var id = $("#mylist").attr("data-id"),
			current = $(this).attr("data-num");
		playMylist(id, current);
	});
}
