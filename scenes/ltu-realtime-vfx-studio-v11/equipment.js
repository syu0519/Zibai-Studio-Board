export function buildEquipment(c){
 const {THREE,own,mat,M,group,node,mesh,box,cyl,rod,cable,label,random}=c;
 const stations={};
 function anchor(parent,name,p,ry=0){const o=node(name,parent,p);o.rotation.y=ry;return o;}
 function station(id,parent,feet,left,right,ry=0){stations[id]={feet:anchor(parent,id+'-feet',feet,ry),leftHand:anchor(parent,id+'-left-hand',left,ry),rightHand:anchor(parent,id+'-right-hand',right,ry)};}
 function knob(par,p,r=.03){const o=cyl(par,p,r,.025,M.rubber);o.rotation.x=Math.PI/2;return o;}
 function screws(par,w,h,z){for(const x of [-w,w])for(const y of [-h,h]){const s=cyl(par,[x,y,z],.012,.01,M.silver);s.rotation.x=Math.PI/2;box(par,[x,y,z+.009],[.014,.003,.002],M.black,false);}}
 function stand(par,height=2.6,wheeled=false){
  if(height<1.8){cyl(par,[0,height/2,0],.035,height,M.silver);}else{cyl(par,[0,.55,0],.042,1.1,M.silver);cyl(par,[0,1.35,0],.029,1.4,M.silver);cyl(par,[0,(height+1.65)/2,0],.020,height-1.65,M.silver);}
  for(const y of [.92,1.72]){if(y>height)continue;cyl(par,[0,y,0],.06,.09,M.black);rod(par,[.03,y,0],[.14,y,0],.015,M.silver);box(par,[.15,y,0],[.035,.09,.07],M.rubber);}
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2,x=Math.cos(a)*.74,z=Math.sin(a)*.74;rod(par,[0,.64,0],[x,.09,z],.021,M.silver);rod(par,[0,.25,0],[x*.75,.20,z*.75],.012,M.dark);if(wheeled){const w=cyl(par,[x,.09,z],.095,.065,M.rubber);w.rotation.z=Math.PI/2;}else box(par,[x,.06,z],[.11,.08,.14],M.rubber);}
  box(par,[.33,.10,.13],[.40,.15,.28],M.rubber);box(par,[.33,.19,.13],[.08,.02,.14],M.dark);
 }
 function camera(par,p=[0,0,0],scale=1){
  const camera=node('broadcast-camera',par,p);camera.scale.setScalar(scale);
  box(camera,[0,.08,0],[.29,.30,.49],M.black);box(camera,[-.155,.08,.04],[.04,.23,.33],M.dark);
  for(let j=0;j<4;j++){const r=.1-j*.011,zz=-.27-j*.045;const o=cyl(camera,[0,.07,zz],r,.053,j%2?M.rubber:M.black);o.rotation.x=Math.PI/2;}
  const lens=cyl(camera,[0,.07,-.46],.079,.012,M.glass);lens.rotation.x=Math.PI/2;for(const x of [-.155,.155])box(camera,[x,.07,-.5],[.03,.23,.055],M.black);for(const y of [-.03,.17])box(camera,[0,y,-.5],[.31,.03,.055],M.black);box(camera,[0,.20,-.50],[.37,.035,.19],M.black);
  box(camera,[0,.255,.015],[.035,.07,.29],M.black);box(camera,[0,.30,.015],[.18,.035,.30],M.black);
  box(camera,[0,.08,.30],[.22,.30,.14],M.rubber);rod(camera,[.12,.20,.23],[.14,.41,.23],.006,M.black);
  const vf=node('camera-viewfinder',camera,[.21,.23,.06]);box(vf,[0,0,0],[.18,.11,.08],M.black);label(vf,5,[0,0,.044],[.16,.09],[],true);
  label(camera,15,[-.177,.08,.01],[.26,.08],[0,-Math.PI/2,0]);
  const tally=mat(0xf44732,.4,0,{emissive:0xff2200,emissiveIntensity:1.0});box(camera,[.09,.245,-.18],[.038,.018,.028],tally);
  return anchor(camera,'optical-center',[0,.07,-.55]);
 }
 // CamMate-style manually counterbalanced crane, not an industrial robot arm.
 const crane=group('cammate-crane','CamMate 參考式遙控攝影搖臂');crane.position.set(-1.8,0,2.1);
 for(const z of [-.6,.6]){box(crane,[0,.17,z],[1.6,.14,.14],M.black);for(const x of [-.73,.73]){const w=cyl(crane,[x,.13,z],.13,.12,M.rubber);w.rotation.z=Math.PI/2;box(crane,[x,.28,z],[.06,.15,.12],M.silver);}}
 box(crane,[0,.24,0],[.62,.20,1.35],M.dark);cyl(crane,[0,.93,0],.17,1.30,M.black);
 for(const y of [.37,1.4])cyl(crane,[0,y,0],.22,.11,M.silver);
 const yaw=node('crane-yaw',crane,[0,1.63,0]);cyl(yaw,[0,0,0],.26,.17,M.black);box(yaw,[0,.17,0],[.56,.3,.42],M.black);
 const pitch=node('crane-pitch',yaw,[0,.23,0]);
 for(const x of [-.19,.19])box(pitch,[x,0,-2.25],[.075,.13,8.7],M.black);
 for(let z=-6.5;z<2.2;z+=.54){rod(pitch,[-.18,-.08,z],[.18,.09,z+.46],.024,M.silver);rod(pitch,[.18,-.08,z],[-.18,.09,z+.46],.024,M.black);box(pitch,[0,0,z],[.40,.10,.055],M.dark);}
 box(pitch,[0,.02,2.12],[.58,.18,.56],M.dark);for(let i=0;i<6;i++){box(pitch,[0,.16+i*.068,2.12],[.49,.06,.44],M.black);box(pitch,[.255,.16+i*.068,2.12],[.025,.04,.15],M.silver);}
 rod(pitch,[0,.02,.15],[0,.83,-1.3],.035,M.black);
 for(const x of [-.12,.12]){rod(pitch,[x,.02,2],[x,.8,-1.3],.006,M.silver);rod(pitch,[x,.8,-1.3],[x,.02,-6.6],.006,M.silver);}
 label(pitch,1,[.233,.02,-2.8],[1.65,.25],[0,Math.PI/2,0]);
 cable(pitch,[[.20,.09,1.9],[.23,.12,-1],[.23,.12,-4],[.20,.02,-6.65],[.18,-.36,-6.65]],.015);
 const level=node('crane-head-level',pitch,[0,0,-6.65]);
 const headPan=node('remote-head-pan',level,[0,-.15,0]);cyl(headPan,[0,.05,0],.16,.11,M.black);box(headPan,[-.21,-.23,0],[.09,.53,.10],M.black);box(headPan,[0,-.47,0],[.5,.08,.21],M.black);
 const headTilt=node('remote-head-tilt',headPan,[0,-.29,0]);const optical=camera(headTilt,[0,0,0],1.2);
 stations['crane-tail']={feet:anchor(crane,'crane-tail-feet',[0,0,3]),leftHand:anchor(pitch,'crane-tail-left-hand',[-.25,.07,2.4]),rightHand:anchor(pitch,'crane-tail-right-hand',[.25,.07,2.4])};
 // Separate remote control desk with two operator grips and reachable controls.
 const remote=group('crane-console','搖臂遙控台與角色操作位');remote.position.set(-4.4,0,3.7);stand(remote,1.08);box(remote,[0,1.14,0],[.84,.13,.5],M.black);label(remote,7,[0,1.211,-.04],[.42,.20],[-Math.PI/2,0,0],true);
 for(const x of [-.29,.29]){rod(remote,[x,1.22,.1],[x,1.37,.1],.025,M.black);cyl(remote,[x,1.4,.1],.045,.065,M.rubber);}
 label(remote,1,[0,1.14,.257],[.56,.07]);station('crane-console',remote,[0,0,.80],[-.29,1.41,.1],[.29,1.41,.1],Math.PI);
 const fixtureRecords=[];
 function fixture(id,kind,x,z,height,yawAngle,shadow=false){
  const base=group(id,kind==='orbiter'?'ARRI Orbiter 參考式燈具':'ARRI SkyPanel S60-C 參考式燈具');base.position.set(x,0,z);stand(base,height,true);
  const swivel=node(id+'-swivel',base,[0,height,0]);swivel.rotation.y=yawAngle;
  const width=kind==='orbiter'?.51:.91;
  box(swivel,[-width/2,-.12,0],[.045,.43,.07],M.black);box(swivel,[width/2,-.12,0],[.045,.43,.07],M.black);box(swivel,[0,-.33,0],[width,.055,.07],M.black);
  for(const side of [-1,1]){const pivot=cyl(swivel,[side*width/2,0,0],.071,.065,M.black);pivot.rotation.z=Math.PI/2;box(swivel,[side*(width/2+.045),0,0],[.035,.14,.04],M.black);}
  const tilt=node(id+'-tilt',swivel);tilt.rotation.x=.30;
  const emission=mat(0xf3f5ee,.3,0,{emissive:0xe8efff,emissiveIntensity:1.8});let light;
  if(kind==='orbiter'){
   box(tilt,[0,0,-.04],[.32,.34,.37],M.silver);box(tilt,[0,-.14,-.04],[.32,.09,.38],M.blue);
   for(const x of [-.16,.16])box(tilt,[x,.0,-.05],[.023,.23,.27],M.blue);
   for(let i=0;i<11;i++)box(tilt,[-.125+i*.025,.03,-.235],[.013,.25,.022],M.dark);
   const ring=cyl(tilt,[0,.025,.19],.146,.12,M.black);ring.rotation.x=Math.PI/2;
   const front=cyl(tilt,[0,.025,.26],.112,.01,emission);front.rotation.x=Math.PI/2;
   for(let j=0;j<3;j++){const rim=mesh(own(new THREE.TorusGeometry(.116+j*.011,.006,5,32)),M.dark,tilt,[0,.025,.268+j*.001]);}
   box(tilt,[0,.205,-.07],[.25,.04,.18],M.black);rod(tilt,[-.10,.19,-.1],[-.10,.26,-.1],.012,M.black);rod(tilt,[.10,.19,-.1],[.10,.26,-.1],.012,M.black);rod(tilt,[-.10,.26,-.1],[.10,.26,-.1],.013,M.black);
   label(tilt,2,[-.177,.04,-.035],[.25,.12],[0,-Math.PI/2,0]);label(tilt,8,[0,.035,-.249],[.16,.10],[0,Math.PI,0],true);
   for(const x of [-.08,.08])knob(tilt,[x,-.08,-.25],.025);
   for(let j=0;j<3;j++){const port=cyl(tilt,[-.09+j*.09,-.145,-.248],.02,.02,M.black);port.rotation.x=Math.PI/2;}
   rod(tilt,[.12,.15,-.18],[.12,.40,-.19],.004,M.black);
   light=new THREE.SpotLight(0xf5f2e9,170,28,.55,.7,2);light.position.set(0,.025,.30);const target=node(id+'-light-target',tilt,[0,0,8]);light.target=target;light.castShadow=shadow;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.0003;light.shadow.normalBias=.022;
  }else{
   box(tilt,[0,0,0],[.78,.47,.16],M.silver);box(tilt,[0,0,-.09],[.72,.4,.07],M.blue);box(tilt,[0,0,.09],[.72,.37,.024],M.black);
   box(tilt,[0,0,.108],[.645,.30,.012],emission,false);
   for(let i=0;i<18;i++)box(tilt,[-.32+i*.038,0,-.14],[.015,.34,.035],M.dark);
   for(const y of [-.22,.22]){const flap=box(tilt,[0,y,.18],[.75,.14,.02],M.black);flap.rotation.x=y>0?-.45:.45;}
   for(const x of [-.39,.39]){const flap=box(tilt,[x,0,.18],[.15,.45,.02],M.black);flap.rotation.y=x>0?.45:-.45;}
   label(tilt,3,[0,.12,-.162],[.38,.10],[0,Math.PI,0]);label(tilt,8,[0,-.04,-.165],[.25,.10],[0,Math.PI,0],true);
   screws(tilt,.35,.195,.095);
   light=new THREE.RectAreaLight(0xe7efff,7,.645,.30);light.position.z=.135;light.rotation.y=Math.PI;
  }
  tilt.add(light);light.name=id+'-light';
  box(base,[.25,.24,.13],[.29,.34,.13],M.blue);label(base,13,[.25,.24,.201],[.21,.17]);cable(base,[[.25,.32,.2],[.30,1,.15],[.12,height-.5,.05],[.13,height-.17,-.07]],.013);
  box(base,[.25,1.0,.17],[.15,.24,.09],M.black);label(base,8,[.25,1.035,.219],[.125,.08],[],true);knob(base,[.25,.95,.225],.025);
  fixtureRecords.push({id,kind,base,tilt,light,emission});
  station(id,base,[.75,0,.60],[.15,1.72,0],[.25,1.0,.2],Math.PI);
  return base;
 }
 fixture('orbiter-key','orbiter',5.5,.0,3.3,-2.1,true);
 fixture('orbiter-fill','orbiter',-5.8,-.4,3.0,2.08,true);
 fixture('skypanel-left','panel',-5.2,-5.8,3.5,1.1);
 fixture('skypanel-right','panel',5.4,-6.5,3.65,-1.12);
 // Broad overhead green-screen wash lights, static physical fill.
 for(const x of [-6,0,6]){const overhead=group('overhead-panel-'+x,'天花柔光棚燈');overhead.position.set(x,7.65,-6.7);const light=new THREE.RectAreaLight(0xf0f5ec,0,2.1,.65);light.rotation.x=-Math.PI/2;overhead.add(light);box(overhead,[0,0,0],[2.2,.12,.73],M.black);box(overhead,[0,-.067,0],[2.07,.014,.63],M.dark);}
 // Tripod camera and confidence monitor, with clear center-stage space.
 const tripod=group('tripod-camera','三腳架攝影機');tripod.position.set(3.3,0,1.3);stand(tripod,1.6);const camHead=node('tripod-head',tripod,[0,1.62,0]);camera(camHead);rod(camHead,[.15,0,0],[.35,-.05,.52],.019,M.black);station('tripod-camera',tripod,[.05,0,.85],[-.13,1.7,.15],[.35,1.57,.52],Math.PI);
 function monitor(par,x,y,z,w=1.1,tile=4){const g=node('monitor',par,[x,y,z]);box(g,[0,0,0],[w,w*.58,.065],M.black);label(g,tile,[0,0,.036],[w*.94,w*.52],[],true);box(g,[0,-w*.33,-.02],[.055,.15,.045],M.silver);box(g,[0,-w*.40,0],[w*.42,.04,.27],M.black);return g;}
 const broadcast=group('broadcast-desk','即時合成、導播與燈光控制工作站');broadcast.position.set(0,0,7.35);
 for(const x of [-4.5,-1.5,1.5,4.5]){box(broadcast,[x,.52,0],[2.85,1.04,.85],M.wall);box(broadcast,[x,1.085,0],[2.98,.09,1.0],M.dark);for(const z of [-.35,.35])for(const xx of [-1.2,1.2])cyl(broadcast,[x+xx,.045,z],.05,.08,M.black);}
 for(let i=0;i<6;i++)monitor(broadcast,-4.7+i*1.85,1.73,-.15,1.05,4+i%3);
 const deck=node('switcher-surface',broadcast,[.1,1.15,.1]);deck.rotation.x=-.1;box(deck,[0,0,0],[2.35,.13,.61],M.black);
 for(let row=0;row<4;row++)for(let col=0;col<16;col++){const colMat=row===0?(col%4===0?M.red:M.led):row===1?M.blue:M.white;box(deck,[-1.03+col*.137,.077,-.21+row*.13],[.094,.02,.075],colMat);}
 rod(deck,[.82,.10,.20],[.82,.28,.20],.018,M.silver);box(deck,[.82,.30,.20],[.13,.035,.04],M.black);
 const audio=node('audio-console',broadcast,[-3.9,1.18,.08]);box(audio,[0,0,0],[1.15,.12,.55],M.black);
 for(let i=0;i<12;i++){box(audio,[-.49+i*.09,.067,.08],[.018,.004,.26],M.silver,false);box(audio,[-.49+i*.09,.085,.05+Math.sin(i)*.07],[.055,.025,.04],M.white);for(let j=0;j<3;j++)cyl(audio,[-.49+i*.09,.083,-.21+j*.055],.018,.025,j?M.black:M.blue);}
 for(const x of [-1.9,3.8]){box(broadcast,[x,1.15,.25],[.55,.025,.18],M.black);for(let row=0;row<4;row++)for(let col=0;col<13;col++)box(broadcast,[x-.24+col*.039,1.167,.19+row*.035],[.029,.008,.025],M.dark);box(broadcast,[x+.42,1.16,.24],[.08,.035,.13],M.black);}
 label(broadcast,0,[0,.58,.435],[2.65,.58]);station('switcher',broadcast,[.1,0,1.05],[-.45,1.25,.25],[.82,1.4,.3],Math.PI);station('audio',broadcast,[-3.9,0,1.05],[-4.3,1.28,.15],[-3.5,1.28,.15],Math.PI);
 // Empty operator stools; no human meshes or faces in this package.
 const seating=group('empty-operator-seats','空置操作椅');for(const x of [-4.5,-1.5,1.5,4.5]){cyl(seating,[x,.07,8.8],.32,.09,M.black);cyl(seating,[x,.43,8.8],.035,.70,M.silver);cyl(seating,[x,.81,8.8],.25,.10,M.rubber);const foot=mesh(own(new THREE.TorusGeometry(.19,.013,8,32).rotateX(Math.PI/2)),M.silver,seating,[x,.30,8.8]);}
 const returns=group('floor-return-monitors','大型返送監看屏');for(const [x,z]of [[-7,-3.4],[7,-3.6]]){const g=node('return-screen',returns,[x,0,z]);g.rotation.y=x<0?.65:-.65;stand(g,1.55,true);monitor(g,0,2.02,0,1.68,4);box(g,[.55,.20,0],[.22,.35,.30],M.black);}
 const racks=group('equipment-racks','機櫃、收納箱與備用設備');
 for(const x of [-8,8]){const rack=node('av-rack',racks,[x,0,6.8]);box(rack,[0,.64,0],[.61,1.20,.61],M.black);for(let j=0;j<7;j++){box(rack,[0,.18+j*.15,.315],[.52,.12,.04],M.dark);label(rack,14,[0,.18+j*.15,.339],[.48,.09]);for(const xx of [-.25,.25])box(rack,[xx,.18+j*.15,.37],[.02,.07,.04],M.silver);}for(const xx of [-.22,.22])for(const zz of [-.22,.22])cyl(rack,[xx,.04,zz],.045,.07,M.rubber);}
 for(let i=0;i<4;i++){const g=node('flight-case',racks,[8.3-i*.86,.23,9.6]);box(g,[0,0,0],[.78,.42,.52],M.black);for(const y of [-.19,.19])box(g,[0,y,0],[.8,.024,.54],M.silver);for(const x of [-.36,.36])box(g,[x,0,0],[.024,.42,.54],M.silver);label(g,11,[0,0,.267],[.48,.18]);}
 return {stations,cameraAnchor:optical,apply(v){
  const rad=THREE.MathUtils.degToRad;yaw.rotation.y=rad(v.craneYaw);pitch.rotation.x=rad(v.cranePitch);level.rotation.x=-rad(v.cranePitch);headPan.rotation.y=rad(v.headPan);headTilt.rotation.x=rad(v.headTilt);
  for(const f of fixtureRecords){const dim=f.kind==='orbiter'?v.orbiterDimmer:v.skyPanelDimmer;f.tilt.rotation.x=rad(f.kind==='orbiter'?v.orbiterTilt:25);f.light.intensity=(f.kind==='orbiter'?170:7)*dim;f.light.color.setRGB(1,.96-v.warmth*.15,.92-v.warmth*.42);f.emission.emissive.copy(f.light.color);f.emission.emissiveIntensity=1.8*dim;}
 }};
}
