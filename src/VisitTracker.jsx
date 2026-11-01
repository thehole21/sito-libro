import {useEffect} from 'react';
import {createActivityClock} from './activity-clock.js';

export default function VisitTracker() {
  useEffect(()=>{
    const session=crypto.randomUUID();
    const clock=createActivityClock(performance.now(),document.visibilityState==='visible'&&document.hasFocus());
    const events=['pointerdown','pointermove','keydown','scroll','touchstart'];
    let lastSend=0, lastInput=0;
    function send(final=false) {
      const body=JSON.stringify({session,...clock.snapshot(performance.now())});
      lastSend=performance.now();
      if(final&&navigator.sendBeacon?.('/api/session-event',new Blob([body],{type:'application/json'})))return;
      fetch('/api/session-event',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
    }
    function interact(){const now=performance.now();if(now-lastInput>250){clock.interact(now);lastInput=now;}}
    function visibility(){clock.visibility(performance.now(),document.visibilityState==='visible'&&document.hasFocus());if(document.visibilityState==='hidden')send(true);}
    function focus(){clock.visibility(performance.now(),document.visibilityState==='visible');clock.interact(performance.now());send();}
    function blur(){clock.visibility(performance.now(),false);send(true);}
    function exit(){clock.visibility(performance.now(),false);send(true);}
    function restored(){visibility();if(document.visibilityState==='visible'){clock.interact(performance.now());send();}}
    for(const event of events)document.addEventListener(event,interact,{passive:true});
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('focus',focus);window.addEventListener('blur',blur);
    window.addEventListener('pagehide',exit);window.addEventListener('pageshow',restored);
    send();
    const timer=setInterval(()=>{
      clock.snapshot(performance.now());
      if(document.visibilityState==='visible'&&performance.now()-lastSend>=15000)send();
    },5000);
    return ()=>{
      exit();clearInterval(timer);
      for(const event of events)document.removeEventListener(event,interact);
      document.removeEventListener('visibilitychange',visibility);
      window.removeEventListener('focus',focus);window.removeEventListener('blur',blur);
      window.removeEventListener('pagehide',exit);window.removeEventListener('pageshow',restored);
    };
  },[]);
  return null;
}
