"use strict";
const electron = require("electron");
const ipc = electron.ipcRenderer;

$(function() {
	showSection("home");
	setMenuButtonListener();
	setButtonListener();
	ipc.send("main-loadedWindow");
});

// user_sessionの更新
ipc.on("main-updateUserSession", function (event, user_session) {
	$("#user_session").val(user_session);
});

// ログイン結果
ipc.on("main-login", function (event, result) {
	if (result) {
		$("#login-ok").show();
		$("#login-error").hide();
	}
	else {
		$("#login-error").show();
		$("#login-ok").hide();
	}
});

// マイリストグループの更新
ipc.on("main-updateMylistGroup", function (event, mylist_group) {
	showMenuMylistGroup(mylist_group);
});

/*
 * メニューボタンのリスナ登録
 */
function setMenuButtonListener () {
	var target = $(".button-list p[data-link]");
	target.off("click");
	target.on("click", function () {
		if ($(this).hasClass("active")) {
			return;
		}
		target.removeClass("active");
		$(this).addClass("active");
		showSection($(this).attr("data-link"));
		if ($(this).attr("data-list-id")) {
			showMylist($(this).attr("data-list-id"));
		}
	});
}

/*
 * マイリスト設定のマイリスト一覧のリスナ登録
 */
function setEditMylistGroupListener () {
	$("#edit_mylist_group").sortable("destroy").sortable({
		handle: ".move"
	});
	var target = $("#edit_mylist_group p[data-list-id] .i-x");
	target.off("click");
	target.on("click", function () {
		$(this).parent().parent().remove();
		setEditMylistGroupListener();
	});
}

/*
 * 設定関連のボタンのリスナ登録
 */
function setButtonListener () {
	$("#edit_mylist_group_add").on("click", addMylistGroup);
	$("#edit_mylist_group_save").on("click", saveEditMylistGroup);
	$("#login").on("click", login);
}

/*
 * 指定したsectionに切り替え
 * @param {String} section - 表示するsectionのdata-section
 */
function showSection (section) {
	$(".main-content").hide();
	$(`.main-content[data-section="${section}"]`).show();
	if (section == "setting-mylist") {
		showEditMylistGroup();
	}
};

/*
 * ログインリクエストをなげる
 */
function login () {
	var user_session = $("#user_session").val();
	if (!user_session) {
		alert("不正なuser_sessionです");
		return;
	}
	ipc.send("main-login", user_session);
}

/*
 * メニューのマイリスト一覧を表示する
 * @param {Array} mylist_group - [[id, name]...]
 */
function showMenuMylistGroup (mylist_group) {
	var li_html = "";
	for (let i=0; i < mylist_group.length; i++) {
		li_html += `
<li>
	<p data-link="mylist"
	data-list-id="${mylist_group[i][0]}" data-name="${mylist_group[i][1]}">
		${mylist_group[i][1]}
	</p>
</li>`;
	}
	$("#mylist_group").html(li_html);
	setMenuButtonListener();
}

/*
 * マイリスト設定のマイリスト一覧を表示する
 */
function showEditMylistGroup () {
	var mylist_group = getMylistGroup(),
		li_html = "";
	for (let i=0; i < mylist_group.length; i++) {
		li_html += `
<li><p data-list-id="${mylist_group[i][0]}" data-name="${mylist_group[i][1]}">
	<span class="move"></span>
	${mylist_group[i][1]}
	<span class="icon i-x"></span>
</p></li>`
	}
	$("#edit_mylist_group").html(li_html);
	setEditMylistGroupListener();
}

/*
 * マイリスト設定のマイリスト一覧を保存&適用する
 */
function saveEditMylistGroup () {
	var mylist_group = [];
	$("#edit_mylist_group p[data-list-id][data-name]")
		.each(function () {
		mylist_group.push([
			$(this).attr("data-list-id"),
			$(this).attr("data-name")
		]);
	});
	showMenuMylistGroup(mylist_group);
	ipc.send("main-saveMylistGroup", mylist_group);
}

/*
 * テキストボックスの内容のマイリストを追加する
 */
function addMylistGroup () {
	var id = $("#edit_mylist_group_id").val(),
		name = $("#edit_mylist_group_name").val();
	if (!id || !name || id.match(/[^A-Za-z0-9]+/)) {
		alert("不正な追加です");
		return;
	}
	$("#edit_mylist_group").append(`
<li><p data-list-id="${id}" data-name="${name}">
	<span class="move"></span>
	${name}
	<span class="icon i-x"></span>
</p></li>`);
	setEditMylistGroupListener();
	saveEditMylistGroup();
	$("#edit_mylist_group_id").val("");
	$("#edit_mylist_group_name").val("");
}

/*
 * 表示しているマイリスト一覧を返す
 * @return {Array}
 */
function getMylistGroup () {
	var mylist_group = [];
	$("#mylist_group p[data-list-id][data-name]").each(function () {
		mylist_group.push([
			$(this).attr("data-list-id"),
			$(this).attr("data-name")
		]);
	});
	return mylist_group;
}


