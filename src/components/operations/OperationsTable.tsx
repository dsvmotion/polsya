import { ArrowUpDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { PharmacyWithOrders, SortField, SortDirection } from '@/types/operations';
import { PharmacyStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/pharmacy';
import { cn } from '@/lib/utils';
import { EmptyState, LoadingState } from '@/components/ui/view-states';

interface OperationsTableProps {
  pharmacies: PharmacyWithOrders[];
  isLoading: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: PharmacyWithOrders) => void;
}

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (field !== currentField) {
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
  }
  return direction === 'asc'
    ? <ArrowUp className="h-3 w-3 text-foreground" />
    : <ArrowDown className="h-3 w-3 text-foreground" />;
}

function StatusBadge({ status }: { status: PharmacyStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', colors?.bg, colors?.text)}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function PaymentBadge({ status }: { status: 'paid' | 'pending' | 'failed' | 'refunded' | null }) {
  if (!status) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const styles = {
    paid: 'bg-muted text-foreground',
    pending: 'bg-muted/50 text-muted-foreground border border-border',
    failed: 'bg-muted text-muted-foreground',
    refunded: 'bg-muted text-muted-foreground',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', styles[status])}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface DocCountCellProps {
  pharmacy: PharmacyWithOrders;
}

function DocCountCell({ pharmacy }: DocCountCellProps) {
  const count = pharmacy.documentCount ?? 0;

  return (
    <div className="flex items-center justify-center">
      {count > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
          {count}
        </span>
      ) : (
        <FileText className="h-4 w-4 text-muted-foreground/50" />
      )}
    </div>
  );
}

export function OperationsTable({
  pharmacies,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  selectedPharmacyId,
  onSelectPharmacy,
}: OperationsTableProps) {
  if (isLoading) {
    return (
      <LoadingState
        title="Loading accounts..."
        description="Applying filters and sorting."
        className="mx-4 mt-4"
      />
    );
  }

  if (pharmacies.length === 0) {
    return (
      <EmptyState
        title="No accounts found"
        description="Adjust filters or import more records."
        icon={FileText}
        className="mx-4 mt-4"
      />
    );
  }

  return (
    <>
      <div className="lg:hidden p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">Sort:</span>
          <button
            onClick={() => onSort('name')}
            className={cn(
              'px-2 py-1 rounded border',
              sortField === 'name' ? 'border-border text-foreground bg-muted' : 'border-border'
            )}
          >
            Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => onSort('totalRevenue')}
            className={cn(
              'px-2 py-1 rounded border',
              sortField === 'totalRevenue' ? 'border-border text-foreground bg-muted' : 'border-border'
            )}
          >
            Revenue {sortField === 'totalRevenue' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => onSort('lastOrderDate')}
            className={cn(
              'px-2 py-1 rounded border',
              sortField === 'lastOrderDate' ? 'border-border text-foreground bg-muted' : 'border-border'
            )}
          >
            Last order {sortField === 'lastOrderDate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
        </div>

        {pharmacies.map((pharmacy) => (
          <button
            key={pharmacy.id}
            onClick={() => onSelectPharmacy(pharmacy)}
            className={cn(
              'w-full text-left rounded-lg border p-3 bg-background',
              selectedPharmacyId === pharmacy.id ? 'border-border text-foreground bg-muted' : 'border-border'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{pharmacy.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[pharmacy.city, pharmacy.province].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <StatusBadge status={pharmacy.commercialStatus} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {pharmacy.lastOrder
                  ? `Last: ${new Date(pharmacy.lastOrder.dateCreated).toLocaleDateString()}`
                  : 'No orders'}
              </span>
              <PaymentBadge status={pharmacy.lastOrder?.paymentStatus || null} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                €{pharmacy.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
              <DocCountCell pharmacy={pharmacy} />
            </div>
          </button>
        ))}
      </div>

      <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm min-w-[1600px]">
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button 
                onClick={() => onSort('name')} 
                className="flex items-center gap-1 hover:text-foreground"
              >
                Name
                <SortIcon field="name" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('address')} className="flex items-center gap-1 hover:text-foreground">
                Address
                <SortIcon field="address" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('postal_code')} className="flex items-center gap-1 hover:text-foreground">
                CP
                <SortIcon field="postal_code" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('city')} className="flex items-center gap-1 hover:text-foreground">
                City
                <SortIcon field="city" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('province')} className="flex items-center gap-1 hover:text-foreground">
                Province
                <SortIcon field="province" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('autonomous_community')} className="flex items-center gap-1 hover:text-foreground">
                Autonomous Community
                <SortIcon field="autonomous_community" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('phone')} className="flex items-center gap-1 hover:text-foreground">
                Phone
                <SortIcon field="phone" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('secondary_phone')} className="flex items-center gap-1 hover:text-foreground">
                Tel. Adicional
                <SortIcon field="secondary_phone" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('email')} className="flex items-center gap-1 hover:text-foreground">
                Email
                <SortIcon field="email" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('activity')} className="flex items-center gap-1 hover:text-foreground">
                Activity
                <SortIcon field="activity" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('subsector')} className="flex items-center gap-1 hover:text-foreground">
                Subsector
                <SortIcon field="subsector" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button onClick={() => onSort('legal_form')} className="flex items-center gap-1 hover:text-foreground">
                Legal Form
                <SortIcon field="legal_form" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button 
                onClick={() => onSort('commercialStatus')} 
                className="flex items-center gap-1 hover:text-foreground"
              >
                Status
                <SortIcon field="commercialStatus" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button 
                onClick={() => onSort('lastOrderDate')} 
                className="flex items-center gap-1 hover:text-foreground"
              >
                Last Order
                <SortIcon field="lastOrderDate" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">
              <button 
                onClick={() => onSort('totalRevenue')} 
                className="flex items-center gap-1 hover:text-foreground ml-auto"
              >
                Revenue
                <SortIcon field="totalRevenue" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              <button 
                onClick={() => onSort('paymentStatus')} 
                className="flex items-center gap-1 hover:text-foreground"
              >
                Payment
                <SortIcon field="paymentStatus" currentField={sortField} direction={sortDirection} />
              </button>
            </th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Docs</th>
          </tr>
        </thead>
        <tbody>
          {pharmacies.map((pharmacy) => (
            <tr
              key={pharmacy.id}
              onClick={() => onSelectPharmacy(pharmacy)}
              className={cn(
                'border-b border-border cursor-pointer transition-colors',
                selectedPharmacyId === pharmacy.id
                  ? 'bg-muted'
                  : 'hover:bg-muted/50'
              )}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-foreground truncate max-w-[180px]">
                  {pharmacy.name}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {pharmacy.address || '—'}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {pharmacy.postal_code || '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {pharmacy.city || '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {pharmacy.province || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {pharmacy.autonomous_community || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {pharmacy.phone || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {pharmacy.secondary_phone || '—'}
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {pharmacy.email || '—'}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {pharmacy.activity || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {pharmacy.subsector || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {pharmacy.legal_form || '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={pharmacy.commercialStatus} />
              </td>
              <td className="px-4 py-3">
                {pharmacy.lastOrder ? (
                  <div>
                    <div className="text-muted-foreground">{pharmacy.lastOrder.orderId}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(pharmacy.lastOrder.dateCreated).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No orders</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-medium text-foreground">
                  €{pharmacy.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </td>
              <td className="px-4 py-3">
                <PaymentBadge status={pharmacy.lastOrder?.paymentStatus || null} />
              </td>
              <td className="px-4 py-3">
                <DocCountCell pharmacy={pharmacy} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
