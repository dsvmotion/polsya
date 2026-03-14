import { useState } from 'react';
import type { StyleAnalysis } from '@/types/style-intelligence';
import { useDeleteStyleAnalysis } from '@/hooks/useStyleAnalyses';
import { StyleAnalysisFormSheet } from './StyleAnalysisFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Link, Type } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';

interface StyleAnalysisDetailProps {
  analysis: StyleAnalysis;
  onClose: () => void;
  onFindSimilar?: (id: string) => void;
}

export function StyleAnalysisDetail({ analysis, onClose, onFindSimilar }: StyleAnalysisDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteStyleAnalysis();
  const { toast } = useToast();
  const pct = Math.round(analysis.confidenceScore * 100);

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(analysis.id);
      toast({ title: 'Analysis deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{analysis.sourceUrl || 'Manual Analysis'}</h2>
          <Badge variant="secondary" className={`mt-1 border-0 ${pct >= 80 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-muted text-foreground'}`}>
            {pct}% Confidence
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
                <AlertDialogTitle>Delete analysis?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete this style analysis.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Color Palette */}
      {analysis.colorPalette.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Color Palette</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.colorPalette.map((swatch) => (
              <div key={swatch.hex} className="flex items-center gap-2 rounded-md border px-2 py-1">
                <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: swatch.hex }} />
                <div className="text-xs">
                  <div className="font-medium">{swatch.name ?? swatch.hex}</div>
                  <div className="text-muted-foreground">{swatch.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typography */}
      {(analysis.typographyProfile.primaryFont || analysis.typographyProfile.secondaryFont) && (
        <div>
          <h3 className="text-sm font-medium mb-2">Typography</h3>
          <div className="space-y-1 text-sm">
            {analysis.typographyProfile.primaryFont && (
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span>Primary: {analysis.typographyProfile.primaryFont}</span>
              </div>
            )}
            {analysis.typographyProfile.secondaryFont && (
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span>Secondary: {analysis.typographyProfile.secondaryFont}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brand Attributes */}
      {Object.keys(analysis.brandAttributes).length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Brand Attributes</h3>
          <div className="flex flex-wrap gap-1">
            {Object.entries(analysis.brandAttributes).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Source URL */}
      {analysis.sourceUrl && (
        <div className="flex items-center gap-2 text-sm">
          <Link className="h-4 w-4 text-muted-foreground" />
          <a href={analysis.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
            {analysis.sourceUrl}
          </a>
        </div>
      )}

      {onFindSimilar && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => onFindSimilar(analysis.id)}>
          Find Similar Styles
        </Button>
      )}

      <div className="text-xs text-muted-foreground pt-4 border-t">
        Analyzed {new Date(analysis.analyzedAt ?? analysis.createdAt).toLocaleDateString()}
      </div>

      <StyleAnalysisFormSheet open={editOpen} onOpenChange={setEditOpen} analysis={analysis} />
    </div>
  );
}
