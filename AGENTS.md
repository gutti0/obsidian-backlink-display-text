このプロジェクトはObsidianの拡張機能開発のためのもの

要求としては、ユニークノートの形式でファイル名を変更した際に、リンク名が変わってしまうのを修正する
具体的には、表示中ファイルのバックリンクのdisplay textを変更するというもの

仕様は以下
+ 表示中ファイルのバックリンクが対象
+ コマンドA コマンドを実行するとそのファイルの`title`プロパティのテキストでdisplay textを変更する。（存在済みでも置換）
+ コマンドB 対象リンクに既にdisplay textが設定されている場合は置換を行わない
+ コマンド成功後に置き換えた数をobsidian標準のトースト通知で表示する
+ display textに設定するための持ってくる値はデフォルトでは`title`プロパティで、設定で変更可能とする
+ もし対象プロパティが空であればその旨を通知する

メモはここに `obsidian.com vault=AI open file=AGENTS`, `obsidian.com vault=AI read`

デプロイはObsidian.com CLIを使用して、vault=TestObsidian を対象とする
