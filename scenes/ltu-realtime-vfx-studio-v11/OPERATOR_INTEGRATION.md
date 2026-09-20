# 設備控制與虛擬角色接線

## 可直接執行的場景接口

工廠回傳 `{root, meta, update, dispose, api}`，並匯出 `bindOperator`、`createBoneOperatorDriver`。原版 Pocket VP 0.3.7 保留工廠實例，但沒有自動建立設備控制 UI、角色 IK 或相機接管。以下代码是宿主整合範例，需要放在持有場景實例的程式中；不是貼進對話或 manifest 就會生效。

```js
// instance = createScene(...) 的回傳值
instance.api.setState({craneYaw: 15, cranePitch: 18, headPan: -12, headTilt: -15});
instance.api.setState({orbiterTilt: 25, orbiterDimmer: 0.8, skyPanelDimmer: 1, warmth: 0.2});
// 任一手動設定預設會退出 demo，後續 update(t) 不覆寫它。
instance.api.setState({demo: true});
instance.api.reset();
```

| 控制 | 範圍／單位 |
|---|---|
| craneYaw | −28～28 度 |
| cranePitch | 4～24 度 |
| headPan | −65～65 度 |
| headTilt | −40～35 度 |
| orbiterTilt | 0～55 度，兩燈共同控制 |
| orbiterDimmer | 0～1.5，兩燈共同倍率 |
| skyPanelDimmer | 0～1.5，兩台落地面燈共同倍率，不含天花燈 |
| warmth | 0～1，所有可控燈的視覺暖色插值，非校準 CCT |
| demo | boolean |

值超出範圍會夾限，未知欄位或 NaN 會拒絕整次設定。reset 重設控制，宿主時間軸是否重設仍由宿主負責。

## 操作站與座標

`api.listStations()`：crane-console、crane-tail、orbiter-key、orbiter-fill、skypanel-left、skypanel-right、tripod-camera、switcher、audio。

`api.getInteractionPose(id)` 回傳 feet、leftHand、rightHand，各含世界座標 position `[x,y,z]` 與 quaternion `[x,y,z,w]`。feet 是角色根節點的建議落地姿態；leftHand／rightHand 是握點，並不是已經驅動的骨骼。移動整個設備群組後重新查詢，世界座標也會更新。

## 接入既有手部 IK

```js
const binding = bindOperator(instance, {
  setRootPose(pose) { myAvatarController.placeAtWorldPose(pose); },
  setHandTargets({left, right}) { myIK.setWorldTargets(left, right); },
  release() { myIK.clearTargets(); }
}, 'crane-console');

binding.command({craneYaw: 8, cranePitch: 16});
// 每幀：先 instance.update(t)，再 binding.sync()。
binding.sync();
// 使用者離開操作台時：
binding.disconnect();
```

`myAvatarController`、`myIK` 是明確的宿主占位名稱，不是 Pocket VP 現有 API。

## 使用本包簡易雙臂 IK

無既有手部 IK 時，可使用附帶的 `createBoneOperatorDriver`。傳入角色 root 及六根手臂骨骼，勿傳 mesh。骨骼已有的 local position 決定臂長；根節點須以腳底為原點，否則設定 rootOffset。

```js
const driver = createBoneOperatorDriver({
  avatarRoot: myAvatarRoot,
  bones: {
    leftUpperArm, leftLowerArm, leftHand,
    rightUpperArm, rightLowerArm, rightHand
  },
  rootOffset: [0, 0, 0], iterations: 24
});
const binding = bindOperator(instance, driver, 'crane-console');
binding.command({craneYaw: 12, cranePitch: 16});
// 在宿主正常姿勢／動畫求值之後同步，避免其他動畫覆寫手臂。
binding.sync();
console.log(driver.errors); // 雙手位置誤差，單位公尺
```

驅動器使用 CCD 旋轉上臂／前臂去追蹤手腕位置，不包含手指握拳、手腕朝向校準、肘部限制、腳步、碰撞或全身平衡。超出角色可達範圍時會留下誤差，不會拉長手臂。disconnect 恢復初始化時的手臂旋轉，但不把角色傳回先前位置。請先用角色本身驗證握姿；本包只有以無網格測試骨架驗證求解器，沒有捆綁或測試特定 VRM。

## 讓宿主使用搖臂鏡頭

```js
const pose = instance.api.getCameraPose();
renderCamera.position.fromArray(pose.position);
renderCamera.quaternion.fromArray(pose.quaternion);
renderCamera.fov = pose.fov;
renderCamera.updateProjectionMatrix();
```

回傳姿態遵循 Three.js 相機 local −Z 視線。要先暫停宿主 OrbitControls／手機追蹤對該相機的覆寫，再由相機模式切換功能接入。本包不自動搶占宿主攝影機，也不改 WebRTC。`crane-camera.png` 是這個錨點的實際驗證畫面。

## Pocket VP 0.3.7 的整合位置

本次查核的 `public/js/studio.js` 在 `activateAiScene` 建立 `activeAiInstance`，在 `updateAiSceneMotion` 呼叫 update。可由宿主擴充的操作 UI 呼叫 `activeAiInstance.api.setState`，並在每幀角色動畫完成後呼叫綁定的 sync。API 是新增場景能力，不要假設既有 VRM 面板已提供按鈕。

卸載前先 binding.disconnect，再呼叫場景 dispose；重新匯入後重新建立 binding。不要保存舊場景的骨骼／握點參照。

若在已查核的 0.3.7 模組作用域內擴充，可如此取得目前選取的 VRM 骨骼（仍須自行新增觸發按鈕和解除綁定流程）：

```js
const vrm = avatarSlots.get(selectedAvatarId)?.vrm;
const sceneModule = aiSceneRecord()?.module;
if (!vrm || !activeAiInstance?.api) throw new Error('先載入角色與本場景');
const names = ['leftUpperArm','leftLowerArm','leftHand',
               'rightUpperArm','rightLowerArm','rightHand'];
const bones = Object.fromEntries(names.map(name =>
  [name, vrm.humanoid.getNormalizedBoneNode(name)]));
const driver = sceneModule.createBoneOperatorDriver({avatarRoot: vrm.scene, bones});
const operatorBinding = sceneModule.bindOperator(activeAiInstance, driver, 'crane-console');
```

使用 normalized bones 時，應先完成一般角色姿勢求值，再 `operatorBinding.sync()`，然後才執行該 VRM 的 `update(dt)`，讓 normalized pose 正常傳到渲染骨架。不要讓同一手臂同時由持續輸入的動捕與 IK 互相覆寫。上述為依本地接口編寫的接線範例，未對使用者實際角色完成驗證，也未擅自修改宿主。
