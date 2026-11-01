import test from 'node:test';
import assert from 'node:assert/strict';
import comments from './api/comments.js';
import privateComments from './api/admin-comments.js';

function response() {
  return { headers: {}, code: 200, setHeader(k,v){this.headers[k]=v;}, status(code){this.code=code;return this;}, end(){return this;}, send(body){this.body=body;return this;}, json(body){this.body=body;return this;} };
}
test('public comments API cannot read existing messages, including via pagination', async () => {
  for (const method of ['GET','HEAD','PUT']) {
    const res = response();
    await comments({method,headers:{},query:{before:'100'}},res);
    assert.equal(res.code,405);
    assert.equal(res.headers.Allow,'POST');
    assert.equal(res.body,undefined);
    assert.equal(res.headers['Cache-Control'],'no-store');
  }
});
test('private messages require authentication before database access', async () => {
  process.env.ADMIN_PASSWORD='test-password-more-than-16';
  for(const authorization of [undefined,'Basic '+Buffer.from('admin:wrong').toString('base64')]) {
    const res=response();
    await privateComments({method:'GET',headers:{authorization}},res);
    assert.equal(res.code,401);
    assert.match(res.headers['WWW-Authenticate'],/^Basic/);
    assert.equal(res.headers['Cache-Control'],'no-store');
  }
});
test('authenticated private messages reject invalid pagination',async()=>{
  process.env.ADMIN_PASSWORD='test-password-more-than-16';
  const authorization='Basic '+Buffer.from('admin:'+process.env.ADMIN_PASSWORD).toString('base64');
  for(const before of ['<script>','9999999999999999999']) {
    const res=response();
    await privateComments({method:'GET',headers:{authorization},query:{before}},res);
    assert.equal(res.code,400);
  }
});
