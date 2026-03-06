import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceResult } from '@/services/discoverService';

interface DiscoverResultsTableProps {
  results: PlaceResult[];
  alreadySavedIds: string[];
  selectedRows: PlaceResult[];
  onSelectedRowsChange: (rows: PlaceResult[]) => void;
  highlightedPlaceId: string | null;
  onRowHover: (placeId: string | null) => void;
}

export function DiscoverResultsTable({
  results,
  alreadySavedIds,
  selectedRows,
  onSelectedRowsChange,
  highlightedPlaceId,
  onRowHover,
}: DiscoverResultsTableProps) {
  const savedSet = useMemo(() => new Set(alreadySavedIds), [alreadySavedIds]);
  const selectedSet = useMemo(
    () => new Set(selectedRows.map((r) => r.placeId)),
    [selectedRows],
  );

  const selectableResults = results.filter((r) => !savedSet.has(r.placeId));
  const allSelected = selectableResults.length > 0 && selectableResults.every((r) => selectedSet.has(r.placeId));

  const toggleRow = (place: PlaceResult) => {
    if (selectedSet.has(place.placeId)) {
      onSelectedRowsChange(selectedRows.filter((r) => r.placeId !== place.placeId));
    } else {
      onSelectedRowsChange([...selectedRows, place]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onSelectedRowsChange([]);
    } else {
      onSelectedRowsChange(selectableResults);
    }
  };

  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              disabled={selectableResults.length === 0}
            />
          </TableHead>
          <TableHead className="w-24">Status</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-16">Map</TableHead>
          <TableHead>Website</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Address</TableHead>
          <TableHead className="w-20">Rating</TableHead>
          <TableHead className="w-28">Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((place, idx) => {
          const isSaved = savedSet.has(place.placeId);
          const isSelected = selectedSet.has(place.placeId);
          const isHighlighted = highlightedPlaceId === place.placeId;

          return (
            <TableRow
              key={place.placeId || idx}
              className={cn(
                'cursor-pointer transition-colors',
                isHighlighted && 'bg-accent',
                isSaved && 'opacity-60',
              )}
              onMouseEnter={() => onRowHover(place.placeId)}
              onMouseLeave={() => onRowHover(null)}
            >
              <TableCell>
                {!isSaved && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(place)}
                  />
                )}
              </TableCell>
              <TableCell>
                <Badge variant={isSaved ? 'outline' : 'secondary'} className="text-xs">
                  {isSaved ? 'Saved' : 'Found'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{place.name}</TableCell>
              <TableCell>
                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </TableCell>
              <TableCell className="max-w-[160px] truncate">
                {place.website ? (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getHostname(place.website)}
                  </a>
                ) : (
                  <span className="text-muted-foreground">&mdash;</span>
                )}
              </TableCell>
              <TableCell className="text-sm">{place.phone ?? '\u2014'}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {place.address}
              </TableCell>
              <TableCell>
                {place.rating != null ? (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {place.rating}
                  </span>
                ) : (
                  '\u2014'
                )}
              </TableCell>
              <TableCell>
                {place.primaryType && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {place.primaryType.replace(/_/g, ' ')}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
