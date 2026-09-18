const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:3000'

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  return { status: res.status, ok: res.ok, json, headers: res.headers }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function run() {
  const failures = []
  const ok = []

  async function check(name, fn) {
    try {
      await fn()
      ok.push(name)
      console.log(`PASS  ${name}`)
    } catch (e) {
      failures.push(`${name}: ${e.message}`)
      console.log(`FAIL  ${name}: ${e.message}`)
    }
  }

  await check('GET / serves HTML', async () => {
    const res = await fetch(`${BASE}/`)
    assert(res.ok, `status ${res.status}`)
    const html = await res.text()
    assert(html.includes('<div id="root">'), 'missing root mount')
  })

  await check('GET /api/profile', async () => {
    const r = await req('GET', '/api/profile')
    assert(r.ok, `status ${r.status}`)
    assert(r.json && r.json.id === 1, 'profile id bukan 1')
  })

  await check('GET /api/entries is array', async () => {
    const r = await req('GET', '/api/entries')
    assert(r.ok, `status ${r.status}`)
    assert(Array.isArray(r.json), 'bukan array')
  })

  await check('GET /api/tasks is array', async () => {
    const r = await req('GET', '/api/tasks')
    assert(r.ok, `status ${r.status}`)
    assert(Array.isArray(r.json), 'bukan array')
  })

  await check('GET /api/subjects is array', async () => {
    const r = await req('GET', '/api/subjects')
    assert(r.ok, `status ${r.status}`)
    assert(Array.isArray(r.json), 'bukan array')
  })

  await check('GET /api/quick-notes without tanggal -> 400', async () => {
    const r = await req('GET', '/api/quick-notes')
    assert(r.status === 400, `expected 400 got ${r.status}`)
  })

  await check('POST /api/ai/generate empty prompt -> 400', async () => {
    const r = await req('POST', '/api/ai/generate', { prompt: '   ' })
    assert(r.status === 400, `expected 400 got ${r.status}`)
  })

  await check('POST /api/ai/rephrase empty text -> 400', async () => {
    const r = await req('POST', '/api/ai/rephrase', { text: '' })
    assert(r.status === 400, `expected 400 got ${r.status}`)
  })

  await check('POST /api/entries missing fields -> 400', async () => {
    const r = await req('POST', '/api/entries', { tanggal: '2026-09-09' })
    assert(r.status === 400, `expected 400 got ${r.status}`)
  })

  await check('POST /api/tasks missing fields -> 400', async () => {
    const r = await req('POST', '/api/tasks', { title: 'x' })
    assert(r.status === 400, `expected 400 got ${r.status}`)
  })

  let createdSubjectId = null
  const smokeName = `__smoke_${Date.now()}`

  await check('CRUD subject smoke', async () => {
    const created = await req('POST', '/api/subjects', { name: smokeName })
    assert(created.status === 201, `create status ${created.status} ${JSON.stringify(created.json)}`)
    createdSubjectId = created.json.id
    const dup = await req('POST', '/api/subjects', { name: smokeName })
    assert(dup.status === 400, `duplicate should 400, got ${dup.status}`)
    const del = await req('DELETE', `/api/subjects/${createdSubjectId}`)
    assert(del.ok, `delete status ${del.status}`)
    createdSubjectId = null
  })

  await check('CRUD task smoke', async () => {
    const created = await req('POST', '/api/tasks', { title: `__smoke_task_${Date.now()}`, category: 'other' })
    assert(created.status === 201, `create status ${created.status} ${JSON.stringify(created.json)}`)
    const id = created.json.id
    const updated = await req('PUT', `/api/tasks/${id}`, { status: 'in_progress' })
    assert(updated.ok, `update status ${updated.status}`)
    assert(updated.json.status === 'in_progress', 'status tidak berubah')
    const soft = await req('DELETE', `/api/tasks/${id}`)
    assert(soft.ok, `soft delete ${soft.status}`)
    const trash = await req('GET', '/api/tasks/trash')
    assert(trash.json.some((t) => t.id === id), 'task tidak ada di trash')
    const restore = await req('POST', `/api/tasks/${id}/restore`)
    assert(restore.ok, `restore ${restore.status}`)
    const force = await req('DELETE', `/api/tasks/${id}/force`)
    assert(force.ok, `force delete ${force.status}`)
  })

  await check('CRUD quick-note smoke', async () => {
    const tanggal = '2099-01-01'
    const created = await req('POST', '/api/quick-notes', { tanggal, teks: 'catatan smoke test' })
    assert(created.status === 201, `create ${created.status}`)
    const list = await req('GET', `/api/quick-notes?tanggal=${tanggal}`)
    assert(list.json.some((n) => n.id === created.json.id), 'note tidak muncul')
    const used = await req('PUT', '/api/quick-notes/mark-used', { ids: [created.json.id] })
    assert(used.ok, `mark-used ${used.status}`)
    const after = await req('GET', `/api/quick-notes?tanggal=${tanggal}`)
    assert(!after.json.some((n) => n.id === created.json.id), 'note masih isUsed=0')
    const del = await req('DELETE', `/api/quick-notes/${created.json.id}`)
    assert(del.ok, `delete ${del.status}`)
  })

  await check('unknown API path is not JSON crash', async () => {
    const r = await req('GET', '/api/does-not-exist')
    assert(r.status === 404, `expected 404 got ${r.status}`)
  })

  if (createdSubjectId) {
    await req('DELETE', `/api/subjects/${createdSubjectId}`)
  }

  console.log(`\n${ok.length} passed, ${failures.length} failed`)
  if (failures.length) {
    process.exitCode = 1
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
