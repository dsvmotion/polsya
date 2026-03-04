# AI Embeddings (OpenAI)

Edge function para generar embeddings de texto mediante OpenAI. Útil para búsqueda semántica, RAG y similitud.

---

## Variables de entorno

En Supabase Dashboard → **Edge Functions** → **Secrets**:

| Variable | Descripción |
|----------|-------------|
| `OPENAI_API_KEY` | API key de OpenAI (la misma que usa ai-chat-proxy) |
| `OPENAI_EMBEDDING_MODEL` | Opcional. Por defecto: `text-embedding-3-small` |

---

## Desplegar

```bash
supabase functions deploy ai-embeddings
```

---

## Uso (API)

**Endpoint:** `POST /functions/v1/ai-embeddings`

**Headers:** `Authorization: Bearer <supabase_anon_key>` + sesión activa (o JWT de usuario).

**Body (texto único):**
```json
{ "text": "Tu texto a transformar en embedding" }
```

**Body (múltiples textos):**
```json
{ "texts": ["Texto 1", "Texto 2", "Texto 3"] }
```

**Respuesta (texto único):**
```json
{ "embedding": [0.123, -0.456, ...] }
```

**Respuesta (múltiples):**
```json
{ "embeddings": [[...], [...], [...]] }
```

**Límites:**
- Máx. 100 textos por request
- Máx. 8000 caracteres por texto
- Requiere rol admin/manager/rep/ops en la organización

---

## Ejemplo desde el frontend

```typescript
const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-embeddings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`,
  },
  body: JSON.stringify({ text: 'Farmacia San Juan en Madrid' }),
});
const { embedding } = await res.json();
// embedding: number[] (1536 dims para text-embedding-3-small)
```
