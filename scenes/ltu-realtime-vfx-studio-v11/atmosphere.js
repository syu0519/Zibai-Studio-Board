// Local artistic haze approximation; no renderer replacement or depth-texture dependency.
export function buildAtmosphere(c){
 const {THREE,own,M,mat,group,node,box,cyl,rod,mesh,random}=c;
 const root=group('studio-atmosphere','逆光、薄霧與緩慢光點');
 const records=[],owned=[];
 for(const [i,x] of [-7.2,7.2].entries()){
  const stand=node('rim-stand-'+i,root,[x,0,-7.8]);
  cyl(stand,[0,1.65,0],.045,3.3,M.silver);
  for(let j=0;j<3;j++){const a=j*Math.PI*2/3;rod(stand,[0,.7,0],[Math.cos(a)*.8,.08,Math.sin(a)*.8],.025,M.silver);}
  box(stand,[.3,.13,0],[.5,.2,.3],M.rubber);
  const head=node('rim-head-'+i,stand,[0,3.3,0]);
  box(head,[0,0,0],[.42,.42,.5],M.black);box(head,[0,-.18,0],[.44,.06,.49],M.blue);
  for(let j=0;j<9;j++)box(head,[-.17+j*.042,0,-.26],[.018,.34,.04],M.dark);
  for(const x of [-.23,.23])box(head,[x,0,.36],[.025,.5,.28],M.black);
  const color=new THREE.Color(i?0xaacfff:0xffd4a2);
  const emission=mat(color,.4,0,{emissive:color,emissiveIntensity:2});
  const front=cyl(head,[0,0,.265],.16,.02,emission);front.rotation.x=Math.PI/2;
  const light=new THREE.SpotLight(color,420,19,.34,.85,2);light.name='rim-light-'+i;light.position.z=.3;head.add(light);
  light.target=node('rim-target-'+i,head,[0,0,12]);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.normalBias=.035;
  const uniforms={color:{value:color},strength:{value:.035}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
   vertexShader:'varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; void main(){vUv=uv; vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}',
   fragmentShader:'uniform vec3 color; uniform float strength; varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; void main(){float edge=pow(abs(dot(normalize(vNormal),normalize(vView))),1.5);float fade=sin(clamp(vUv.y,0.,1.)*3.14159265);gl_FragColor=vec4(color,strength*edge*fade);}' });owned.push(material);
  const geo=own(new THREE.CylinderGeometry(.09,2.4,10,48,12,true));geo.rotateX(-Math.PI/2);geo.translate(0,0,5.3);
  const beam=new THREE.Mesh(geo,material);beam.name='haze-beam-'+i;beam.castShadow=false;head.add(beam);
  records.push({head,light,emission,uniforms,x});
 }
 const count=650,pos=new Float32Array(count*3),phase=new Float32Array(count);
 for(let i=0;i<count;i++){pos[i*3]=(random()-.5)*18;pos[i*3+1]=.5+random()*5;pos[i*3+2]=-8+random()*15;phase[i]=random()*Math.PI*2;}
 const geometry=own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));geometry.setAttribute('phase',new THREE.BufferAttribute(phase,1));
 const uniforms={theta:{value:0},motion:{value:1},density:{value:.35}};
 const dustMat=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute float phase;uniform float theta;uniform float motion;varying float opacity;void main(){vec3 p=position;p+=motion*vec3(.18*sin(theta+phase),.14*sin(theta*2.+phase),.12*cos(theta+phase));vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(15./max(1.,-v.z),1.,3.);opacity=.2+.8*pow(.5+.5*sin(theta+phase),4.);}',
  fragmentShader:'uniform float density;varying float opacity;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.82,.9,1.,pow(1.-d,2.)*opacity*density);}' });owned.push(dustMat);
 const dust=new THREE.Points(geometry,dustMat);dust.name='floating-dust';dust.frustumCulled=false;root.add(dust);
 return {update(theta,motion,v){const t=v.demo?theta:0;uniforms.theta.value=t*motion;uniforms.motion.value=motion;uniforms.density.value=v.dust;for(const [i,r]of records.entries()){r.head.rotation.set(.30+.045*Math.sin(t+i*Math.PI)*motion,(i?-.60:.60)+.07*Math.sin(t)*motion,0);r.light.intensity=420*v.rimDimmer;r.emission.emissiveIntensity=2*v.rimDimmer;r.uniforms.strength.value=.05*v.haze*v.rimDimmer;}},dispose(){owned.forEach(m=>m.dispose());}};
}
