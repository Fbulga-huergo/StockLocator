// Función serverless de Vercel: almacena el inventario compartido en Redis.
//
// No requiere instalar paquetes: habla con Redis por su API REST (Upstash).
// Variables de entorno que inyecta la integración de Redis/Upstash en Vercel
// (se aceptan los dos nombres habituales):
//   KV_REST_API_URL / KV_REST_API_TOKEN        (Vercel Marketplace · Upstash)
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//
// Opcional: WRITE_PASSWORD -> si está definida, sólo se permite escribir si el
// cliente envía el header "x-write-password" con ese valor.

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'depo-inventario'

async function redis(command) {
  const r = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await r.json()
  if (json.error) throw new Error(json.error)
  return json.result
}

export default async function handler(req, res) {
  if (!REST_URL || !REST_TOKEN) {
    res.status(500).json({
      error:
        'Falta configurar Redis. En Vercel: Storage -> crear base Redis/Upstash y volver a desplegar.',
    })
    return
  }

  try {
    if (req.method === 'GET') {
      const val = await redis(['GET', KEY])
      const data = val ? JSON.parse(val) : { shelves: [] }
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json(data)
      return
    }

    if (req.method === 'POST') {
      const pass = process.env.WRITE_PASSWORD
      if (pass && req.headers['x-write-password'] !== pass) {
        res.status(401).json({ error: 'No autorizado' })
        return
      }
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      if (!Array.isArray(body.shelves)) {
        res.status(400).json({ error: 'Se esperaba un objeto con "shelves".' })
        return
      }
      await redis(['SET', KEY, JSON.stringify({ shelves: body.shelves })])
      res.status(200).json({ ok: true })
      return
    }

    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ error: 'Método no permitido' })
  } catch (err) {
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  }
}
