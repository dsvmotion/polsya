import { useState } from 'react';
import type { CreativePortfolio } from '@/types/creative';
import { PORTFOLIO_CATEGORY_LABELS, PORTFOLIO_CATEGORY_COLORS } from '@/types/creative';
import { useDeleteCreativePortfolio } from '@/hooks/useCreativePortfolios';
import { useCreativeClient } from '@/hooks/useCreativeClients';
import { PortfolioFormSheet } from './PortfolioFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Globe, Lock, Building2, ExternalLink } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';

interface PortfolioDetailProps {
  portfolio: CreativePortfolio;
  onClose: () => void;
}

export function PortfolioDetail({ portfolio, onClose }: PortfolioDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativePortfolio();
  const { data: client } = useCreativeClient(portfolio.clientId);
  const { toast } = useToast();

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(portfolio.id);
      toast({ title: 'Portfolio deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Thumbnail */}
      {portfolio.thumbnailUrl && (
        <div className="rounded-lg overflow-hidden bg-muted">
          <img src={portfolio.thumbnailUrl} alt={portfolio.title} className="w-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{portfolio.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            {portfolio.category && (
              <Badge variant="secondary" className={`${PORTFOLIO_CATEGORY_COLORS[portfolio.category].bg} ${PORTFOLIO_CATEGORY_COLORS[portfolio.category].text} border-0`}>
                {PORTFOLIO_CATEGORY_LABELS[portfolio.category]}
              </Badge>
            )}
            {portfolio.isPublic ? (
              <Badge variant="outline" className="text-green-600 border-green-200"><Globe className="h-3 w-3 mr-1" />Public</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground"><Lock className="h-3 w-3 mr-1" />Private</Badge>
            )}
          </div>
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
                <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{portfolio.title}" and cannot be undone.
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

      {/* Description */}
      {portfolio.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{portfolio.description}</p>
        </div>
      )}

      {/* Info */}
      <div className="space-y-3 text-sm">
        {client && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{client.name}</span>
          </div>
        )}
      </div>

      {/* Media URLs */}
      {portfolio.mediaUrls.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Media</h3>
          <div className="space-y-1">
            {portfolio.mediaUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {portfolio.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {portfolio.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(portfolio.createdAt).toLocaleDateString()}
      </div>

      <PortfolioFormSheet open={editOpen} onOpenChange={setEditOpen} portfolio={portfolio} />
    </div>
  );
}
