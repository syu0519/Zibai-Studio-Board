import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RectAreaLightUniformsLib} from './vendor/RectAreaLightUniformsLib.js';
import {buildAtmosphere} from './atmosphere.js';
import {buildRoom} from './room.js';
import {buildEquipment} from './equipment.js';
export {bindOperator} from './operator-binding.js';
export {createBoneOperatorDriver} from './bone-operator-driver.js';

export const sceneMeta={id:'ltu-realtime-vfx-studio-v11',name:'嶺東即時合成特效攝影棚 · LTU VFX Studio · Backlight Haze',eye:[8.8,5.6,9.2],target:[-1,2.6,-2.5],fov:68,loopSeconds:32,bounds:{min:[-12.4,-.2,-11.4],max:[12.4,8.8,11.4]},actorArea:{center:[0,.025,-4.8],width:6,depth:4}};

export function createScene({seed=918,textures={},loopSeconds=32}={}){
 if(!Number.isFinite(loopSeconds)||loopSeconds<=0)throw new RangeError('Invalid loopSeconds');
 if(!THREE.UniformsLib.LTC_HALF_1)RectAreaLightUniformsLib.init();
 const root=new THREE.Group();root.name=sceneMeta.id;
 const geos=new Set(),mats=new Set(),maps=new Set();let disposed=false,s=seed>>>0;
 const random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
 const own=g=>(geos.add(g),g);
 const mat=(color,roughness=.6,metalness=0,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});mats.add(m);return m;};
 const M={green:mat(0x4ca609,.35),wall:mat(0xd4d6c8,.88),beam:mat(0xb7c3b6,.9),black:mat(0x151b21,.43,.55),rubber:mat(0x090d11,.9),silver:mat(0xaabac4,.32,.8),blue:mat(0x096ba6,.4,.55),dark:mat(0x34424c,.6,.3),wood:mat(0x74533b,.76),white:mat(0xf0f2e7,.6),cable:mat(0x12181c,.76),yellow:mat(0xf0c348,.7),red:mat(0xc33736,.6),glass:mat(0x101c28,.18,.45),led:mat(0xbaf4ed,.3,0,{emissive:0x7ac7ba,emissiveIntensity:.65})};
 const data=new Uint8Array(128*128*4);for(let i=0;i<128*128;i++){const v=210+random()*30;data[i*4]=data[i*4+1]=data[i*4+2]=v;data[i*4+3]=255;}
 const micro=new THREE.DataTexture(data,128,128);micro.wrapS=micro.wrapT=THREE.RepeatWrapping;micro.minFilter=THREE.LinearMipmapLinearFilter;micro.magFilter=THREE.LinearFilter;micro.generateMipmaps=true;micro.needsUpdate=true;maps.add(micro);
 for(const m of [M.wall,M.green,M.rubber,M.wood]){m.bumpMap=micro;m.bumpScale=m===M.green?.003:.007;}
 let atlas=null;if(textures.signage){atlas=textures.signage.clone();atlas.colorSpace=THREE.SRGBColorSpace;atlas.needsUpdate=true;maps.add(atlas);}
 const labelMat=mat(0xffffff,.75,0,{map:atlas,emissive:0xffffff,emissiveMap:atlas,emissiveIntensity:.13});
 M.floor=new THREE.MeshPhysicalMaterial({color:0x4ca609,roughness:.3,clearcoat:.4,clearcoatRoughness:.22,bumpMap:micro,bumpScale:.002});mats.add(M.floor);
 const screenMat=mat(0xffffff,.45,0,{map:atlas,emissive:0xffffff,emissiveMap:atlas,emissiveIntensity:.8});
 const boxGeo=own(new RoundedBoxGeometry(1,1,1,2,.04)),cubeGeo=own(new THREE.BoxGeometry(1,1,1)),cylGeo=own(new THREE.CylinderGeometry(1,1,1,16));
 function group(id,name,parent=root){const g=new THREE.Group();g.name=id;g.userData.editor={id,name,type:'prop',editable:true,locked:false};parent.add(g);return g;}
 function node(name,parent,p=[0,0,0]){const g=new THREE.Group();g.name=name;g.position.set(...p);parent.add(g);return g;}
 function mesh(g,m,parent,p=[0,0,0],scale=[1,1,1]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 const box=(par,p,size,m=M.black,round=true)=>mesh(round?boxGeo:cubeGeo,m,par,p,size);
 const cyl=(par,p,r,h,m=M.silver)=>mesh(cylGeo,m,par,p,[r,h,r]);
 function rod(par,a,b,r,m=M.silver){const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b),d=bb.clone().sub(aa);const o=mesh(cylGeo,m,par,aa.add(bb).multiplyScalar(.5).toArray(),[r,d.length(),r]);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 function cable(par,points,r=.018,m=M.cable){return mesh(own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(18,points.length*7),r,6,false)),m,par);}
 function label(par,tile,p,size,rot=[0,0,0],lit=false){const g=own(new THREE.PlaneGeometry(...size));const uv=g.attributes.uv,tx=tile%4,ty=Math.floor(tile/4);for(let i=0;i<uv.count;i++){uv.setXY(i,(tx+.015+uv.getX(i)*.97)/4,1-(ty+.015+(1-uv.getY(i))*.97)/8);}const o=mesh(g,lit?screenMat:labelMat,par,p);o.rotation.set(rot[0]||0,rot[1]||0,rot[2]||0);o.castShadow=false;return o;}
 const c={THREE,root,own,mat,M,random,group,node,mesh,box,cyl,rod,cable,label,mergeGeometries};
 buildRoom(c);const equipment=buildEquipment(c);
 // Merge sibling surfaces only: animated joints and named anchors remain intact.
 function compact(parent){for(const child of [...parent.children])if(child.isGroup)compact(child);const buckets=new Map();for(const child of parent.children){if(!child.isMesh||child.isInstancedMesh||Array.isArray(child.material))continue;const key=child.material.uuid+'/'+!!child.geometry.index+'/'+child.castShadow+'/'+child.receiveShadow+'/'+Object.keys(child.geometry.attributes).sort().join(',');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(child);}for(const list of buckets.values()){if(list.length<2)continue;const parts=list.map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix);});const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!merged)continue;const o=new THREE.Mesh(own(merged),list[0].material);o.castShadow=list[0].castShadow;o.receiveShadow=list[0].receiveShadow;list.forEach(m=>parent.remove(m));parent.add(o);}}
 compact(root);
 const atmosphere=buildAtmosphere(c);
 const ambient=new THREE.HemisphereLight(0xe5eef7,0x456822,.12);ambient.name='studio-ambient';root.add(ambient);
 const fill=new THREE.DirectionalLight(0xe3edf4,0);fill.position.set(1,8,7);root.add(fill);
 let controls={demo:true,craneYaw:0,cranePitch:12,headPan:0,headTilt:-8,orbiterTilt:18,orbiterDimmer:1,skyPanelDimmer:1.3,warmth:.25,rimDimmer:1,haze:.65,dust:.35};
 const limits={craneYaw:[-28,28],cranePitch:[4,24],headPan:[-65,65],headTilt:[-40,35],orbiterTilt:[0,55],orbiterDimmer:[0,1.5],skyPanelDimmer:[0,1.5],warmth:[0,1],rimDimmer:[0,1.5],haze:[0,1],dust:[0,1]};
 let lastTime=0,lastStrength=1;
 function update(t,{motionScale=1}={}){if(disposed)return;if(!Number.isFinite(t)||!Number.isFinite(motionScale))throw new RangeError('Invalid time');lastTime=t;lastStrength=THREE.MathUtils.clamp(motionScale,0,1);const theta=((t%loopSeconds+loopSeconds)%loopSeconds)/loopSeconds*Math.PI*2;const v={...controls};if(v.demo){v.craneYaw=12*Math.sin(theta)*lastStrength;v.cranePitch=12+6*Math.sin(theta)*lastStrength;v.headPan=-10*Math.sin(theta)*lastStrength;v.headTilt=-8+5*Math.sin(theta*2)*lastStrength;v.orbiterDimmer=1+.08*Math.sin(theta)*lastStrength;v.skyPanelDimmer=1+.05*Math.sin(theta+Math.PI/2)*lastStrength;}equipment.apply(v);atmosphere.update(theta,lastStrength,v);}
 const api={
  version:1,limits,
  getState:()=>({...controls}),
  setState(patch){if(disposed)throw Error('Scene disposed');if(!patch||typeof patch!=='object')throw TypeError('Expected control object');for(const [k,v]of Object.entries(patch)){if(k==='demo'){if(typeof v!=='boolean')throw TypeError('demo must be boolean');}else if(!limits[k]||!Number.isFinite(v))throw RangeError('Invalid control: '+k);}const next={...controls};for(const[k,v]of Object.entries(patch))next[k]=k==='demo'?v:THREE.MathUtils.clamp(v,...limits[k]);if(!('demo'in patch))next.demo=false;controls=next;update(lastTime,{motionScale:lastStrength});return {...controls};},
  reset(){controls={demo:true,craneYaw:0,cranePitch:12,headPan:0,headTilt:-8,orbiterTilt:18,orbiterDimmer:1,skyPanelDimmer:1.3,warmth:.25,rimDimmer:1,haze:.65,dust:.35};update(0);},
  getInteractionPose(id){const station=equipment.stations[id];if(!station)throw RangeError('Unknown station: '+id);root.updateMatrixWorld(true);const result={};for(const[key,obj]of Object.entries(station)){const p=new THREE.Vector3(),q=new THREE.Quaternion();obj.getWorldPosition(p);obj.getWorldQuaternion(q);result[key]={position:p.toArray(),quaternion:q.toArray()};}return result;},
  getCameraPose(){root.updateMatrixWorld(true);const o=equipment.cameraAnchor;return {position:o.getWorldPosition(new THREE.Vector3()).toArray(),quaternion:o.getWorldQuaternion(new THREE.Quaternion()).toArray(),fov:45};},
  listStations:()=>Object.keys(equipment.stations)
 };
 root.userData.interactionCatalog={apiVersion:1,stations:Object.keys(equipment.stations),controls:Object.keys(limits),hostAutomaticallyConnected:false};
 update(0);
 function dispose(){if(disposed)return;disposed=true;atmosphere.dispose();root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isLight)o.dispose?.();});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());maps.forEach(t=>t.dispose());}
 return {root,meta:{...sceneMeta,loopSeconds},update,dispose,api};
}




