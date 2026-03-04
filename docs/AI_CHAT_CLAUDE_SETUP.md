# Claude/Anthropic en AI Chat

El assistant de chat puede usar OpenAI (por defecto) o Claude/Anthropic por organización.

---

## Configuración

### 1. API Key

En Supabase Dashboard → **Edge Functions** → **Secrets**:

| Variable | Descripción |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key de Anthropic (para usar Claude) |

### 2. Activar Claude para una organización

Por defecto todas las orgs usan OpenAI. Para que una org use Claude:

**Opción A – Desde Platform Admin (recomendado):** Entra en `/platform` → Organizaciones → clic en la org → sección **AI Chat**. Selecciona provider (OpenAI/Anthropic) y modelo, luego Guardar.

**Opción B – SQL directo:**

```sql
INSERT INTO public.ai_chat_config (organization_id, provider, model)
VALUES ('<ORG_UUID>', 'anthropic', 'claude-3-5-sonnet-20241022')
ON CONFLICT (organization_id) DO UPDATE
  SET provider = 'anthropic',
      model = 'claude-3-5-sonnet-20241022',
      updated_at = now();
```

Modelos Claude sugeridos:
- `claude-3-5-sonnet-20241022` — equilibrado
- `claude-3-opus-20240229` — más capaz
- `claude-3-haiku-20240307` — más rápido/económico

### 3. Volver a OpenAI

```sql
UPDATE public.ai_chat_config
SET provider = 'openai', model = 'gpt-4o-mini', updated_at = now()
WHERE organization_id = '<ORG_UUID>';
```

---

## Desplegar

```bash
supabase functions deploy ai-chat-proxy
```

La migración `20260306110000_ai_chat_provider.sql` añade la columna `provider` a `ai_chat_config`. Ejecuta `supabase db push` si no la has aplicado.
