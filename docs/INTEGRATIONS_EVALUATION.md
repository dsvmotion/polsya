# Evaluación de integraciones — Figma, AWS

Documento de decisión para integraciones pendientes.

---

## Figma

### Caso de uso potencial
- Sincronizar diseños, prototipos o assets de Figma con el CRM (ej. adjuntar mockups a oportunidades, entidades).
- Embed de prototipos en fichas de cliente.

### Evaluación
- **API:** Figma tiene REST API para leer archivos, nodos, comentarios.
- **OAuth:** No hay OAuth estándar; se usa Personal Access Token o OAuth2 limitado para apps de organización.
- **Complejidad:** Media. Requiere token por usuario/workspace.
- **Prioridad:** Baja. El core de Sales Compass es ventas y operaciones, no diseño. Solo priorizar si hay demanda explícita de clientes (equipos producto/design que usen Figma en el flujo comercial).

### Decisión
**Pausar.** Re-evaluar cuando exista demanda o un caso de uso claro (ej. "adjuntar diseño de propuesta a oportunidad").

---

## AWS

### Casos de uso potenciales
- **S3:** Almacenar documentos, PDFs, imágenes asociados a entidades/oportunidades.
- **Lambda:** Procesar jobs pesados (importación masiva, reportes).
- **SES:** Emails transaccionales (factura, recordatorios de pago).

### Evaluación
- **S3:** Útil para documentos. Supabase Storage puede cubrir la mayoría de casos; S3 tendría sentido si el cliente ya usa AWS o necesita integración con otros servicios AWS.
- **Lambda:** Alternativa a Edge Functions para workloads más largos o con dependencias pesadas.
- **SES:** Stripe ya envía emails de facturación; SES sería para emails personalizados o de marketing.

### Decisión
**Prioridad media-baja.** Implementar cuando:
1. Un cliente requiera S3 para almacenar documentos de forma aislada.
2. Los Edge Functions se queden cortos (timeout, memoria) y se necesite Lambda.
3. Se necesiten emails personalizados más allá de Stripe.

### Patrón sugerido
- Connector genérico `aws-s3` con credenciales por organización (Access Key + Secret en vault).
- Scope inicial: listar/subir/descargar objetos en un bucket prefijado por `organization_id`.

---

## Resumen

| Integración | Estado   | Acción                          |
|-------------|----------|---------------------------------|
| Figma       | Pausada  | Re-evaluar con demanda         |
| AWS (S3)    | Roadmap  | Implementar con caso de uso    |
| AWS (Lambda)| Roadmap  | Solo si Edge Functions insuficiente |
| AWS (SES)   | Opcional | Si Stripe no basta para emails |
