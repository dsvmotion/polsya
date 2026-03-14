import { useState, useRef } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Receipt, 
  Upload, 
  Trash2, 
  Download,
  ExternalLink,
  Package,
  CreditCard,
  StickyNote,
  Globe,
  Save,
  ImageIcon,
  Users,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntityWithOrders, DetailedOrder, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/operations';
import { EntityStatus, STATUS_LABELS, STATUS_COLORS, CONTACT_ROLE_LABELS } from '@/types/entity';
import { useEntityContacts } from '@/hooks/useEntityContacts';
import { 
  useEntityDocuments, 
  useUploadDocument, 
  useDeleteDocument, 
  useDownloadDocument 
} from '@/hooks/useEntityOperations';
import { useUpdateEntityStatus } from '@/hooks/usePharmacies';
import { useEntityPhoto } from '@/hooks/useEntityPhoto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EntityOperationsDetailProps {
  pharmacy: EntityWithOrders;
  onClose: () => void;
  onStatusUpdate?: () => void;
}

function PaymentBadge({ status }: { status: 'paid' | 'pending' | 'failed' | 'refunded' }) {
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

const ACCEPTED_DOC_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';

function DocumentsSection({ pharmacyId }: { pharmacyId: string }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: allDocuments = [] } = useEntityDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const pharmacyDocs = allDocuments.filter((d) => d.pharmacyId === pharmacyId);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    try {
      await uploadDocument.mutateAsync({
        pharmacyId,
        orderId: null,
        documentType: selectedType,
        file,
      });
      toast.success(`${DOCUMENT_TYPE_LABELS[selectedType]} uploaded`);
      setShowUploadForm(false);
      setSelectedType('other');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleDelete = async (id: string, filePath: string, label: string) => {
    try {
      await deleteDocument.mutateAsync({ id, filePath });
      toast.success(`${label} deleted`);
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const blob = await downloadDocument.mutateAsync(filePath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const DocIcon = ({ type }: { type: DocumentType }) =>
    type === 'receipt' ? (
      <Receipt className="h-4 w-4 text-muted-foreground" />
    ) : (
      <FileText className="h-4 w-4 text-muted-foreground" />
    );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <FileText className="h-3.5 w-3.5" />
        Documents
      </h3>
      {!showUploadForm ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUploadForm(true)}
          className="border-border text-muted-foreground"
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Upload Document
        </Button>
      ) : (
        <div className="p-3 border border-border rounded-lg bg-muted space-y-3">
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
            <SelectTrigger className="bg-background border-border h-8 text-sm">
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {DOCUMENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_DOC_EXTENSIONS}
            className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-muted file:text-muted-foreground"
            onChange={() => {}}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpload} disabled={uploadDocument.isPending}>
              Upload
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowUploadForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2 mt-3">
        {pharmacyDocs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No documents yet</p>
        ) : (
          pharmacyDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-2 p-2 rounded border border-border bg-background text-sm"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <DocIcon type={doc.documentType} />
                <div className="min-w-0">
                  <p className="truncate text-foreground font-medium">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {DOCUMENT_TYPE_LABELS[doc.documentType]} · {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground"
                  onClick={() => handleDownload(doc.filePath, doc.fileName)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-red-600"
                  onClick={() => handleDelete(doc.id, doc.filePath, DOCUMENT_TYPE_LABELS[doc.documentType])}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, pharmacyId }: { order: DetailedOrder; pharmacyId: string }) {
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const { data: allDocuments = [] } = useEntityDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const orderDocs = allDocuments.filter(d => d.pharmacyId === pharmacyId && d.orderId === order.orderId);
  const invoice = orderDocs.find(d => d.documentType === 'invoice');
  const receipt = orderDocs.find(d => d.documentType === 'receipt');

  const handleUpload = async (file: File, type: 'invoice' | 'receipt') => {
    try {
      await uploadDocument.mutateAsync({
        pharmacyId,
        orderId: order.orderId,
        documentType: type,
        file,
      });
      toast.success(`${DOCUMENT_TYPE_LABELS[type]} uploaded`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  const handleDelete = async (id: string, filePath: string, type: string) => {
    try {
      await deleteDocument.mutateAsync({ id, filePath });
      toast.success(`${type} deleted`);
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const blob = await downloadDocument.mutateAsync(filePath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="border border-border rounded-lg p-3 bg-background">
      {/* Order Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{order.orderId}</span>
          <PaymentBadge status={order.paymentStatus} />
        </div>
        <span className="text-sm text-muted-foreground">
          {new Date(order.dateCreated).toLocaleDateString()}
        </span>
      </div>

      {/* Order Details */}
      <div className="space-y-1 text-sm mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          <span>{order.products.length} product(s)</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" />
          <span>{order.paymentMethodTitle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-semibold text-foreground">
            €{order.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Payment Link */}
      {order.paymentLinkUrl && (
        <div className="mb-3 p-2 bg-muted rounded text-xs flex items-center gap-2">
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          <a
            href={order.paymentLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground truncate flex-1"
          >
            {order.paymentLinkUrl}
          </a>
        </div>
      )}

      {/* Products */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1">Products:</p>
        <div className="space-y-1">
          {order.products.map((product, idx) => (
            <div key={`${product.name}-${idx}`} className="text-xs text-muted-foreground flex justify-between">
              <span className="truncate max-w-[200px]">{product.name}</span>
              <span className="text-muted-foreground">×{product.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-3" />

      {/* Documents */}
      <div className="space-y-2">
        {/* Invoice - RED when missing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Invoice</span>
          </div>
          {invoice ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-600 mr-2">Uploaded</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(invoice.filePath, invoice.fileName)}
                className="h-7 px-2 text-muted-foreground"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(invoice.id, invoice.filePath, 'Invoice')}
                className="h-7 px-2 text-muted-foreground hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <input
                ref={invoiceInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, 'invoice');
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => invoiceInputRef.current?.click()}
                className="h-7 px-2 bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
                disabled={uploadDocument.isPending}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload Invoice
              </Button>
            </>
          )}
        </div>

        {/* Receipt - GREEN when invoice uploaded but no receipt */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Receipt</span>
          </div>
          {receipt ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-600 mr-2">Paid</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(receipt.filePath, receipt.fileName)}
                className="h-7 px-2 text-muted-foreground"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(receipt.id, receipt.filePath, 'Receipt')}
                className="h-7 px-2 text-muted-foreground hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : invoice ? (
            // Only show receipt upload when invoice is already uploaded
            <>
              <input
                ref={receiptInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, 'receipt');
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => receiptInputRef.current?.click()}
                className="h-7 px-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800"
                disabled={uploadDocument.isPending}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload Receipt
              </Button>
            </>
          ) : (
            // Invoice not uploaded yet - receipt button disabled
            <span className="text-xs text-muted-foreground">Upload invoice first</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function EntityOperationsDetail({ pharmacy, onClose, onStatusUpdate }: EntityOperationsDetailProps) {
  const [status, setStatus] = useState<EntityStatus>(pharmacy.commercialStatus);
  const [notes, setNotes] = useState(pharmacy.notes || '');
  const [hasChanges, setHasChanges] = useState(false);

  const updateStatus = useUpdateEntityStatus();
  const { photoUrl, isLoading: photoLoading } = useEntityPhoto(pharmacy.id);
  const { data: contacts = [] } = useEntityContacts(pharmacy.id);

  const handleStatusChange = (newStatus: EntityStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateStatus.mutateAsync({
        id: pharmacy.id,
        updates: {
          commercial_status: status,
          notes: notes || null,
        },
      });
      setHasChanges(false);
      onStatusUpdate?.();
      toast.success('Pharmacy updated');
    } catch (error) {
      toast.error('Failed to update pharmacy');
    }
  };

  const statusColor = STATUS_COLORS[status];

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col surface-card rounded-none border-0 2xl:border-l 2xl:border-border">
      {/* Header with Photo */}
      <div className="border-b border-border bg-background">
        {/* Photo Section */}
        <div className="h-32 bg-muted relative overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={pharmacy.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {photoLoading ? (
                <div className="animate-pulse">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                </div>
              ) : (
                <div className="text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                  <p className="text-xs text-muted-foreground mt-1">No photo available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title and Status */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{pharmacy.name}</h2>
            <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium mt-1', statusColor.bg, statusColor.text)}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground -mr-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Commercial Status - EDITABLE */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Commercial Status</h3>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {(Object.keys(STATUS_LABELS) as EntityStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[s].bg.replace('bg-', 'bg-'))} 
                        style={{ backgroundColor: STATUS_COLORS[s].pin }} />
                      {STATUS_LABELS[s]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</h3>
            {pharmacy.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div>{pharmacy.address}</div>
                  <div className="text-muted-foreground">
                    {[pharmacy.city, pharmacy.province, pharmacy.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            )}
            {pharmacy.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{pharmacy.phone}</span>
              </div>
            )}
            {pharmacy.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{pharmacy.email}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Contacts (read-only) */}
          {contacts.length > 0 && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Contacts ({contacts.length})
                </h3>
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start gap-2 p-2 rounded border border-border bg-background text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground truncate">{contact.name}</span>
                          {contact.isPrimary && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                          {contact.role && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                              {CONTACT_ROLE_LABELS[contact.role as keyof typeof CONTACT_ROLE_LABELS] ?? contact.role}
                            </span>
                          )}
                        </div>
                        {contact.email && (
                          <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                        )}
                        {contact.phone && (
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Documents */}
          <DocumentsSection pharmacyId={pharmacy.id} />

          <Separator />

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
              <p className="text-xl font-semibold text-foreground">{pharmacy.orders.length}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-xl font-semibold text-foreground">
                €{pharmacy.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Notes - EDITABLE */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <StickyNote className="h-3.5 w-3.5" />
              Internal Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this pharmacy..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="min-h-[80px] resize-none bg-background border-border text-sm"
            />
          </div>

          <Separator />

          {/* Order History */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Order History ({pharmacy.orders.length})
            </h3>
            
            {pharmacy.orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pharmacy.orders.map((order) => (
                  <OrderCard key={order.id} order={order} pharmacyId={pharmacy.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Save Button */}
      {hasChanges && (
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={updateStatus.isPending}
            className="w-full bg-foreground hover:bg-foreground/90 text-background"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateStatus.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
