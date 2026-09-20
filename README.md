# 茲白虛擬棚 v0.2

## 啟動
Windows 雙擊 `start_windows.bat`；Mac / Linux 執行 `start_mac_linux.sh`（需要 Python 3）。
會自動打開導演台：http://localhost:8000/zibai-director.html
學生看的留言板：http://localhost:8000/zibai-board.html
第一次開需要網路（three.js、three-vrm、字型走 CDN）。

## 三層分開
| 層 | 放在哪 | 誰來改 |
|---|---|---|
| 場景層 | `scenes/<資料夾>/`（pocketvp.scene/1 場景包） | Scene Kit + GPT 產生，整包替換 |
| 角色層 | `characters/*.vrm` | VRoid 等工具，導演台「動作庫」分頁填路徑 |
| 互動層 | 留言物件、茲白行為、各場景的互動配置 | 導演台；劇本可匯出成 zibai-behavior.json |

## 換 / 新增場景
1. 用 Pocket VP Photo-to-Living Scene Kit 請 GPT 產出場景包（要有 SCENE_MANIFEST.json + scene.js）。
2. 解壓到 `scenes/新資料夾/`，不用改任何程式。
3. 導演台右上「場景」下拉就會出現；切過去後，在平面圖把茲白的家、學習牆、場記區拖到適合的位置。
   每個場景的互動配置各存一份，切回舊場景不會跑掉。
建議 GPT 在 sceneMeta 填 bounds 與 actorArea：bounds 決定平面圖範圍與鏡頭活動範圍，actorArea 決定新場景預設的「茲白的家」。

## 茲白的動作
- 內建程序動作：東張西望、揮手、點頭、伸懶腰、開心跳、思考、歡呼、鞠躬、害羞，外加走路。
- VRMA：導演台「動作庫」拖入 .vrma，存在這台電腦的瀏覽器（IndexedDB）。
- 新增程序動作：在 `zibai-actor.js` 的 POSES 加一個函式，並在 `zibai-behavior.js` 的 ACTIONS 登記名稱與秒數。
