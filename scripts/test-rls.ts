import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

async function main() {
  const supabase = createClient(url, anon)

  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .limit(3)

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .limit(3)

  const { data: orders, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .limit(3)

  console.log('categories:', { ok: !catErr, count: categories?.length ?? 0, error: catErr?.message })
  console.log('products:', { ok: !prodErr, count: products?.length ?? 0, error: prodErr?.message })
  console.log('orders:', { ok: !orderErr, count: orders?.length ?? 0, error: orderErr?.message })
}

main()
