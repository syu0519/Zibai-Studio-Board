// zibai-behavior.js — 茲白行為設定：常數、預設劇本、存取。棚內頁與導演台共用，不依賴 three.js。

export const BUS_NAME = 'zibai-director';          // BroadcastChannel 名稱
export const STORE_KEY = 'zibai-behavior-v1';      // localStorage key

// ── 場景層與互動層分開 ──
// 場景（scenes/<資料夾>/）是 Pocket VP 場景包（pocketvp.scene/1），用 Scene Kit + GPT 產生、可以整包替換。
// 互動配置（茲白的家、學習牆、場記區、站位）存在這份劇本裡，依場景 id 各存一份，換場景不會弄丟。
export const DEFAULT_SCENE = 'ltu-realtime-vfx-studio-v11';

const rotY = (x, z, a) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
// 場記板在「場記區」內的相對排法（以區域中心與朝向為基準）
const SLATE_BASE = {x: 3.4, z: -2.4, ry: -.43};
export const SLATE_OFFSETS = [[1.9,-3.4],[3.4,-4.3],[3.3,-2.4],[4.8,-3.2],[1.7,-1.4],[4.6,-1.3],[3.0,-0.3],[5.6,-4.6],[1.2,0.2],[4.2,0.9],[2.2,-5.2],[6.0,-2.2]]
  .map(([x, z]) => rotY(x - SLATE_BASE.x, z - SLATE_BASE.z, -SLATE_BASE.ry));
export function slateSpot(zone, k){
  const [ox, oz] = SLATE_OFFSETS[k % SLATE_OFFSETS.length];
  const [x, z] = rotY(ox, oz, zone.ry);
  return [zone.x + x, zone.z + z];
}
export const WALL_SIZE = {w: 3.4, h: 2.0, cy: 1.95};

// 以「茲白的家」為中心產生一份預設互動配置（嶺東攝影棚的家在 0,-4.8）
export function makeLayout(cx = 0, cz = -4.8){
  const o = (x, z) => ({x: +(cx + x).toFixed(2), z: +(cz + z + 4.8).toFixed(2)});
  return {
    wall: {...o(-4.3, -3.2), ry: .62},
    slates: {...o(SLATE_BASE.x, SLATE_BASE.z), ry: SLATE_BASE.ry},
    waypoints: [
      {id: 'home',      name: '茲白的家',   ...o(0, -4.8)},
      {id: 'front',     name: '台前',       ...o(0.2, -2.9)},
      {id: 'wallFront', name: '學習牆前',   ...o(-3.4, -2.2)},
      {id: 'slateSide', name: '場記區旁',   ...o(0.9, -2.4)},
      {id: 'back',      name: '後方',       ...o(-0.8, -6.6)},
    ],
  };
}
export function layoutFor(cfg, sceneId, center){
  cfg.layouts ??= {};
  if (!cfg.layouts[sceneId]) cfg.layouts[sceneId] = makeLayout(center?.[0] ?? 0, center?.[2] ?? 0);
  return cfg.layouts[sceneId];
}

export const ACTIONS = {
  lookAround: {name: '東張西望', dur: 4.2},
  wave:       {name: '揮手',     dur: 2.6, expr: 'happy'},
  nod:        {name: '點頭',     dur: 1.8},
  stretch:    {name: '伸懶腰',   dur: 3.4, expr: 'relaxed'},
  hop:        {name: '開心跳',   dur: 1.9, expr: 'happy'},
  think:      {name: '思考',     dur: 3.6},
  cheer:      {name: '歡呼',     dur: 2.6, expr: 'happy'},
  bow:        {name: '鞠躬',     dur: 2.4},
  shy:        {name: '害羞',     dur: 3.0, expr: 'relaxed'},
};
export const EXPRESSIONS = {happy: '開心', relaxed: '放鬆', surprised: '驚訝', sad: '難過', angry: '生氣', neutral: '平常'};
export const STEP_TYPES = {walk: '走到', face: '轉向', act: '做動作', say: '說話', expr: '表情', wait: '等待'};
export const LOOK_TARGETS = {camera: '觀眾（鏡頭）', event: '觸發的物件', wall: '學習牆', slates: '場記區'};
export const EVENTS = {
  enter:        {name: '有人進棚',       hint: '按下「進棚」、鏡頭推進後'},
  tapZibai:     {name: '被點了一下',     hint: '觀眾點茲白本人'},
  newMood:      {name: '新的心情光點',   hint: '有人放出光點'},
  newLearn:     {name: '新的學習便利貼', hint: '有人貼上學習牆'},
  newQuestion:  {name: '新的問題場記板', hint: '有人立起場記板'},
  teacherReply: {name: '老師回覆了問題', hint: '老師在後台回覆紅燈問題'},
  solved:       {name: '問題解決了',     hint: '發問者按「我懂了」'},
};

export const DEFAULT_BEHAVIOR = {
  version: 2,
  scene: DEFAULT_SCENE,
  character: 'characters/Amy102800.vrm',
  layouts: {[DEFAULT_SCENE]: makeLayout(0, -4.8)},
  idle: {
    gap: [3, 8],
    beats: [
      {name: '原地發呆', weight: 3, steps: [{do: 'act', action: 'lookAround'}]},
      {name: '跟觀眾打招呼', weight: 1, steps: [{do: 'face', to: 'camera'}, {do: 'say', text: '嗨～｜今天也來棚裡啦｜要不要留個心情？'}, {do: 'act', action: 'wave'}]},
      {name: '去學習牆看看', weight: 2, steps: [
        {do: 'walk', to: 'wallFront'}, {do: 'face', to: 'wall'}, {do: 'act', action: 'think'},
        {do: 'say', text: '大家今天學了好多東西耶｜這張我也要記起來'}, {do: 'act', action: 'nod'},
        {do: 'walk', to: 'home'}, {do: 'face', to: 'camera'}]},
      {name: '巡一下場記板', weight: 2, steps: [
        {do: 'walk', to: 'slateSide'}, {do: 'face', to: 'slates'}, {do: 'say', text: '有問題都可以立在這裡喔｜紅燈的我有幫你盯著'},
        {do: 'act', action: 'nod'}, {do: 'walk', to: 'home'}, {do: 'face', to: 'camera'}]},
      {name: '伸懶腰', weight: 1, steps: [{do: 'act', action: 'stretch'}, {do: 'say', text: '拍攝前先伸展一下～'}]},
      {name: '走到綠幕前', weight: 1, steps: [{do: 'walk', to: 'back'}, {do: 'act', action: 'lookAround'}, {do: 'walk', to: 'home'}, {do: 'face', to: 'camera'}]},
    ],
  },
  reactions: {
    enter:        [{do: 'face', to: 'camera'}, {do: 'say', text: '歡迎進棚！｜你來啦～'}, {do: 'act', action: 'wave'}],
    tapZibai:     [{do: 'face', to: 'camera'}, {do: 'say', text: '嘿嘿，被你發現了｜怎麼了嗎？｜不要一直戳我啦'}, {do: 'act', action: 'shy'}],
    newMood:      [{do: 'face', to: 'event'}, {do: 'say', text: '收到你的光了！'}, {do: 'act', action: 'hop'}, {do: 'face', to: 'camera'}],
    newLearn:     [{do: 'walk', to: 'wallFront'}, {do: 'face', to: 'wall'}, {do: 'say', text: '學到了！謝謝 {nick} 分享'}, {do: 'act', action: 'nod'}, {do: 'walk', to: 'home'}, {do: 'face', to: 'camera'}],
    newQuestion:  [{do: 'walk', to: 'event'}, {do: 'face', to: 'event'}, {do: 'say', text: '讓我看看這題…'}, {do: 'act', action: 'think'}, {do: 'walk', to: 'home'}, {do: 'face', to: 'camera'}],
    teacherReply: [{do: 'face', to: 'camera'}, {do: 'say', text: '老師回覆了！我去 LINE 通知 {nick}'}, {do: 'act', action: 'cheer'}],
    solved:       [{do: 'say', text: '解決了～太好了！'}, {do: 'act', action: 'cheer'}],
  },
};

export function loadBehavior(){
  try{
    const s = localStorage.getItem(STORE_KEY);
    if (s){ const c = JSON.parse(s); const m = migrate(c); if (m) return m; }
  }catch{}
  return structuredClone(DEFAULT_BEHAVIOR);
}
export function migrate(c){
  if (c?.version === 2 && c.layouts && c.idle && c.reactions) return c;
  if (c?.version === 1 && c.idle && c.reactions){          // v1：站位只有一份 → 搬到預設場景
    const d = structuredClone(DEFAULT_BEHAVIOR);
    d.idle = c.idle; d.reactions = c.reactions;
    if (c.waypoints) d.layouts[DEFAULT_SCENE].waypoints = c.waypoints;
    return d;
  }
  return null;
}
export function saveBehavior(cfg){ localStorage.setItem(STORE_KEY, JSON.stringify(cfg)); }

// VRMA 動作檔存在瀏覽器 IndexedDB（同一個網址底下的棚內頁、導演台都讀得到）
const DB = 'zibai-studio', ST = 'motions';
function openDB(){
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
function tx(mode, fn){
  return openDB().then(d => new Promise((res, rej) => {
    const t = d.transaction(ST, mode); const req = fn(t.objectStore(ST));
    t.oncomplete = () => res(req.result); t.onerror = () => rej(t.error);
  }));
}
export const motionsDB = {
  list: () => tx('readonly', s => s.getAllKeys()),
  get: (name) => tx('readonly', s => s.get(name)),
  put: (name, buf) => tx('readwrite', s => s.put(buf, name)),
  del: (name) => tx('readwrite', s => s.delete(name)),
};

// 說話文字：用「｜」分隔多句隨機挑一句，{nick}、{text} 會替換
export function fillLine(text = '', ctx = {}){
  const lines = text.split(/[｜|]/).map(s => s.trim()).filter(Boolean);
  const line = lines[Math.floor(Math.random() * lines.length)] || '';
  const short = (ctx.text || '').length > 14 ? ctx.text.slice(0, 13) + '…' : (ctx.text || '');
  return line.replaceAll('{nick}', ctx.nick || '你').replaceAll('{text}', short);
}
