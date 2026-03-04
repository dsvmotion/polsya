# Análisis de Vanta.com — Ideas para Moodly CRM

Análisis de [Vanta.com](https://www.vanta.com/) para adoptar patrones de diseño, contenido y UX que mejoren moodlycrm.com.

---

## 1. Estructura y contenido de Vanta

### Hero
- **Titular claro**: "Automate compliance, manage risk, and accelerate trust with AI"
- **Formato**: "Verbo X, verbo Y, y verbo Z con AI"
- **Formulario de demo** en el hero (lead capture)
- **CTA principal**: "Request a demo" / "Book a demo"

### Social proof
- **"Trusted by 15,000+ customers"** con logos (Ramp, Snowflake, Writer, Intercom, Github, Atlassian, etc.)
- Logos reales de clientes reconocidos
- Alternativa si no hay logos: "Trusted by X teams" o "Used across Y industries"

### Product preview
- **Screenshots o mockups del producto** en la landing
- "Vanta Product UI" / "See an interactive demo"
- Evita placeholders genéricos; usa screenshots reales o un video corto

### Bloques de producto
- Cada producto: título, descripción breve, **"Explore X"** como CTA
- Enlace a páginas de producto detalladas
- Iconos consistentes y descripciones orientadas a beneficio

### Segmentación por tamaño
- **Startup** / **Mid-market** / **Enterprise**
- Cada segmento con testimonial y CTA "Explore startup solutions"
- Conecta directamente con nuestros planes (Starter ≈ Startup, Pro ≈ Mid-market, Business/Enterprise ≈ Enterprise)

### Pruebas con datos
- **"Proof in the numbers"**:
  - 526% ROI en 3 años
  - Se amortiza en 3 meses
  - 129% más productividad
- Números grandes, métricas concretas
- Enlace a whitepaper o estudio

### Testimonios
- Quote + nombre + cargo + logo de empresa
- Ej.: "Vanta has saved us hundreds of hours..." — Everett Berry, GTM Engineering, Clay
- Rotación/carrusel de testimonios

### Badges de trust
- SOC 2, ISO 27001, HIPAA, GDPR
- G2 Leader, IDC MarketScape
- Para nosotros: GDPR, "Encryption at rest", "SOC 2 ready" (si aplica)

### Recursos y blog
- "Learn more about Vanta and AI-powered trust management"
- Cards con artículos, guías, webinars
- Footer con enlaces a Documentation, Help center, Academy

### Navegación
- **Mega-menú** por categorías: Platform, Products, Solutions (Size, Industry, Frameworks), Partners, Resources
- Dropdown por industria, tamaño, framework
- Nosotros podemos: Solutions (por industria), Product (Features, Integrations, AI), Resources (Docs, Blog)

### Footer completo
- Product, Frameworks, Platform, Solutions, Customers, Partners, Resources, Company
- Trust center, Status, Privacy, Terms
- Redes sociales

---

## 2. Estilo y diseño

| Aspecto | Vanta | Aplicable a nosotros |
|--------|-------|----------------------|
| **Tipografía** | Clara, jerarquía fuerte | Ya usamos shadcn; revisar tamaños de H1/H2 |
| **Espaciado** | Generoso, secciones bien separadas | Aumentar `py-24`/`py-32` donde haga falta |
| **Colores** | Fondo neutro, acentos en CTAs | Mantener primary para CTAs |
| **CTAs** | "Request a demo" muy visible | Añadir "Request a demo" junto a "Get started" |
| **Logos** | Grid con opacidad moderada | Sustituir textos por logos (cuando existan) |
| **Imágenes** | Product screenshots, no ilustraciones genéricas | Screenshots del dashboard, mapas, prospecting |
| **Badges** | Pequeños, discretos, confianza | GDPR, "Data secure", "Enterprise-ready" |
| **Formularios** | Newsletter, demo request en hero | Hacer funcional el newsletter; formulario "Request demo" |

---

## 3. Features que podemos adoptar

### Alta prioridad (impacto alto, esfuerzo medio)

1. **Hero con formulario "Request demo"**
   - Campo email + "Book a demo" o "Get a personalized demo"
   - Conectar a /contact o a un endpoint de captación

2. **Sección "Proof in numbers"**
   - Ejemplos: "X entities managed", "Y% faster prospecting", "Z integrations"
   - Pueden ser datos agregados anónimos o objetivos de producto

3. **Testimonios**
   - 2–3 testimonios con quote, nombre, cargo, empresa
   - Placeholders al principio; reemplazar con clientes reales

4. **Screenshots reales del producto**
   - Sustituir "Feature demo placeholder" por capturas del dashboard, mapas, prospecting
   - O video corto de 30–60 s mostrando el flujo

5. **Badges de trust**
   - GDPR compliant, Encryption at rest, Row-level security
   - Iconos pequeños bajo el hero o en footer

### Media prioridad

6. **Navegación "Solutions"**
   - Dropdown: por industria (Retail, SaaS, Manufacturing...) o por tamaño (Startup, Mid-market, Enterprise)
   - Enlaces a secciones de la landing o a /features#X

7. **Segmentación por tamaño en pricing**
   - "For Startups", "For Mid-market", "For Enterprise" como labels junto a Starter/Pro/Business/Enterprise

8. **Trust Center / Security**
   - Página /trust o /security: políticas, certificaciones, arquitectura de datos
   - Enlace en footer

9. **Recursos / Blog**
   - Sección "Resources" con 3–4 artículos o guías
   - Footer con Documentation, Help center (cuando existan)

### Baja prioridad

10. **Logo strip con clientes**
    - Cuando haya clientes, añadir logos
    - Mientras tanto: "Trusted by B2B teams in Retail, Manufacturing, SaaS..."

11. **Mega-menú**
    - Solo si el número de páginas crece; mantener navegación simple de momento

12. **G2 / Capterra**
    - Cuando haya reviews: badges "Top rated" o similar

---

## 4. Copy inspirado en Vanta

### Hero actual
> B2B sales solutions for modern enterprises

### Opción estilo Vanta
> **Automate prospecting, manage pipelines, and accelerate revenue with AI**  
> Sales Compass helps B2B teams turn territory data into opportunities—in one platform, fully customizable.

### CTAs
- Mantener: "Get started free"
- Añadir: "Request a demo" (para Enterprise y visitantes que no quieren signup directo)
- "Book a demo" en Contact

### Proof in numbers (ejemplos)
- "10,000+ entities managed" (o el dato real)
- "15+ integrations" (conectado a la sección de integraciones)
- "7-day free trial, no credit card"

---

## 5. Checklist de implementación sugerida

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | Screenshots reales en Features | Bajo | Alto |
| 2 | Sección "Proof in numbers" en Landing | Bajo | Alto |
| 3 | Badges GDPR/Security bajo hero | Bajo | Medio |
| 4 | Formulario "Request demo" en hero (email → /contact) | Medio | Alto |
| 5 | Testimonios (2–3, placeholder o reales) | Medio | Alto |
| 6 | Dropdown "Solutions" por industria en nav | Medio | Medio |
| 7 | Página /trust con security & compliance | Medio | Medio |
| 8 | Footer más completo (Trust, Status, Docs) | Bajo | Medio |
| 9 | "Request a demo" CTA en header | Bajo | Medio |

---

## 6. Referencias

- [Vanta.com](https://www.vanta.com/) — estructura, copy, social proof
- [Radar.com](https://radar.com/) — ya adoptado: plataforma, industrias, diferentes
- Patrón común B2B: Hero fuerte → Social proof → Product/Platform → Solutions → Proof → Testimonios → Pricing → CTA final → Footer completo
