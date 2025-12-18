import 'dotenv/config'
import { readFile } from 'fs/promises'
import { join } from 'path'

async function main() {
  // Login
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001'
  const adminPassword = process.env.ADMIN_PASSWORD || 'a123456'
  const loginResp = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lanchonete.com', password: adminPassword })
  })
  const loginJson = await loginResp.json()
  if (!loginResp.ok) {
    console.error('Falha no login:', loginResp.status, loginJson)
    process.exit(1)
  }
  const token: string = loginJson?.data?.tokens?.accessToken
  if (!token) {
    console.error('Token não retornado no login:', loginJson)
    process.exit(1)
  }

  // Preparar FormData com imagem
  const localImagePath = join(process.cwd(), 'public', 'uploads', 'images', '1759475022418_7w8dn77cnk6.png')
  const bytes = await readFile(localImagePath)
  const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' })
  const form = new FormData()
  form.append('image', blob, 'test-api.png')

  const uploadResp = await fetch(`${baseUrl}/api/upload/image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  })
  const uploadJson = await uploadResp.json()
  console.log('upload status:', uploadResp.status)
  console.log('upload result:', uploadJson)
}

main()
