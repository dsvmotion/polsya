import { useState } from 'react';
import { Search, X, Bookmark, Save, Trash2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OperationsFilters, SMART_SEGMENT_LABELS } from '@/types/operations';
import type { SavedSegment, SmartSegmentKey } from '@/types/operations';
import type { SmartSegmentCounts } from '@/hooks/useSmartSegments';
import { PharmacyStatus, STATUS_LABELS } from '@/types/pharmacy';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OperationsFiltersBarProps {
  filters: OperationsFilters;
  onFiltersChange: (filters: OperationsFilters) => void;
  onClearFilters: () => void;
  countries: string[];
  provinces: string[];
  cities: string[];
  segments: SavedSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (segment: SavedSegment | null) => void;
  onSaveSegment: (name: string) => Promise<void>;
  onDeleteSegment: (id: string) => Promise<void>;
  onToggleFavorite: (id: string, current: boolean) => Promise<void>;
  smartSegment: SmartSegmentKey;
  onSmartSegmentChange: (key: SmartSegmentKey) => void;
  smartSegmentCounts?: SmartSegmentCounts;
}

export function OperationsFiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
  countries,
  provinces,
  cities,
  segments,
  selectedSegmentId,
  onSelectSegment,
  onSaveSegment,
  onDeleteSegment,
  onToggleFavorite,
  smartSegment,
  onSmartSegmentChange,
  smartSegmentCounts,
}: OperationsFiltersBarProps) {
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.country !== '' ||
    filters.province !== '' ||
    filters.city !== '' ||
    filters.commercialStatus !== 'all' ||
    filters.paymentStatus !== 'all';

  const handleSave = async () => {
    const trimmed = segmentName.trim();
    if (!trimmed) {
      toast.error('Segment name is required');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveSegment(trimmed);
      setSegmentName('');
      setShowSaveInput(false);
    } catch {
      toast.error('Failed to save segment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSegmentChange = (value: string) => {
    if (value === '__none__') {
      onSelectSegment(null);
      return;
    }
    const seg = segments.find((s) => s.id === value);
    if (seg) onSelectSegment(seg);
  };

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId) ?? null;

  return (
    <div className="px-6 py-3 border-b border-gray-200 bg-white space-y-2">
      {/* Segment row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Bookmark className="h-4 w-4 text-gray-400 shrink-0" />
        <Select
          value={selectedSegmentId ?? '__none__'}
          onValueChange={handleSegmentChange}
        >
          <SelectTrigger className="w-48 h-8 text-sm bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Saved segments" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            <SelectItem value="__none__">No segment</SelectItem>
            {segments.map((seg) => (
              <SelectItem key={seg.id} value={seg.id}>
                {seg.is_favorite ? '★ ' : ''}{seg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSegment && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-gray-400 hover:text-yellow-600"
              onClick={() => onToggleFavorite(selectedSegment.id, selectedSegment.is_favorite)}
              title={selectedSegment.is_favorite ? 'Unmark favorite' : 'Mark favorite'}
            >
              <Star className={cn('h-3.5 w-3.5', selectedSegment.is_favorite && 'fill-yellow-500 text-yellow-500')} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-gray-400 hover:text-red-600"
              onClick={() => onDeleteSegment(selectedSegment.id)}
              title="Delete segment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        <div className="h-5 w-px bg-gray-200" />

        <Select
          value={smartSegment}
          onValueChange={(v) => onSmartSegmentChange(v as SmartSegmentKey)}
        >
          <SelectTrigger className="w-52 h-8 text-sm bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Smart segment" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            {(Object.keys(SMART_SEGMENT_LABELS) as SmartSegmentKey[]).map((key) => {
              const count = key !== 'none' && smartSegmentCounts ? smartSegmentCounts[key] : undefined;
              return (
                <SelectItem key={key} value={key}>
                  {SMART_SEGMENT_LABELS[key]}
                  {count !== undefined ? ` (${count})` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {hasActiveFilters && !showSaveInput && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-gray-500"
            onClick={() => setShowSaveInput(true)}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save current filters
          </Button>
        )}

        {showSaveInput && (
          <div className="flex items-center gap-1.5">
            <Input
              placeholder="Segment name"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              className="h-7 w-40 text-xs bg-white border-gray-300"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowSaveInput(false); setSegmentName(''); }}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search pharmacies..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Country */}
        <Select
          value={filters.country || 'all'}
          onValueChange={(value) => onFiltersChange({ 
            ...filters, 
            country: value === 'all' ? '' : value,
            province: '',
            city: ''
          })}
        >
          <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 max-h-60 z-50">
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Province */}
        <Select
          value={filters.province || 'all'}
          onValueChange={(value) => onFiltersChange({ 
            ...filters, 
            province: value === 'all' ? '' : value,
            city: ''
          })}
          disabled={!filters.country}
        >
          <SelectTrigger className={`w-40 bg-white border-gray-300 text-gray-900 ${!filters.country ? 'opacity-50' : ''}`}>
            <SelectValue placeholder={filters.country ? (provinces.length > 0 ? 'Province' : 'No provinces') : 'Select Country'} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 max-h-60 z-50">
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City */}
        <Select
          value={filters.city || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, city: value === 'all' ? '' : value })}
          disabled={!filters.province}
        >
          <SelectTrigger className={`w-40 bg-white border-gray-300 text-gray-900 ${!filters.province ? 'opacity-50' : ''}`}>
            <SelectValue placeholder={filters.province ? (cities.length > 0 ? 'City' : 'No cities') : 'Select Province'} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 max-h-60 z-50">
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Commercial Status */}
        <Select
          value={filters.commercialStatus}
          onValueChange={(value) => onFiltersChange({ ...filters, commercialStatus: value as OperationsFilters['commercialStatus'] })}
        >
          <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as PharmacyStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Status */}
        <Select
          value={filters.paymentStatus}
          onValueChange={(value) => onFiltersChange({ ...filters, paymentStatus: value as OperationsFilters['paymentStatus'] })}
        >
          <SelectTrigger className="w-36 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
