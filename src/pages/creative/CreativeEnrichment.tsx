import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { DataTable } from '@/components/creative/shared/DataTable';
import { createRecipeColumns } from '@/components/creative/enrichment/recipe-columns';
import { runColumns } from '@/components/creative/enrichment/run-columns';
import { CreditCard } from '@/components/creative/enrichment/CreditCard';
import { RecipeFormSheet } from '@/components/creative/enrichment/RecipeFormSheet';
import { RunNowDialog } from '@/components/creative/enrichment/RunNowDialog';
import { RunDetail } from '@/components/creative/enrichment/RunDetail';
import { useEnrichmentCredits, useEnrichmentRecipes, useEnrichmentRuns } from '@/hooks/useEnrichmentEngine';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { EnrichmentRecipe } from '@/types/enrichment-engine';
import type { EnrichmentRun } from '@/types/enrichment-engine';

export default function CreativeEnrichment() {
  const [formOpen, setFormOpen] = useState(false);
  const [runNowRecipe, setRunNowRecipe] = useState<EnrichmentRecipe | null>(null);
  const [runNowOpen, setRunNowOpen] = useState(false);
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  const { data: credits = [], isLoading: creditsLoading } = useEnrichmentCredits();
  const { data: recipes = [], isLoading: recipesLoading } = useEnrichmentRecipes();
  const { data: runs = [], isLoading: runsLoading } = useEnrichmentRuns();

  const recipeColumns = useMemo(
    () =>
      createRecipeColumns((recipe) => {
        setRunNowRecipe(recipe);
        setRunNowOpen(true);
      }),
    [],
  );

  function handleRunClick(run: EnrichmentRun) {
    setContextPanelContent(
      <RunDetail
        run={run}
        onClose={() => {
          setContextPanelOpen(false);
          setContextPanelContent(null);
        }}
      />,
    );
    setContextPanelOpen(true);
  }

  return (
    <WorkspaceContainer
      title="Enrichment Engine"
      description="Enrich entity data with external providers"
    >
      <Tabs defaultValue="recipes" className="mt-2">
        <TabsList className="rounded-full bg-muted/60 p-1">
          <TabsTrigger value="recipes" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-150">Recipes</TabsTrigger>
          <TabsTrigger value="credits" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-150">Credits</TabsTrigger>
          <TabsTrigger value="history" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-150">Run History</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="mt-6">
          <div className="flex justify-end mb-6">
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

        <TabsContent value="credits" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4 shadow-sm space-y-3 animate-pulse">
                  <div className="h-5 w-1/2 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted/60 rounded" />
                  <div className="h-3 w-3/4 bg-muted/40 rounded" />
                </div>
              ))
            ) : credits.length === 0 ? (
              <div className="col-span-full rounded-xl bg-muted/30 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No credit accounts configured. Credits are managed externally.
              </div>
            ) : (
              credits.map((credit) => (
                <CreditCard key={credit.id} credit={credit} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <DataTable
            columns={runColumns}
            data={runs}
            isLoading={runsLoading}
            searchKey="entityType"
            searchPlaceholder="Search runs..."
            onRowClick={handleRunClick}
          />
        </TabsContent>
      </Tabs>

      <RecipeFormSheet open={formOpen} onOpenChange={setFormOpen} />

      {runNowRecipe && (
        <RunNowDialog
          recipe={runNowRecipe}
          open={runNowOpen}
          onOpenChange={setRunNowOpen}
        />
      )}
    </WorkspaceContainer>
  );
}
