import { Flag, ToggleRight, ToggleLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminFeatureFlags() {
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('category', 'feature_flag')
        .order('key');
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: String(value), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast.success('Flag updated');
    },
    onError: (err: Error) => {
      toast.error(`Failed to update flag: ${err.message}`);
    },
  });

  const enabledCount = flags.filter((f: any) => f.value === 'true').length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-sm text-muted-foreground">
          {enabledCount} of {flags.length} flags enabled.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading flags…</p>
      ) : flags.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No feature flags configured. Add flags in the platform_settings table
            with category = 'feature_flag'.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {flags.map((flag: any) => (
            <Card key={flag.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{flag.key}</span>
                    <Badge variant={flag.value === 'true' ? 'default' : 'secondary'}>
                      {flag.value === 'true' ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                  {flag.description && (
                    <p className="text-xs text-muted-foreground">{flag.description}</p>
                  )}
                </div>
                <Switch
                  checked={flag.value === 'true'}
                  onCheckedChange={(checked) =>
                    toggleFlag.mutate({ id: flag.id, value: checked })
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
