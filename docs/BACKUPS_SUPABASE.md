# Backups en Supabase

Guía para configurar y mantener backups de la base de datos.

---

## 1. Backups automáticos (Pro plan)

Supabase ofrece backups automáticos en proyectos **Pro**:

- **Frecuencia:** Diario (point-in-time recovery disponible)
- **Retención:** 7 días por defecto; configurable hasta 30 días
- **Ubicación:** Supabase gestiona el almacenamiento

### Habilitar
1. Supabase Dashboard → **Project Settings** → **Database**
2. En **Backups**, activa el plan Pro si no lo tienes.
3. Configura la retención deseada.

---

## 2. Backups manuales (cualquier plan)

### pg_dump (recomendado)
```bash
# Obtén la connection string en Dashboard → Settings → Database
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --no-owner --no-acl \
  -F c \
  -f backup_$(date +%Y%m%d_%H%M).dump
```

### Supabase CLI
```bash
supabase db dump -f backup.sql
```
Requiere `supabase link` previo. Genera SQL con el esquema y datos.

---

## 3. Restaurar

### Desde dump binario
```bash
pg_restore --no-owner --no-acl -d "postgresql://..." backup.dump
```

### Desde SQL
```bash
psql "postgresql://..." -f backup.sql
```

---

## 4. Buenas prácticas

- **Automatizar:** Programar dumps diarios con cron (proyectos Free/Team).
- **Probar restauración:** Ejecutar un restore en un proyecto de prueba al menos una vez al trimestre.
- **Secrets:** No versionar connection strings; usar variables de entorno.
- **PITR:** En Pro, point-in-time recovery permite restaurar a un momento concreto (útil tras errores o corrupciones).

---

## 5. Checklist

- [ ] Backups automáticos activados (Pro) o cron configurado (Free)
- [ ] Retención adecuada (mín. 7 días)
- [ ] Restauración probada recientemente
- [ ] Documentada la ubicación de dumps manuales (si aplica)
