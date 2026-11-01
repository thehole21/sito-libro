import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {playedSeconds,ensureAudioSchema,saveAudioSession,audioDashboard,deviceDetails} from './lib/audio-stats.js';
import audioEvent from './api/audio-event.js';

test('seek to the end is partial and replayed intervals are counted once',()=>{
  assert.equal(playedSeconds([[990,1000]],1000),10);
  assert.equal(playedSeconds([[0,60],[30,90],[0,60]],1000),90);
  assert.equal(playedSeconds([[500,1000],[0,500]],1000),1000);
  assert.throws(()=>playedSeconds([[0,Infinity]],1000));
  assert.throws(()=>playedSeconds([[-1,100]],1000));
  assert.throws(()=>playedSeconds([[0,2000]],1000));
});

test('audio sessions persist monotonically and admin distinguishes unique listeners',async()=>{
  const db=new PGlite();
  const sql=async(strings,...values)=>{
    const query=strings.reduce((result,text,index)=>result+(index?'$'+index:'')+text,'');
    return (await db.query(query,values)).rows;
  };
  try {
    await ensureAudioSchema(sql);
    await ensureAudioSchema(sql);
    const record={session:'00000000-0000-4000-8000-000000000001',book:'book',visitor:'visitor-a',device:'Telefono',browser:'Safari',os:'iOS',duration:1000,listened:10};
    await saveAudioSession(sql,record);
    await saveAudioSession(sql,{...record,listened:990});
    await saveAudioSession(sql,{...record,listened:20});
    let rows=(await db.query('SELECT * FROM audio_sessions')).rows;
    assert.equal(rows.length,1);assert.equal(rows[0].listened,990);assert.equal(rows[0].completed,true);
    await saveAudioSession(sql,{...record,visitor:'visitor-b',listened:1000});
    rows=(await db.query('SELECT * FROM audio_sessions')).rows;
    assert.equal(rows[0].visitor,'visitor-a');assert.equal(rows[0].listened,990);
    await saveAudioSession(sql,{...record,session:'00000000-0000-4000-8000-000000000002',listened:80});
    await saveAudioSession(sql,{...record,session:'00000000-0000-4000-8000-000000000003',visitor:'visitor-b',device:'<script>',listened:50});
    const html=await audioDashboard(sql);
    assert.match(html,/<strong>2<\/strong>Dispositivi stimati/);
    assert.match(html,/<strong>3<\/strong>Sessioni di ascolto/);
    assert.match(html,/<strong>1<\/strong>Dispositivi con ascolto completo/);
    assert.match(html,/<strong>1<\/strong>Dispositivi con solo ascolti parziali/);
    assert.match(html,/Completo \(≥98%\)/);assert.match(html,/Parziale/);
    assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
  } finally {await db.close();}
});

test('device details report browser and OS without claiming a personal device name',()=>{
  assert.deepEqual(deviceDetails('Mozilla/5.0 (iPhone) Version/18 Safari/605'),{os:'iOS / iPadOS',browser:'Safari'});
  assert.deepEqual(deviceDetails('Mozilla/5.0 (Windows NT 10.0) Chrome/130 Edg/130'),{os:'Windows',browser:'Edge'});
});

test('audio endpoint never exposes telemetry publicly and rejects invalid events',async()=>{
  function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},end(){return this;},json(body){this.body=body;return this;}};}
  let res=response();await audioEvent({method:'GET',headers:{}},res);assert.equal(res.code,405);
  res=response();await audioEvent({method:'POST',headers:{origin:'https://other.example',host:'book.example'}},res);assert.equal(res.code,403);
  res=response();await audioEvent({method:'POST',headers:{},body:{session:'invalid'}},res);assert.equal(res.code,400);
});
