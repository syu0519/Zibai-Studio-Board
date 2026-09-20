# v1.1 實測結果

Pocket VP 0.3.7 + FogFix：ZIP 匯入 ACTIVE；暫停、重置、場景切換返回通過。無模組／shader 錯誤與外部資源請求。

瀏覽器 WebGL 實測：NVIDIA RTX 2070，1280×800，180 影格運鏡。中位 16.7 ms，p95 16.8 ms；完整繪製含陰影與後製 614–692 calls。此結果不是其他硬體或解析度的幀率保證。

229126 個幾何三角形、293 個 Mesh。五次重建前後皆為 185 geometries、23 textures。共用借用貼圖未被銷毀。

32 秒循環、相同種子、跳時、無累積漂移、reduced motion、手動控制穩定、原子錯誤拒絕、數值限幅、相機錨點、九站手部錨點與角色接線通過。合成骨架雙臂 IK 誤差約 1.7 mm；未驗證使用者實際 VRM。

氣氛專項：650 粒 GPU 塵點；shader 循環與 reduced motion 通過；逆光／霧／塵可全關；三組天花面光強度均為零。詳見 ATMOSPHERE_QA.json。

八個固定鏡位與連續室內運鏡已渲染。preview.png 及設備近景為真實 WebGL 輸出。沒有測試真人手機合成的霧深度或照片級品質；氣氛技術限制見 LIGHTING_AND_ATMOSPHERE.md。
