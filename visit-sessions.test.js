import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {createActivityClock} from './src/activity-clock.js';
import {ensureVisitSchema,saveVisitSession,visitDashboard,validSessionEvent} from './lib/visit-sessions.js';
import handler from './api/session-event.js';

test('active time pauses after inactivity, while hidden and during suspension',()=>{
  const clock=createActivityClock(0,true);
  for(let t=5000;t<=90000;t+=5000)clock.snapshot(t);
  assert.equal(clock.snapshot(90000).activeSeconds,60);
  clock.interact(90000);clock.snapshot(95000);
  assert.equal(clock.snapshot(100000).activeSeconds,70);
  clock.visibility(100000,false);clock.snapshot(105000);clock.snapshot(110000);
  assert.equal(clock.snapshot(115000).activeSeconds,70);
  clock.visibility(115000,true);clock.interact(115000);
  assert.equal(clock.snapshot(120000).activeSeconds,75);
  assert.equal(clock.snapshot(500000).activeSeconds,75);
  assert.equal(clock.snapshot(500000).lastActivityAgo,385);
});

test('session data is validated and the public endpoint cannot read history',async()=>{
  assert.equal(validSessionEvent({session:'bad',activeSeconds:0,lastActivityAgo:0}),false);
  assert.equal(validSessionEvent({session:'00000000-0000-4000-8000-000000000001',activeSeconds:-1,lastActivityAgo:0}),false);
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},end(){return this;}};
  await handler({method:'GET',headers:{}},res);assert.equal(res.code,405);assert.equal(res.headers.Allow,'POST');
});

test('visit storage deduplicates heartbeats, caps time and preserves private pagination',async()=>{
  const db=new PGlite();
  const sql=async(strings,...values)=>(await db.query(strings.reduce((q,s,i)=>q+(i?'$'+i:'')+s,''),values)).rows;
  try {
    await ensureVisitSchema(sql);await ensureVisitSchema(sql);
    const record={session:'00000000-0000-4000-8000-000000000001',visitor:'visitor-one',device:'Telefono',browser:'Safari',os:'iOS',activeSeconds:0,lastActivityAgo:0};
    await saveVisitSession(sql,record);
    await db.query("UPDATE visit_sessions SET entered_at=now()-interval '2 minutes',last_activity_at=now()-interval '1 minute'");
    await saveVisitSession(sql,{...record,activeSeconds:50,lastActivityAgo:10});
    await saveVisitSession(sql,{...record,activeSeconds:20,lastActivityAgo:60});
    let rows=(await db.query('SELECT * FROM visit_sessions')).rows;
    assert.equal(rows.length,1);assert.equal(rows[0].active_seconds,50);
    assert.ok(new Date(rows[0].last_seen_at)-new Date(rows[0].last_activity_at)<20000);
    await saveVisitSession(sql,{...record,activeSeconds:100000,lastActivityAgo:0});
    rows=(await db.query('SELECT * FROM visit_sessions')).rows;
    assert.ok(rows[0].active_seconds>=120&&rows[0].active_seconds<=140);
    await saveVisitSession(sql,{...record,visitor:'different',activeSeconds:0});
    rows=(await db.query('SELECT * FROM visit_sessions')).rows;
    assert.equal(rows[0].visitor,'visitor-one');
    await saveVisitSession(sql,{...record,session:'00000000-0000-4000-8000-000000000002',device:'<script>'});
    const html=await visitDashboard(sql);
    assert.match(html,/<strong>2<\/strong>Sessioni registrate/);
    assert.ok(html.includes('Europe/Rome'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
    const older=await visitDashboard(sql,'1');assert.ok(older.includes('Nessuna nuova sessione registrata'));
    const invalid=await visitDashboard(sql,'<script>');assert.ok(invalid.includes('Pagina non valida'));
  }finally{await db.close();}
});
