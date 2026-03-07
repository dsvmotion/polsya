/**
 * @deprecated Replaced by src/pages/admin/AdminSettings.tsx
 * Routes now redirect /platform/* -> /admin/*. Safe to delete after migration verified.
 */
import { useState } from 'react';
import { Settings, Shield, Plus, Trash2, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePlatformOwnerEmails } from '@/hooks/usePlatformOwnerEmails';
import { useAddPlatformOwner } from '@/hooks/useAddPlatformOwner';
import { useRemovePlatformOwner } from '@/hooks/useRemovePlatformOwner';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

export default function PlatformSettings() {
  const { data: emails = [], isLoading } = usePlatformOwnerEmails();
  const add = useAddPlatformOwner();
  const remove = useRemovePlatformOwner();
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    add.mutate(trimmed, {
      onSuccess: () => setNewEmail(''),
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Configuración de la plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Administradores de plataforma
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Emails con acceso a /platform. Los que tienen <code className="text-xs">app_metadata.role</code> también cuentan y no aparecen aquí.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-owner-email" className="sr-only">
                Añadir email
              </Label>
              <Input
                id="new-owner-email"
                type="email"
                placeholder="email@ejemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={add.isPending}
              />
            </div>
            <Button type="submit" disabled={add.isPending || !newEmail.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </form>
          {add.isError && (
            <p className="text-sm text-destructive">
              {add.error instanceof Error ? add.error.message : 'Error al añadir'}
            </p>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ningún email añadido desde la UI. Los admins con <code className="text-xs">app_metadata.role</code> siguen teniendo acceso.
            </p>
          ) : (
            <ul className="space-y-2">
              {emails.map((row) => (
                <li
                  key={row.email}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border"
                >
                  <span className="text-sm">{row.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove.mutate(row.email)}
                    disabled={remove.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PlatformFeatureFlagsCard />
    </div>
  );
}

function PlatformFeatureFlagsCard() {
  const { data: settings = [], isLoading, upsert } = usePlatformSettings();
  const [newKey, setNewKey] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key) return;
    upsert.mutate({ key, value: true }, { onSuccess: () => setNewKey('') });
  };

  const handleToggle = (key: string, currentValue: unknown) => {
    const isOn = currentValue === true || currentValue === 'true';
    upsert.mutate({ key, value: !isOn });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cargando configuración…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Feature flags
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Activa o desactiva flags globales. Valor <code className="text-xs">true</code>/<code className="text-xs">false</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="nombre_flag"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            disabled={upsert.isPending}
            className="font-mono text-sm"
          />
          <Button type="submit" disabled={upsert.isPending || !newKey.trim()}>
            Añadir
          </Button>
        </form>
        {upsert.isError && (
          <p className="text-sm text-destructive">
            {upsert.error instanceof Error ? upsert.error.message : 'Error'}
          </p>
        )}
        {settings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin flags. Añade uno para empezar.</p>
        ) : (
          <ul className="space-y-2">
            {settings.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between py-2 px-3 rounded-lg border border-border"
              >
                <div>
                  <code className="text-sm">{row.key}</code>
                  {row.description && (
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  )}
                </div>
                <Switch
                  checked={row.value === true || row.value === 'true'}
                  onCheckedChange={() => handleToggle(row.key, row.value)}
                  disabled={upsert.isPending}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
