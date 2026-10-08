const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const code = fs.readFileSync(require('node:path').join(__dirname, '../dist/server/index.js'), 'utf8');
  const {default: worker} = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  for (const route of ['/', '/studio', '/comparison', '/timeline', '/report', '/timeline/', '/visitor', '/operator', '/traffic', '/visitor/']) {
    const response = await worker.fetch(new Request('https://example.test' + route), {});
    assert.equal(response.status, 200, route);
    assert.match(await response.text(), /src="pages.js"/, route);
  }
  assert.equal((await worker.fetch(new Request('https://example.test/pages.js'), {})).status, 200);
  assert.equal((await worker.fetch(new Request('https://example.test/missing'), {})).status, 404);
  console.log('PASS: production worker serves every page directly and preserves unknown-route 404s.');
})().catch(error => {console.error(error); process.exitCode = 1;});
