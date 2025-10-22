// Utilitário para Supabase Storage (upload, URL pública, delete)

const getEnv = () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  }
  return { url, serviceKey };
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { url } = getEnv();
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
};

export const uploadBinary = async (
  bucket: string,
  path: string,
  data: Buffer | Uint8Array,
  contentType: string,
  upsert: boolean = true
) => {
  const { url, serviceKey } = getEnv();
  const endpoint = `${url}/storage/v1/object/${bucket}/${encodeURI(path)}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'x-upsert': upsert ? 'true' : 'false',
      },
      body: data as any,
    });
  } catch (networkErr: any) {
    throw new Error(`Falha de rede ao enviar para Supabase: ${networkErr?.message || networkErr}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro no upload (${endpoint}): ${res.status} ${res.statusText} - ${text}`);
  }

  return {
    bucket,
    path,
    publicUrl: getPublicUrl(bucket, path),
  };
};

export const deleteObject = async (bucket: string, path: string) => {
  const { url, serviceKey } = getEnv();
  const endpoint = `${url}/storage/v1/object/${bucket}/${encodeURI(path)}`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
    });
  } catch (networkErr: any) {
    throw new Error(`Falha de rede ao deletar no Supabase: ${networkErr?.message || networkErr}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ao deletar objeto (${endpoint}): ${res.status} ${res.statusText} - ${text}`);
  }
  return true;
};