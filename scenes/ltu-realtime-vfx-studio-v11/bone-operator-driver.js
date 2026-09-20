import * as THREE from 'three';

// Small CCD arm solver for an externally supplied avatar. No avatar is bundled.
// Bone positions define the proportions; motion limits and finger posing belong to the host.
export function createBoneOperatorDriver({avatarRoot,bones,rootOffset=[0,0,0],iterations=12}){
 const required=['leftUpperArm','leftLowerArm','leftHand','rightUpperArm','rightLowerArm','rightHand'];
 if(!avatarRoot?.isObject3D||required.some(k=>!bones[k]?.isObject3D))throw TypeError('Avatar root and six arm Object3D bones required');
 if(!Number.isInteger(iterations)||iterations<1||iterations>32)throw RangeError('iterations must be 1..32');
 const saved=required.map(k=>({bone:bones[k],q:bones[k].quaternion.clone()}));
 const p=new THREE.Vector3(),end=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),target=new THREE.Vector3(),parentQ=new THREE.Quaternion(),delta=new THREE.Quaternion(),worldQ=new THREE.Quaternion();
 const errors={left:0,right:0};
 function solve(side,pose){
  target.fromArray(pose.position);const hand=bones[side+'Hand'],joints=[bones[side+'LowerArm'],bones[side+'UpperArm']];
  // Begin from the same rest pose each solve, so seeks do not accumulate drift.
  for(const joint of joints){joint.quaternion.copy(saved.find(v=>v.bone===joint).q);}
  avatarRoot.updateWorldMatrix(true,true);
  for(let i=0;i<iterations;i++){
   hand.getWorldPosition(end);if(end.distanceToSquared(target)<.000004)break;
   for(const joint of joints){
    joint.getWorldPosition(p);hand.getWorldPosition(end);a.copy(end).sub(p);b.copy(target).sub(p);if(a.lengthSq()<1e-10||b.lengthSq()<1e-10)continue;
    delta.setFromUnitVectors(a.normalize(),b.normalize());joint.getWorldQuaternion(worldQ);worldQ.premultiply(delta);
    if(joint.parent){joint.parent.getWorldQuaternion(parentQ).invert();worldQ.premultiply(parentQ);}
    joint.quaternion.copy(worldQ).normalize();joint.updateWorldMatrix(true,true);
   }
  }
  hand.getWorldPosition(end);errors[side]=end.distanceTo(target);
 }
 return {
  errors,
  setRootPose(pose){p.fromArray(pose.position);worldQ.fromArray(pose.quaternion);a.fromArray(rootOffset).applyQuaternion(worldQ);p.add(a);if(avatarRoot.parent){avatarRoot.parent.updateWorldMatrix(true,false);avatarRoot.parent.worldToLocal(p);avatarRoot.parent.getWorldQuaternion(parentQ).invert();worldQ.premultiply(parentQ);}avatarRoot.position.copy(p);avatarRoot.quaternion.copy(worldQ);avatarRoot.updateWorldMatrix(true,true);},
  setHandTargets({left,right}){solve('left',left);solve('right',right);},
  release(){for(const s of saved)s.bone.quaternion.copy(s.q);avatarRoot.updateWorldMatrix(true,true);}
 };
}
