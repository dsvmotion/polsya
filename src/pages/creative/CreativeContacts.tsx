import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { contactColumns } from '@/components/creative/contacts/contact-columns';
import { ContactCard } from '@/components/creative/contacts/ContactCard';
import { ContactFormSheet } from '@/components/creative/contacts/ContactFormSheet';
import { ContactDetail } from '@/components/creative/contacts/ContactDetail';
import { useCreativeContacts } from '@/hooks/useCreativeContacts';
import { useCreativeLayout } from '@/components/creative/layout/creative-layout-context';
import type { CreativeContact } from '@/types/creative';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativeContacts() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const { data: contacts = [], isLoading } = useCreativeContacts();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  function handleRowClick(contact: CreativeContact) {
    setContextPanelContent(
      <ContactDetail
        contact={contact}
        onClose={() => {
          setContextPanelOpen(false);
          setContextPanelContent(null);
        }}
      />
    );
    setContextPanelOpen(true);
  }

  return (
    <WorkspaceContainer
      title="Contacts"
      description="Manage contacts at your client organizations"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['table', 'cards']} />
          <Button size="sm" className="gap-1.5 transition-all duration-150" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Contact</span>
          </Button>
        </div>
      }
    >
      <div className="mt-2">
        {viewMode === 'table' ? (
          <DataTable
            columns={contactColumns}
            data={contacts}
            isLoading={isLoading}
            searchKey="firstName"
            searchPlaceholder="Search contacts..."
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card shadow-elevation-card p-4 space-y-3 animate-pulse">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                  <div className="h-4 w-full bg-muted/40 rounded" />
                </div>
              ))
            ) : contacts.length === 0 ? (
              <div className="col-span-full rounded-xl bg-muted/30 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No contacts yet. Click "Add Contact" to get started.
              </div>
            ) : (
              contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} onClick={() => handleRowClick(contact)} />
              ))
            )}
          </div>
        )}
      </div>

      <ContactFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
