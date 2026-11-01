import {neon} from '@neondatabase/serverless';
import {createHmac,timingSafeEqual} from 'node:crypto';
export function database(){if(!process.env.DATABASE_URL)throw Error('Missing database');return neon(process.env.DATABASE_URL)}
export function privateHeaders(res){res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow')}
export function sameOrigin(req){const origin=req.headers.origin;return !origin||origin===`https://${req.headers.host}`||origin===`http://${req.headers.host}`}
export function fingerprint(req,period=new Date().toISOString().slice(0,7)){const secret=process.env.ANALYTICS_SECRET;if(!secret||secret.length<32)throw Error('Missing secret');const ip=(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();return createHmac('sha256',secret).update(period+'|'+ip+'|'+(req.headers['user-agent']||'')).digest('hex')}
export function device(req){const ua=req.headers['user-agent']||'';return /ipad|tablet/i.test(ua)?'Tablet':/mobi|iphone|android/i.test(ua)?'Telefono':'Computer / altro'}
export function authorized(req){const expected=process.env.ADMIN_PASSWORD;if(!expected||expected.length<16)return false;const header=req.headers.authorization||'';if(!header.startsWith('Basic '))return false;const value=Buffer.from(header.slice(6),'base64').toString();const expectedBytes=Buffer.from('admin:'+expected);const actual=Buffer.from(value);return actual.length===expectedBytes.length&&timingSafeEqual(actual,expectedBytes)}
export function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
