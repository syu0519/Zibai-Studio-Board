// Host-neutral bridge. The caller supplies its avatar placement and IK implementation.
// This module does not create people or claim a built-in Pocket VP avatar integration.
export function bindOperator(instance,driver,stationId='crane-console'){
 if(!instance?.api)throw TypeError('Scene instance with api required');
 if(typeof driver?.setRootPose!=='function'||typeof driver?.setHandTargets!=='function')throw TypeError('Driver must implement setRootPose and setHandTargets');
 if(!instance.api.listStations().includes(stationId))throw RangeError('Unknown station');
 let active=true;
 function sync(){if(!active)return;const pose=instance.api.getInteractionPose(stationId);driver.setRootPose(pose.feet);driver.setHandTargets({left:pose.leftHand,right:pose.rightHand});return pose;}
 return {sync,command(patch){if(!active)throw Error('Binding disconnected');instance.api.setState(patch);return sync();},disconnect(){active=false;driver.release?.();}};
}
