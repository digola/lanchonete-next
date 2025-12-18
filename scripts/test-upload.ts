import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join } from 'path'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) as string
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET as string

  if (!url || !serviceKey || !bucket) {
    console.error('Configuração faltando. Verifique URL, SERVICE KEY e BUCKET no .env')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey)

  // Usar uma imagem existente do projeto para teste
  const localImagePath = join(process.cwd(), 'public', 'uploads', 'images', '1759475022418_7w8dn77cnk6.png')
  const fileBytes = await readFile(localImagePath)
  const fileName = `test_${Date.now()}.png`
  const storagePath = `tests/${fileName}`

  const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBytes, {
    contentType: 'image/png',
    upsert: true,
  })

  if (error) {
    console.error('Falha no upload:', error.message)
    process.exit(1)
  }

  const publicUrl = `${url}/storage/v1/object/public/${bucket}/${storagePath}`
  console.log('Upload OK:', publicUrl)
}

main()
