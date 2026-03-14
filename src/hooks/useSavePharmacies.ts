import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SaveResult {
  saved: number;
  skipped: number;
}

/**
 * Hook for saving selected entities to Operations.
 * Sets the `saved_at` timestamp to mark them as explicitly saved.
 */
export function useSaveEntities(entityLabel = 'accounts') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entityIds: string[]): Promise<SaveResult> => {
      if (entityIds.length === 0) {
        throw new Error('No entities selected');
      }

      const { data: existing, error: fetchError } = await supabase
        .from('pharmacies')
        .select('id, saved_at')
        .in('id', entityIds);

      if (fetchError) {
        throw new Error(`Failed to check existing entities: ${fetchError.message}`);
      }

      const alreadySaved = (existing || []).filter(p => p.saved_at !== null);
      const toSave = entityIds.filter(id => !alreadySaved.some(p => p.id === id));

      if (toSave.length === 0) {
        return { saved: 0, skipped: alreadySaved.length };
      }

      const { error: updateError } = await supabase
        .from('pharmacies')
        .update({ saved_at: new Date().toISOString() })
        .in('id', toSave);

      if (updateError) {
        throw new Error(`Failed to save entities: ${updateError.message}`);
      }

      return {
        saved: toSave.length,
        skipped: alreadySaved.length,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      queryClient.invalidateQueries({ queryKey: ['saved-pharmacies'] });

      if (result.saved > 0 && result.skipped > 0) {
        toast.success(`Saved ${result.saved} ${entityLabel} (${result.skipped} already saved)`);
      } else if (result.saved > 0) {
        toast.success(`Saved ${result.saved} ${entityLabel} to Operations`);
      } else {
        toast.info(`All selected ${entityLabel} were already saved`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/** @deprecated Use useSaveEntities instead */
export const useSavePharmacies = useSaveEntities;
