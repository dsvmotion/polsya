import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUploadDocument, type UploadDocumentInput } from '@/hooks/useAiDocuments';
import type { DocumentSourceType } from '@/types/ai-documents';
import { getErrorMessage } from '@/lib/utils';

interface DocumentUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const fileSchema = z.object({ title: z.string().min(1, 'Title is required') });
const textSchema = z.object({ title: z.string().min(1, 'Title is required'), content: z.string().min(1, 'Content is required') });
const urlSchema = z.object({ title: z.string().min(1, 'Title is required'), url: z.string().url('Must be a valid URL') });

export function DocumentUploadSheet({ open, onOpenChange, onSuccess }: DocumentUploadSheetProps) {
  const { toast } = useToast();
  const uploadMutation = useUploadDocument();
  const [activeTab, setActiveTab] = useState<DocumentSourceType>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileForm = useForm<z.infer<typeof fileSchema>>({ resolver: zodResolver(fileSchema), defaultValues: { title: '' } });
  const textForm = useForm<z.infer<typeof textSchema>>({ resolver: zodResolver(textSchema), defaultValues: { title: '', content: '' } });
  const urlForm = useForm<z.infer<typeof urlSchema>>({ resolver: zodResolver(urlSchema), defaultValues: { title: '', url: '' } });

  function resetAll() {
    fileForm.reset();
    textForm.reset();
    urlForm.reset();
    setSelectedFile(null);
  }

  async function handleUpload(input: UploadDocumentInput, successTitle: string) {
    try {
      await uploadMutation.mutateAsync(input);
      toast({ title: successTitle, description: 'Processing will begin shortly.' });
      onOpenChange(false);
      resetAll();
      onSuccess?.();
    } catch (err) {
      toast({ title: 'Upload failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  }

  async function handleFileSubmit(values: z.infer<typeof fileSchema>) {
    if (!selectedFile) { toast({ title: 'Please select a file', variant: 'destructive' }); return; }
    await handleUpload({ title: values.title, sourceType: 'pdf', file: selectedFile }, 'Document uploaded');
  }

  async function handleTextSubmit(values: z.infer<typeof textSchema>) {
    await handleUpload({ title: values.title, sourceType: 'text', textContent: values.content }, 'Document created');
  }

  async function handleUrlSubmit(values: z.infer<typeof urlSchema>) {
    await handleUpload({ title: values.title, sourceType: 'url', url: values.url }, 'URL added');
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetAll(); }}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Document</SheetTitle>
          <SheetDescription>Upload a file, paste text, or add a URL to your knowledge base.</SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentSourceType)} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pdf">File</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-4">
            <Form {...fileForm}>
              <form onSubmit={fileForm.handleSubmit(handleFileSubmit)} className="space-y-4">
                <FormField control={fileForm.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl><Input {...field} placeholder="Document title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormItem>
                  <FormLabel htmlFor="doc-file-input">File *</FormLabel>
                  <Input
                    id="doc-file-input"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setSelectedFile(file);
                      if (file && !fileForm.getValues('title')) {
                        fileForm.setValue('title', file.name.replace(/\.[^.]+$/, ''));
                      }
                    }}
                  />
                </FormItem>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <Form {...textForm}>
              <form onSubmit={textForm.handleSubmit(handleTextSubmit)} className="space-y-4">
                <FormField control={textForm.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl><Input {...field} placeholder="Document title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={textForm.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content *</FormLabel>
                    <FormControl><Textarea {...field} rows={8} placeholder="Paste your text content here..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <Form {...urlForm}>
              <form onSubmit={urlForm.handleSubmit(handleUrlSubmit)} className="space-y-4">
                <FormField control={urlForm.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl><Input {...field} placeholder="Document title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={urlForm.control} name="url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL *</FormLabel>
                    <FormControl><Input {...field} placeholder="https://example.com/article" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? 'Adding...' : 'Add URL'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
