import React, {useEffect,useRef,useState} from 'react';
import {audioBook} from '../lib/audio-book.js';

export default function AudioPlayer({src}) {
  const ref=useRef(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const audio=ref.current;
    const session=crypto.randomUUID();
    let lastSent=0;
    function send(final=false) {
      const ranges=Array.from({length:Math.min(audio.played.length,1500)},(_,i)=>[audio.played.start(i),audio.played.end(i)]);
      if(!ranges.length)return;
      const body=JSON.stringify({session,book:audioBook.id,ranges});
      if(final && navigator.sendBeacon?.('/api/audio-event',new Blob([body],{type:'application/json'})))return;
      fetch('/api/audio-event',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
    }
    function update(){if(Date.now()-lastSent>=15000){lastSent=Date.now();send();}}
    function finish(){send(true);}
    function hide(){if(document.visibilityState==='hidden')finish();}
    audio.addEventListener('timeupdate',update);
    audio.addEventListener('pause',finish);
    audio.addEventListener('ended',finish);
    document.addEventListener('visibilitychange',hide);
    window.addEventListener('pagehide',finish);
    return ()=>{finish();audio.removeEventListener('timeupdate',update);audio.removeEventListener('pause',finish);audio.removeEventListener('ended',finish);document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',finish);};
  },[src]);
  return <><audio ref={ref} controls playsInline preload="metadata" src={src} aria-label="Ascolta l’audiolibro completo" onCanPlay={()=>setFailed(false)} onError={()=>setFailed(true)} /><p className="small">Audiolibro completo · 1 ora e 49 minuti<br />Premi ▶ per iniziare ad ascoltare.</p>{failed&&<p role="status">Il player non riesce ad aprire l’audio. <a href={src}>Apri l’audiolibro</a>.</p>}</>;
}
