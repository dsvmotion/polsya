import { useState } from 'react';
import type { CreativeContact } from '@/types/creative';
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS } from '@/types/creative';
import { useDeleteCreativeContact } from '@/hooks/useCreativeContacts';
import { useCreativeClient } from '@/hooks/useCreativeClients';
import { ContactFormSheet } from './ContactFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Mail, Phone, Linkedin, CheckCircle2, Building2 } from 'lucide-react';

interface ContactDetailProps {
  contact: CreativeContact;
  onClose: () => void;
}

export function ContactDetail({ contact, onClose }: ContactDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativeContact();
  const { data: client } = useCreativeClient(contact.clientId);
  const { toast } = useToast();
  const statusColors = CONTACT_STATUS_COLORS[contact.status];
  const fullName = `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ''}`;

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(contact.id);
      toast({ title: 'Contact deleted' });
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
          <h2 className="text-lg font-semibold">{fullName}</h2>
          {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 mt-1`}>
            {CONTACT_STATUS_LABELS[contact.status]}
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
                <AlertDialogTitle>Delete contact?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{fullName}" and cannot be undone.
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
        {client && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{client.name}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.linkedinUrl && (
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-muted-foreground" />
            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{contact.linkedinUrl}</a>
          </div>
        )}
        {contact.role && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Role:</span>
            <span>{contact.role}</span>
          </div>
        )}
        {contact.isDecisionMaker && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Decision Maker</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(contact.createdAt).toLocaleDateString()}
      </div>

      <ContactFormSheet open={editOpen} onOpenChange={setEditOpen} contact={contact} />
    </div>
  );
}
