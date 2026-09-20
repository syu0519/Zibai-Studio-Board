// zibai-actor.js — 茲白的身體：程序動畫、走路、行程排程、VRMA 播放
import * as THREE from 'three';
import {createVRMAnimationClip} from '@pixiv/three-vrm-animation';
import {ACTIONS, EVENTS, DEFAULT_BEHAVIOR, fillLine} from './zibai-behavior.js';

const ease = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const CH = ['armL','armR','fwdL','fwdR','foreUpL','foreUpR','bendL','bendR','legL','legR','kneeL','kneeR',
            'spineFwd','spineTwist','spineSide','neckFwd','headYaw','headPitch','headRoll','hipsYaw','bodyY'];
const WALK_SPEED = .95, STRIDE = 1.1, TURN_SPEED = 4;

// 動作以「語意通道」描述（手臂抬高、往前、手肘彎…），載入模型時自動校正骨架軸向，所以 VRM0 / VRM1 都能用
const L = (c, w, k, v) => { c[k] += (v - c[k]) * w; };
const POSES = {
  lookAround(c, t, w){ c.headYaw += Math.sin(t * 1.3) * .55 * w; c.headPitch += (Math.sin(t * .9) * .08 - .04) * w; c.spineTwist += Math.sin(t * 1.3) * .12 * w; },
  wave(c, t, w){ L(c, w, 'armR', -.05); L(c, w, 'foreUpR', 1.5 + Math.sin(t * 11) * .35); L(c, w, 'bendR', 0); L(c, w, 'fwdR', 0); c.headRoll += .1 * w; c.spineSide += .04 * w; },
  nod(c, t, w){ c.headPitch += Math.max(0, Math.sin(t * 7.5)) * .28 * w; c.neckFwd += .05 * w; },
  stretch(c, t, w){ for (const s of ['L','R']){ L(c, w, 'arm' + s, 1.3); L(c, w, 'foreUp' + s, .2); L(c, w, 'bend' + s, 0); L(c, w, 'fwd' + s, 0); }
    c.spineFwd -= .14 * w; c.headPitch -= .22 * w; c.spineSide += Math.sin(t * 1.6) * .08 * w; },
  hop(c, t, w){ const j = Math.abs(Math.sin(t * Math.PI * 2.2)); c.bodyY += j * .1 * w;
    for (const s of ['L','R']){ L(c, w, 'arm' + s, -.8); L(c, w, 'bend' + s, 1.1); L(c, w, 'fwd' + s, .25); c['knee' + s] += (1 - j) * .22 * w; c['leg' + s] += (1 - j) * .11 * w; }
    c.headRoll += Math.sin(t * 6) * .08 * w; },
  think(c, t, w){ L(c, w, 'armR', -1.05); L(c, w, 'fwdR', .55); L(c, w, 'bendR', 2.1); L(c, w, 'armL', -1.15); L(c, w, 'fwdL', .3); L(c, w, 'bendL', 1.3);
    c.headRoll += .16 * w; c.headPitch += .06 * w; c.headYaw += Math.sin(t * .8) * .1 * w; },
  cheer(c, t, w){ const k = Math.sin(t * 9); L(c, w, 'armL', 1.05 + k * .12); L(c, w, 'armR', 1.05 - k * .12);
    for (const s of ['L','R']){ L(c, w, 'foreUp' + s, .35); L(c, w, 'bend' + s, 0); L(c, w, 'fwd' + s, 0); }
    c.bodyY += Math.abs(Math.sin(t * Math.PI * 2)) * .05 * w; c.headPitch -= .12 * w; },
  bow(c, t, w){ const k = ease(t / .6) * ease((ACTIONS.bow.dur - t) / .6); c.spineFwd += .6 * k * w; c.neckFwd += .15 * k * w; L(c, w, 'fwdL', .2); L(c, w, 'fwdR', .2); },
  shy(c, t, w){ c.headPitch += .22 * w; c.headRoll += .14 * w; c.headYaw -= .2 * w;
    for (const s of ['L','R']){ L(c, w, 'fwd' + s, .45); L(c, w, 'bend' + s, 1.2); L(c, w, 'arm' + s, -1.3); }
    c.spineSide += Math.sin(t * 2.2) * .05 * w; },
};

export function createActor({root, camera, lookTarget, resolvePoint, resolveLook, onSay}){
  let vrm = null, S = null, mixer = null;
  const clipCache = new Map(); let motions = new Map();
  let config = DEFAULT_BEHAVIOR;
  let seq = null; const queue = [];
  let idleWait = 3, lastBeat = -1;
  const loco = {blend: 0, phase: 0, moving: false, speed: 0};
  let act = null, clip = null, exprOverride = null;
  const expr = {};
  let lookPoint = null;                   // null = 看鏡頭
  const smoothLook = new THREE.Vector3(0, 1.4, 5);
  let doing = '待機';

  /* ── 骨架校正 ── */
  function calibrate(){
    const h = vrm.humanoid, N = (n) => h.getNormalizedBoneNode(n);
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
    const up = new THREE.Vector3(0, 1, 0);
    const probe = (setup, bone, axis, tip, dir) => {
      if (!N(bone) || !N(tip)) return 1;
      h.resetNormalizedPose(); setup?.(); root.updateMatrixWorld(true);
      const a = N(tip).getWorldPosition(new THREE.Vector3());
      N(bone).rotation[axis] += .4; root.updateMatrixWorld(true);
      const b = N(tip).getWorldPosition(new THREE.Vector3());
      return Math.sign(b.sub(a).dot(dir)) || 1;
    };
    S = {};
    for (const [s, n] of [['L','left'],['R','right']]){
      S['arm' + s] = probe(null, n + 'UpperArm', 'z', n + 'LowerArm', up);
      const down = () => { N(n + 'UpperArm').rotation.z = -S['arm' + s] * 1.2; };
      S['fwd' + s] = probe(down, n + 'UpperArm', 'x', n + 'LowerArm', fwd);
      S['foreUp' + s] = probe(null, n + 'LowerArm', 'z', n + 'Hand', up);
      S['bend' + s] = probe(down, n + 'LowerArm', 'y', n + 'Hand', fwd);
      S['leg' + s] = probe(null, n + 'UpperLeg', 'x', n + 'LowerLeg', fwd);
      S['knee' + s] = -probe(null, n + 'LowerLeg', 'x', n + 'Foot', fwd);
    }
    S.spine = probe(null, 'spine', 'x', 'neck', fwd);
    S.neck = probe(null, 'neck', 'x', 'head', fwd);
    h.resetNormalizedPose();
  }
  function applyChannels(c){
    const h = vrm.humanoid;
    const add = (n, ax, v) => { const b = h.getNormalizedBoneNode(n); if (b) b.rotation[ax] += v; };
    for (const [s, n] of [['L','left'],['R','right']]){
      add(n + 'UpperArm', 'z', S['arm' + s] * c['arm' + s]);
      add(n + 'UpperArm', 'x', S['fwd' + s] * c['fwd' + s]);
      add(n + 'LowerArm', 'z', S['foreUp' + s] * c['foreUp' + s]);
      add(n + 'LowerArm', 'y', S['bend' + s] * c['bend' + s]);
      add(n + 'UpperLeg', 'x', S['leg' + s] * c['leg' + s]);
      add(n + 'LowerLeg', 'x', S['knee' + s] * c['knee' + s]);
    }
    add('spine', 'x', S.spine * c.spineFwd); add('spine', 'y', c.spineTwist); add('spine', 'z', c.spineSide);
    add('neck', 'x', S.neck * c.neckFwd);
    add('head', 'y', c.headYaw); add('head', 'x', S.neck * c.headPitch); add('head', 'z', c.headRoll);
    add('hips', 'y', c.hipsYaw);
    vrm.scene.position.y = c.bodyY;
  }
  function basePose(t){
    const c = Object.fromEntries(CH.map(k => [k, 0]));
    const br = Math.sin(t * 1.7);
    c.armL = c.armR = -1.2 + br * .015; c.bendL = c.bendR = .25; c.fwdL = c.fwdR = .05;
    c.spineSide = Math.sin(t * .45) * .025; c.spineFwd = br * .01; c.hipsYaw = Math.sin(t * .3) * .04; c.headRoll = Math.sin(t * .37) * .03;
    return c;
  }
  function walkLayer(c, w){
    if (w <= .001) return;
    const s = Math.sin(loco.phase), co = Math.cos(loco.phase);
    c.legL += s * .42 * w; c.legR -= s * .42 * w;
    c.kneeL += (.08 + .75 * Math.max(0, co)) * w; c.kneeR += (.08 + .75 * Math.max(0, -co)) * w;
    c.fwdL -= s * .3 * w; c.fwdR += s * .3 * w; c.bendL += .15 * w; c.bendR += .15 * w;
    c.spineTwist += s * .07 * w; c.bodyY += (Math.abs(co) - .7) * .04 * w; c.headRoll *= 1 - w;
  }

  /* ── 動作 ── */
  function startAct(id, times = 1){
    if (!id) return;
    if (id.startsWith('vrma:')) return playClip(id.slice(5), times);
    if (!ACTIONS[id]) return;
    act = {id, t: 0, dur: ACTIONS[id].dur * Math.max(1, times)};
  }
  function playClip(name, times){
    const anim = motions.get(name); if (!anim || !vrm) return;
    let c = clipCache.get(name);
    if (!c){ c = createVRMAnimationClip(anim, vrm); clipCache.set(name, c); }
    mixer.stopAllAction();
    const a = mixer.clipAction(c); a.reset(); a.setLoop(THREE.LoopRepeat, Math.max(1, times)); a.play();
    clip = {a, t: 0, dur: c.duration * Math.max(1, times)};
  }
  function endClip(){ clip.a.stop(); clip = null; vrm.humanoid.resetNormalizedPose(); }

  /* ── 行程 ── */
  const label = (s) => {
    const wp = (config.waypoints || []).find(w => w.id === s.to);
    const act = s.action?.startsWith('vrma:') ? s.action.slice(5) : ACTIONS[s.action]?.name;
    return {walk: '走到' + (wp?.name || '目標旁'), face: '轉向', act: act || '動作', say: '說話', expr: '換表情', wait: '等一下'}[s.do] || s.do;
  };
  function startSeq(steps, ctx, prio, name){
    if (seq) abort();
    seq = {steps: steps.map(s => ({...s})), i: -1, ctx: ctx || {}, prio, name, st: 0};
    next();
  }
  function abort(){
    if (act) act.dur = Math.min(act.dur, act.t + .35);
    if (clip) endClip();
    loco.moving = false; seq = null;
  }
  function next(){
    seq.i++; seq.st = 0;
    const s = seq.steps[seq.i];
    if (!s){ finish(); return; }
    doing = label(s);
    if (s.do === 'walk'){ seq.target = resolvePoint(s.to, seq.ctx); if (!seq.target) return next(); lookPoint = null; }
    if (s.do === 'face'){ seq.target = resolveLook(s.to, seq.ctx); if (!seq.target) return next(); lookPoint = s.to === 'camera' ? null : seq.target; }
    if (s.do === 'act') startAct(s.action, s.times || 1);
    if (s.do === 'say'){ const txt = fillLine(s.text, seq.ctx); if (txt) onSay(txt, s.sec || Math.min(6, 1.8 + [...txt].length * .12)); }
    if (s.do === 'expr') exprOverride = s.name || null;
  }
  function finish(){
    seq = null; loco.moving = false; exprOverride = null; lookPoint = null; doing = '待機';
    const [a, b] = config.idle?.gap || [3, 8];
    idleWait = a + Math.random() * Math.max(0, b - a);
  }
  function startIdle(){
    const beats = (config.idle?.beats || []).filter(b => b.steps?.length);
    if (!beats.length){ idleWait = 3; return; }
    let pool = beats.map((b, i) => ({b, i})).filter(x => beats.length < 2 || x.i !== lastBeat);
    const total = pool.reduce((s, x) => s + (x.b.weight || 1), 0);
    let r = Math.random() * total, pick = pool[0];
    for (const x of pool){ r -= (x.b.weight || 1); if (r <= 0){ pick = x; break; } }
    lastBeat = pick.i; startSeq(pick.b.steps, {}, 0, '待機：' + pick.b.name);
  }
  function stepWalk(dt, p){
    const dx = p.x - root.position.x, dz = p.z - root.position.z, dist = Math.hypot(dx, dz);
    if (dist < .05){ loco.moving = false; return true; }
    const want = Math.atan2(dx, dz), diff = wrapAngle(want - root.rotation.y);
    root.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), TURN_SPEED * dt);
    const sp = WALK_SPEED * (Math.abs(diff) < .5 ? 1 : .15) * Math.min(1, dist / .3 + .3);
    const k = Math.min(dist, sp * dt) / dist;
    root.position.x += dx * k; root.position.z += dz * k;
    loco.moving = true; loco.speed = sp;
    return false;
  }
  function stepFace(dt, p){
    const want = Math.atan2(p.x - root.position.x, p.z - root.position.z), diff = wrapAngle(want - root.rotation.y);
    root.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), TURN_SPEED * .8 * dt);
    return Math.abs(diff) < .03;
  }
  function tickScheduler(dt){
    if (!seq){
      if (queue.length){ const q = queue.shift(); startSeq(q.steps, q.ctx, q.prio, q.name); return; }
      idleWait -= dt; if (idleWait <= 0) startIdle(); return;
    }
    seq.st += dt;
    const s = seq.steps[seq.i]; if (!s) return;
    let done = false;
    if (s.do === 'walk') done = stepWalk(dt, seq.target) || seq.st > 20;
    else if (s.do === 'face') done = stepFace(dt, seq.target) || seq.st > 1.6;
    else if (s.do === 'act') done = !act && !clip;
    else if (s.do === 'wait') done = seq.st >= (s.sec ?? 1);
    else done = true;
    if (done && seq) next();
  }

  /* ── 每格更新 ── */
  function update(dt, t){
    tickScheduler(dt);
    loco.blend += ((loco.moving ? 1 : 0) - loco.blend) * Math.min(1, dt * 7);
    if (loco.blend > .01) loco.phase += dt * (loco.moving ? loco.speed : WALK_SPEED * .5) / STRIDE * Math.PI * 2;
    if (!vrm) return;

    if (clip){
      clip.t += dt; mixer.update(dt);
      if (clip.t >= clip.dur) endClip();
    } else {
      vrm.humanoid.resetNormalizedPose();
      const c = basePose(t);
      walkLayer(c, loco.blend);
      if (act){
        act.t += dt;
        const w = ease(act.t / .35) * ease((act.dur - act.t) / .35);
        POSES[act.id](c, act.t, w * (1 - loco.blend * .6));
        if (act.t >= act.dur) act = null;
      }
      applyChannels(c);
    }

    // 表情：底色微笑，動作或「表情」步驟可以蓋過去
    const em = vrm.expressionManager;
    if (em){
      const target = {happy: .22};
      if (exprOverride){ delete target.happy; if (exprOverride !== 'neutral') target[exprOverride] = .7; }
      const ae = act && ACTIONS[act.id]?.expr;
      if (ae) target[ae] = Math.max(target[ae] || 0, .75 * ease(act.t / .3) * ease((act.dur - act.t) / .3));
      for (const k of ['happy', 'relaxed', 'surprised', 'sad', 'angry']){
        expr[k] = (expr[k] || 0) + ((target[k] || 0) - (expr[k] || 0)) * Math.min(1, dt * 6);
        if (!clip) em.setValue(k, expr[k]);
      }
      const bp = t % 4.2;
      if (!clip) em.setValue('blink', (expr.happy > .6 || expr.relaxed > .6) ? 0 : bp < .12 ? Math.sin(bp / .12 * Math.PI) : 0);
    }

    // 視線：走路看前方、指定目標、否則看鏡頭
    const want = loco.moving ? new THREE.Vector3(Math.sin(root.rotation.y) * 3, 1.3, Math.cos(root.rotation.y) * 3).add(root.position)
      : lookPoint ? lookPoint : camera.position;
    smoothLook.lerp(want, Math.min(1, dt * 4));
    lookTarget.position.copy(smoothLook);
  }

  return {
    update,
    attach(v){ vrm = v; clipCache.clear(); mixer = new THREE.AnimationMixer(vrm.scene); calibrate(); if (vrm.lookAt) vrm.lookAt.target = lookTarget; },
    setConfig(c){ config = c; },
    setMotions(m){ motions = m; clipCache.clear(); },
    trigger(ev, ctx = {}){
      const steps = config.reactions?.[ev]; if (!steps?.length) return;
      const name = EVENTS[ev]?.name || ev;
      if (!seq || seq.prio < 1) startSeq(steps, ctx, 1, name);
      else if (queue.length < 3) queue.push({steps, ctx, prio: 1, name});
    },
    run(steps, ctx = {}, name = '導演台預演'){ queue.length = 0; if (steps?.length) startSeq(steps, ctx, 2, name); },
    status(){ return {x: root.position.x, z: root.position.z, yaw: root.rotation.y, doing, seq: seq?.name || '', step: seq ? seq.i : -1}; },
    get busy(){ return !!seq; },
  };
}
