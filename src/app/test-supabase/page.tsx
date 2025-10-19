import { createClient } from '@/utils/supabase/server'

export default async function TestSupabasePage() {
  const supabase = await createClient()

  // Testando conexão com uma tabela que sabemos que existe (categories)
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Erro ao buscar categorias:', error)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Integração Supabase</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Status da Conexão:</h2>
        <p className={`p-2 rounded ${error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {error ? `Erro: ${error.message}` : 'Conexão estabelecida com sucesso!'}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Categorias encontradas:</h2>
        {categories && categories.length > 0 ? (
          <ul className="space-y-2">
            {categories.map((category: any) => (
              <li key={category.id} className="p-2 bg-gray-100 rounded">
                <strong>{category.name}</strong>
                {category.description && <p className="text-sm text-gray-600">{category.description}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Nenhuma categoria encontrada (banco vazio)</p>
        )}
      </div>
    </div>
  )
}