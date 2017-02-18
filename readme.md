# NicoV

## これはなんですか？

ニコ動のマイリストを再生するために作られた簡易ニコ動プレイヤーです。

自分用です。

## 特徴

* わりと軽量
* Adobe Flash Player不要
  - 古いFLV形式の動画の場合はスマートフォン用のMP4を再生します
* 表示するマイリストの設定
* 再生モード
  - 通常, 全曲ループ, 1曲ループ
* プレイリストのシャッフル機能
* チャンネル動画対応(so23335421などのsoで始まるIDの動画)

## ダウンロード

[こちら](https://github.com/totoraj930/NicoV/releases)のページから最新のやつをどうぞ。

## 使い方

### 1. ログイン

アカウント設定からuser_sessionを使いログインしてください。

#### user_sessionの調べ方

ニコ動にログインします。

`http://www.nicovideo.jp`で下記のJavaScriptをコンソールから実行してください。

```javascript
document.getElementsByTagName("body")[0].innerHTML = document.cookie.match(/user_session=(.+?);/)[1];
```

表示された文字列がuser_sessionです。

全てコピーして貼り付けてください。


### 2. 表示するマイリストを設定

マイリスト設定から表示したいマイリストを追加してください

表示の解除, 並び替えなどが可能です。


### 3. マイリストを再生する

再生したいマイリストから動画をクリックするとプレイヤーウィンドウで再生が開始されます。


## 使用ライブラリ

* [Electron](http://electron.atom.io)
* [electron-packager](https://github.com/electron-userland/electron-packager)
* [electron-json-storage](https://github.com/jviotti/electron-json-storage/)
* [cheerio](https://github.com/cheeriojs/cheerio/)
* [jQuery](http://jquery.com/)
* [HTML5 Sortable](http://farhadi.ir/projects/html5sortable/)


## 著者(Author)
**Reona Oshima (totoraj)**
* [http://totoraj.net](http://totoraj.net/)
* [Twitter: @totoraj930](https://twitter.com/totoraj930/)


## ライセンス(License)
Copyright &copy; 2016 Reona Oshima (totoraj)  
This work is released  under the MIT License.  
<http://opensource.org/licenses/mit-license.php>
