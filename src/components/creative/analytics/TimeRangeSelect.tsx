import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TimeRange } from '@/types/analytics';

interface TimeRangeSelectProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '365d': 'Last year',
  all: 'All time',
};

export default function TimeRangeSelect({
  value,
  onChange,
}: TimeRangeSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <SelectTrigger className="w-40">
        <Calendar className="h-4 w-4 mr-2" />
        <SelectValue placeholder={TIME_RANGE_LABELS[value]} />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(TIME_RANGE_LABELS) as [TimeRange, string][]).map(
          ([range, label]) => (
            <SelectItem key={range} value={range}>
              {label}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}
