import { useState } from 'react';
import type { CreativeClient } from '@/types/creative';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, CLIENT_SIZE_LABELS } from '@/types/creative';
import { useDeleteCreativeClient } from '@/hooks/useCreativeClients';
import { ClientFormSheet } from './ClientFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Globe, Building2 } from 'lucide-react';

interface ClientDetailProps {
  client: CreativeClient;
  onClose: () => void;
}

export function ClientDetail({ client, onClose }: ClientDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativeClient();
  const { toast } = useToast();
  const statusColors = CLIENT_STATUS_COLORS[client.status];

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(client.id);
      toast({ title: 'Client deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{client.name}</h2>
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 mt-1`}>
            {CLIENT_STATUS_LABELS[client.status]}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete client?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{client.name}" and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3 text-sm">
        {client.industry && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{client.industry}{client.subIndustry ? ` · ${client.subIndustry}` : ''}</span>
          </div>
        )}
        {client.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{client.website}</a>
          </div>
        )}
        {client.sizeCategory && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Size:</span>
            <span>{CLIENT_SIZE_LABELS[client.sizeCategory]}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {client.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.description}</p>
        </div>
      )}

      {/* Tags */}
      {client.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(client.createdAt).toLocaleDateString()}
      </div>

      <ClientFormSheet open={editOpen} onOpenChange={setEditOpen} client={client} />
    </div>
  );
}
