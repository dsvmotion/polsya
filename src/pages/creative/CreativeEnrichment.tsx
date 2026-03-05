import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { DataTable } from '@/components/creative/shared/DataTable';
import { recipeColumns } from '@/components/creative/enrichment/recipe-columns';
import { runColumns } from '@/components/creative/enrichment/run-columns';
import { CreditCard } from '@/components/creative/enrichment/CreditCard';
import { RecipeFormSheet } from '@/components/creative/enrichment/RecipeFormSheet';
import { useEnrichmentCredits, useEnrichmentRecipes, useEnrichmentRuns } from '@/hooks/useEnrichmentEngine';

export default function CreativeEnrichment() {
  const [formOpen, setFormOpen] = useState(false);

  const { data: credits = [], isLoading: creditsLoading } = useEnrichmentCredits();
  const { data: recipes = [], isLoading: recipesLoading } = useEnrichmentRecipes();
  const { data: runs = [], isLoading: runsLoading } = useEnrichmentRuns();

  return (
    <WorkspaceContainer
      title="Enrichment Engine"
      description="Enrich entity data with external providers"
    >
      <Tabs defaultValue="recipes" className="mt-2">
        <TabsList>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Add Recipe</span>
            </Button>
          </div>
          <DataTable
            columns={recipeColumns}
            data={recipes}
            isLoading={recipesLoading}
            searchKey="name"
            searchPlaceholder="Search recipes..."
          />
        </TabsContent>

        <TabsContent value="credits" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
                  <div className="h-5 w-1/2 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted/60 rounded" />
                  <div className="h-3 w-3/4 bg-muted/40 rounded" />
                </div>
              ))
            ) : credits.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No credit accounts configured. Credits are managed externally.
              </div>
            ) : (
              credits.map((credit) => (
                <CreditCard key={credit.id} credit={credit} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <DataTable
            columns={runColumns}
            data={runs}
            isLoading={runsLoading}
            searchKey="entityType"
            searchPlaceholder="Search runs..."
          />
        </TabsContent>
      </Tabs>

      <RecipeFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
