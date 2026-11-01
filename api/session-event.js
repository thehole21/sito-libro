import {database,fingerprint,device,privateHeaders,sameOrigin} from '../lib/server.js';
import {deviceDetails} from '../lib/audio-stats.js';
import {ensureVisitSchema,validSessionEvent,saveVisitSession} from '../lib/visit-sessions.js';
let schemaReady;

export default async function handler(req,res) {
  privateHeaders(res);
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
  if(!sameOrigin(req))return res.status(403).end();
  if(/bot|crawler|spider|headless/i.test(req.headers['user-agent']||''))return res.status(204).end();
  let body;
  try {
    body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(JSON.stringify(body).length>2000||!validSessionEvent(body))throw Error();
  } catch {return res.status(400).json({error:'Evento non valido.'});}
  try {
    const sql=database();
    if(!schemaReady)schemaReady=ensureVisitSchema(sql).catch(error=>{schemaReady=undefined;throw error;});
    await schemaReady;
    await saveVisitSession(sql,{...body,visitor:fingerprint(req),device:device(req),...deviceDetails(req.headers['user-agent'])});
    return res.status(204).end();
  } catch {return res.status(503).end();}
}
