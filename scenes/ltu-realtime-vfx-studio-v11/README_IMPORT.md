# 嶺東即時合成特效攝影棚 v1.1

依使用者提供的五張影像，以 Photo-to-Living Scene Kit v1.2 流程製作的完整 3D 場景。場景不含人物，保留中央表演空間；設備可展示動畫，也可由程式接管。這是照片參考式重建，不是現場掃描、廠商 CAD 或精密測繪。

## 直接匯入 Pocket VP

1. 開啟 Studio → AI / SCENE DROP，選取整個 `LTU_Realtime_VFX_Studio_v1.1.zip`。
2. 通過宿主正常信任確認後，場景卡應顯示「嶺東即時合成特效攝影棚 · LTU VFX Studio」和 ACTIVE。
3. 建議宿主：額外棚燈關閉、Environment Power 0.12、Exposure 1、Bloom 0.12、AO 關、Vignette 0、Contrast／Saturation 1。manifest 中的建議值不會自動套用。
4. 預設 32 秒循環；宿主可暫停、重置、關閉 Motion。請在室內運鏡，避免穿進設備、天花及牆體。

已測試 Pocket VP **0.3.7＋既有 FogFix**。原版 0.3.7 的 FogExp2.copy 匯入錯誤仍需之前的獨立 FogFix；本場景沒有改寫你的宿主。Three.js r171 由宿主提供，缺少的官方矩形面光源輔助模組已附於 vendor，可離線載入。

## 包含內容

- 棚體：估算 24×22×8.5 m；無縫弧形綠幕、綠地板、雙側木面走道、欄杆、天花格樑、追蹤標記、窗簾、空調、管線、門與綠箱。
- CamMate 參考式攝影搖臂：輪座、升柱、水平旋轉、俯仰、桁架、配重、拉索、保持水平的遙控頭、攝影機及遙控台。
- ARRI Orbiter 參考式燈具 ×2：藍銀燈體、光學口、U 型架、散熱鰭片、提把、天線、控制面板、三腳輪架、配電與線材。
- ARRI SkyPanel S60-C 參考式燈具 ×2：長方形發光面、框架、遮扉、散熱背板及燈架；另有三組關閉的天花柔光面。
- 即時合成工作站：六面監看螢幕、導播按鍵、T-bar、音訊推桿、鍵盤、機櫃、返送屏、設備箱和空椅。

螢幕是明確標示 DEMO 的原創示意畫面，沒有真人、真實視訊或設備連線。燈光由 GPU 實際渲染：四盞聚光燈可投影，矩形面光源提供柔光照明；不等於實際燈具的光度校準，也没有全局光照、鏡面反射現場幾何或照片等級材質。

## 虛擬角色操作的完成範圍

已提供並測試：關節控制 API、九個操作站的站位／雙手握點、角色接線器，以及可供外部角色骨架使用的簡易雙臂 CCD IK。包內沒有角色模型。

**原生 Scene Drop 不會自動把 VRM 接到這些接口。** 實際角色需要按 `OPERATOR_INTEGRATION.md` 接入宿主、提供骨架，並校準比例、站位及握姿。本次驗證了數學骨架的 IK 收斂，沒有用你的實際 VRM 驗證全身動作。手指、走路、碰撞、肘部關節限制與道具抓取物理未包含。

## 檔案

`scene.js` 是入口；`room.js` 與 `equipment.js` 分別建置建築／設備；`operator-binding.js` 與 `bone-operator-driver.js` 提供角色接線。不要單獨只丟 scene.js，請保留整個 ZIP 的相對路徑。

`SCENE_MANIFEST.json` 為宿主設定；`SCENE_SPEC.json`、`CAMERA_SHOTS.json`、`SCENE_DESCRIPTION.md`、`PHOTO_ANALYSIS.md` 為製作及取景說明。`TEST_REPORT.md` 和 `QA_RESULTS.json` 為實測紀錄。

preview、wide、reverse、ceiling、設備近景與 pocket-vp-render 等 PNG 都是程式真實渲染，不是 AI 概念圖。`crane-camera.png` 是從搖臂鏡頭錨點渲染的無人物綠幕畫面。

場景是 session-local，重開宿主需重新匯入。Blender 不能直接載入本 JS 包；未附 Blender 工程或 GLB。

## 本版新增

請先閱讀 LIGHTING_AND_ATMOSPHERE.md：天花燈關閉、雙側後方逆光、可調薄霧光束、650 顆 GPU 塵點、慢速光斑。參數 haze / dust / rimDimmer 可用既有 API 控制。
