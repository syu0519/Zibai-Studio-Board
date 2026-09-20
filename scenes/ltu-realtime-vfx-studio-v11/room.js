export function buildRoom(c){
 const {THREE,own,mat,M,group,node,mesh,box,cyl,rod,cable,label,random}=c;
 const shell=group('studio-shell','攝影棚主結構 · 估算 24×22×8.5 m');
 box(shell,[0,-.12,0],[24,.24,22],M.floor,false);
 // Smooth quarter-circle cyclorama connects green floor to green back wall.
 const pp=[],uv=[],ii=[],width=24,r=1.25;
 for(let j=0;j<=28;j++){const a=j/28*Math.PI/2,y=r-r*Math.cos(a),z=-9.75-r*Math.sin(a);for(const x of [-12,12]){pp.push(x,y,z);uv.push((x+12)/24,j/28);}if(j<28){const k=j*2;ii.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const curve=own(new THREE.BufferGeometry());curve.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));curve.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));curve.setIndex(ii);curve.computeVertexNormals();mesh(curve,M.green,shell);
 box(shell,[0,4.9,-11.08],[24,7.3,.16],M.green,false);
 for(const x of [-12.15,12.15])box(shell,[x,4.25,0],[.3,8.5,22],M.wall,false);
 box(shell,[0,4.25,11.15],[24,8.5,.3],M.wall,false);box(shell,[0,8.62,0],[24.4,.25,22.4],M.wall,false);
 const structure=group('ceiling-structure','格樑、追蹤標記與吊掛設施');
 for(const z of [-9,-4.5,0,4.5,9])box(structure,[0,8.22,z],[24,.58,.34],M.beam,false);
 for(const x of [-10,-5,0,5,10]){box(structure,[x,8.22,0],[.38,.58,22],M.beam,false);}
 for(const x of [-11.8,11.8])for(const z of [-8.8,8.8])box(structure,[x,4.1,z],[.36,8.2,.46],M.beam,false);
 for(const x of [-7.5,-2.5,2.5,7.5])for(const z of [-6.6,-2.2,2.2,6.6]){box(structure,[x,8.47,z],[1.12,.025,.86],M.white,false);label(structure,12,[x,8.448,z],[1.06,.80],[Math.PI/2,0,0]);}
 for(const x of [-6,0,6])for(const z of [-6,1,7]){
  rod(structure,[x,8.5,z],[x,7.77,z],.018,M.black);mesh(own(new THREE.ConeGeometry(.23,.24,24,1,true)),M.silver,structure,[x,7.72,z]);cyl(structure,[x,7.60,z],.20,.024,M.dark);
 }
 const walkways=group('catwalks','雙側高架走道、木地板與金屬欄杆');
 function rail(x1,z1,x2,z2,y){rod(walkways,[x1,y+1.05,z1],[x2,y+1.05,z2],.045,M.wood);for(const yy of [.25,.52,.79])rod(walkways,[x1,y+yy,z1],[x2,y+yy,z2],.012,M.dark);const n=Math.ceil(Math.hypot(x2-x1,z2-z1)/1.45);for(let i=0;i<=n;i++)rod(walkways,[x1+(x2-x1)*i/n,y,z1+(z2-z1)*i/n],[x1+(x2-x1)*i/n,y+1.08,z1+(z2-z1)*i/n],.024,M.dark);}
 for(const side of [-1,1]){
  const x=side*10.9;box(walkways,[x,1.10,1.2],[2.1,.22,19.4],M.dark,false);
  for(let z=-8.35;z<10.8;z+=.21)box(walkways,[x,1.235,z],[2.05,.055,.195],M.wood,false);
  rail(side*9.84,-8.5,side*9.84,10.8,1.27);
  for(const z of [-7,-3,1,5,9]){rod(walkways,[side*11.8,.05,z],[side*11.8,1.05,z],.075,M.dark);rod(walkways,[side*11.8,.12,z],[side*10.05,1.05,z],.04,M.dark);}
 }
 // Right access stair sits behind the working floor.
 for(let i=0;i<7;i++)box(walkways,[8.2+i*.25,.09+i*.18,9.2],[.29,.18,1.25],M.dark,false);
 rail(8.1,8.54,9.8,8.54,.14);rail(8.1,9.87,9.8,9.87,.14);
 const services=group('building-services','窗簾、空調、管線與出入口');
 const curtain=mat(0x8a9381,.76,.1,{side:THREE.DoubleSide});
 for(const side of [-1,1])for(const centerZ of [-5,2.1,8]){
  box(services,[side*11.95,5.7,centerZ],[.10,2.75,4.9],M.dark,false);
  const g=own(new THREE.PlaneGeometry(4.8,2.6,120,2)),a=g.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i);a.setZ(i,.085*Math.sin(x*30)+.026*Math.sin(x*60));}g.computeVertexNormals();const o=mesh(g,curtain,services,[side*11.8,5.72,centerZ]);o.rotation.y=-side*Math.PI/2;
  box(services,[side*11.63,4.03,centerZ],[.42,.35,3.9],M.white);
  for(let j=0;j<13;j++)box(services,[side*11.39,3.98,centerZ-1.65+j*.275],[.035,.16,.18],M.dark,false);
 }
 for(const side of [-1,1])for(const y of [3.4,3.56])rod(services,[side*11.57,y,-10],[side*11.57,y,10.8],.035,M.silver);
 for(const x of [-10,10]){box(services,[x,1.45,10.96],[1.55,2.9,.08],M.dark);box(services,[x,1.42,10.9],[1.36,2.68,.06],M.wall);box(services,[x+.47,1.38,10.83],[.06,.20,.05],M.silver);label(services,10,[x,3.17,10.87],[.78,.27],[0,Math.PI,0]);}
 label(services,0,[0,4.25,10.96],[5.2,1.12],[0,Math.PI,0]);
 const blocks=group('green-blocks','綠箱模組與綠幕側補景');
 for(let j=0;j<3;j++)for(let k=0;k<4;k++)box(blocks,[9.4+k*.62,.32+j*.64,-9.4],[.61,.62,1.0],M.green,false);
 const tracking=group('tracking-floor','追蹤地墊與定位記號');const darkGreen=mat(0x24742f,.65);
 box(tracking,[0,.009,-3.2],[5.8,.016,4.4],darkGreen,false);
 const marks=new THREE.InstancedMesh(own(new THREE.CircleGeometry(.018,6).rotateX(-Math.PI/2)),M.white,216);let n=0;const d=new THREE.Object3D();for(let z=0;z<12;z++)for(let x=0;x<18;x++){d.position.set(-2.72+x*.32,.022,-5.2+z*.36);d.updateMatrix();marks.setMatrixAt(n++,d.matrix);}tracking.add(marks);
 for(const [x,z]of [[-3.3,-.5],[3.3,-.5],[-3.3,-6],[3.3,-6]]){box(tracking,[x,.014,z],[.45,.01,.035],M.yellow,false);box(tracking,[x,.015,z],[.035,.01,.45],M.yellow,false);}
 // Cable paths stay outside the central performance rectangle.
 const floorCables=group('floor-cables','地面訊號線、電源線與集線槽');
 for(let i=0;i<5;i++)cable(floorCables,[[-6+i*.06,.04,6],[-5+i*.07,.04,4],[3+i*.1,.04,3.4],[6+i*.07,.04,1],[6.3+i*.07,.04,-2]],.015);
 for(const [x,z]of [[6,1],[-6,2],[4,6]]){const pts=[];for(let i=0;i<=85;i++){const a=i/85*Math.PI*8,r=.32+i*.001;pts.push([x+Math.cos(a)*r,.035+Math.floor(i/22)*.014,z+Math.sin(a)*r]);}cable(floorCables,pts,.015,M.blue);box(floorCables,[x+.5,.065,z],[.4,.1,.16],M.black);}
 return shell;
}
