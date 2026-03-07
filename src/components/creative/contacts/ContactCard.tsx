import type { CreativeContact } from '@/types/creative';
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, CheckCircle2 } from 'lucide-react';

interface ContactCardProps {
  contact: CreativeContact;
  onClick?: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const statusColors = CONTACT_STATUS_COLORS[contact.status];
  const fullName = `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ''}`;

  return (
    <div
      className="rounded-xl border border-border border-t-2 border-t-primary/40 bg-card p-4 space-y-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-sm truncate">{fullName}</h3>
          {contact.title && (
            <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
          )}
        </div>
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 shrink-0 ml-2 rounded-full px-2 py-0.5 text-xs`}>
          {CONTACT_STATUS_LABELS[contact.status]}
        </Badge>
      </div>
      {contact.email && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{contact.email}</span>
        </div>
      )}
      {contact.phone && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{contact.phone}</span>
        </div>
      )}
      {contact.isDecisionMaker && (
        <div className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Decision Maker</span>
        </div>
      )}
    </div>
  );
}
