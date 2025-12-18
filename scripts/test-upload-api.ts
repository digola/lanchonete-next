import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { readFile } from 'fs/promises'
import { join } from 'path'

async function main() {
  const jwtSecret = (process.env.JWT_SECRET || 'fallback-secret-key') as string
  if (!jwtSecret) {
    console.error('JWT_SECRET ausente no .env')
    process.exit(1)
  }

  const payload = {
    userId: 'test-admin',
    email: 'admin@test.local',
    role: 'ADMIN',
  }

  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: '1h',
    issuer: 'lanchonete-system',
    audience: 'lanchonete-client',
  })

  const localImagePath = join(process.cwd(), 'public', 'uploads', 'images', '1759475022418_7w8dn77cnk6.png')
  const bytes = await readFile(localImagePath)
  const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' })

  const form = new FormData()
  form.append('image', blob, 'test-api.png')

  const resp = await fetch('http://localhost:3000/api/upload/image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  const json = await resp.json()
  console.log('status:', resp.status)
  console.log('result:', json)
}

main()
