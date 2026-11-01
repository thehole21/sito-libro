import {database,fingerprint,device,privateHeaders,sameOrigin} from '../lib/server.js';
import {ensureAudioSchema,deviceDetails,playedSeconds,saveAudioSession} from '../lib/audio-stats.js';
import {audioBook} from '../lib/audio-book.js';
let schemaReady;

export default async function handler(req,res) {
  privateHeaders(res);
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
  if(!sameOrigin(req))return res.status(403).end();
  if(/bot|crawler|spider|headless/i.test(req.headers['user-agent']||''))return res.status(204).end();
  let body,listened;
  try {
    body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!body || JSON.stringify(body).length>60000 || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.session||'') || body.book!==audioBook.id)throw Error();
    listened=playedSeconds(body.ranges,audioBook.duration);
  } catch {return res.status(400).json({error:'Evento non valido.'});}
  if(listened<=0)return res.status(204).end();
  try {
    const sql=database();
    if(!schemaReady) schemaReady=ensureAudioSchema(sql).catch(error=>{schemaReady=undefined;throw error;});
    await schemaReady;
    await saveAudioSession(sql,{session:body.session,book:audioBook.id,visitor:fingerprint(req),device:device(req),...deviceDetails(req.headers['user-agent']),duration:audioBook.duration,listened});
    return res.status(204).end();
  } catch {return res.status(503).end();}
}
