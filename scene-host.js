// scene-host.js — 讀取 Pocket VP 場景包（pocketvp.scene/1）。場景層只負責「棚長什麼樣」，不碰任何互動。
// 場景包放在 scenes/<資料夾>/，內容就是 Scene Kit + GPT 產出、可以直接拖進 Pocket VP 的那一包。
import * as THREE from 'three';

export async function listScenes(){
  const r = await fetch('./scenes/index.json', {cache: 'no-store'});
  if (!r.ok) throw Error('找不到 scenes/index.json（用 serve.py 啟動會自動產生）');
  return r.json();                                   // [{id, name, version, path}]
}

export async function loadScenePack(path){
  const base = new URL(path.endsWith('/') ? path : path + '/', location.href);
  const res = await fetch(new URL('SCENE_MANIFEST.json', base), {cache: 'no-store'});
  if (!res.ok) throw Error(`${path} 缺少 SCENE_MANIFEST.json`);
  const manifest = await res.json();
  if (manifest.schema !== 'pocketvp.scene/1') throw Error(`${path} 不是 pocketvp.scene/1 場景包`);
  const mod = await import(new URL(manifest.entry || 'scene.js', base).href);
  if (typeof mod.createScene !== 'function') throw Error(`${path} 的 ${manifest.entry} 沒有 export createScene`);
  // 貼圖由宿主載入、借給場景；場景只能 dispose 自己 clone 的那份
  const textures = {}, loader = new THREE.TextureLoader();
  for (const [slot, rel] of Object.entries(manifest.textures || {}))
    textures[slot] = await loader.loadAsync(new URL(rel, base).href).catch(() => null);
  const inst = mod.createScene({seed: manifest.seed ?? 1, textures, loopSeconds: manifest.loopSeconds ?? 32});
  if (!inst?.root) throw Error(`${path} 的 createScene 沒有回傳 root`);
  return {
    manifest, inst,
    meta: {...(mod.sceneMeta || {}), ...(inst.meta || {})},
    dispose(){ inst.dispose?.(); Object.values(textures).forEach(t => t?.dispose()); },
  };
}
