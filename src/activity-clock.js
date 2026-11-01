// A conservative estimate: visible page, recent interaction, no suspended timers.
export function createActivityClock(now, visible = true) {
  let activeMs=0, lastSample=now, lastInteraction=now, foreground=visible;
  function sample(time) {
    const gap=time-lastSample;
    if(foreground && gap>=0 && gap<=10000) {
      activeMs+=Math.max(0,Math.min(time,lastInteraction+60000)-lastSample);
    }
    lastSample=time;
  }
  return {
    interact(time){sample(time);lastInteraction=time;},
    visibility(time,visible){sample(time);foreground=visible;},
    snapshot(time){sample(time);return {activeSeconds:Math.floor(activeMs/1000),lastActivityAgo:Math.max(0,Math.floor((time-lastInteraction)/1000))};}
  };
}
