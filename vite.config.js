import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function apiDevPlugin() {
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/review')) return next()

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const env = loadEnv('development', process.cwd(), '')
          if (env.ANTHROPIC_API_KEY) {
            process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY.trim()
          }

          const raw = await readBody(req)
          const handler = (await import('./api/review.js')).default

          const mockReq = { method: 'POST', body: JSON.parse(raw || '{}') }
          const mockRes = {
            statusCode: 200,
            status(code) {
              this.statusCode = code
              return this
            },
            json(data) {
              res.statusCode = this.statusCode
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            }
          }

          await handler(mockReq, mockRes)
        } catch (err) {
          console.error('API dev error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()]
})
