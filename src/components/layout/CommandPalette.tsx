import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  BarChart3,
  Settings,
  CreditCard,
  Users,
  Plug,
  Moon,
  Sun,
  LogOut,
  Building2,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useEntityTypes } from '@/hooks/useEntityTypes';
import { useBusinessEntities } from '@/hooks/useBusinessEntities';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { data: entityTypes = [] } = useEntityTypes();
  const { data: entities = [] } = useBusinessEntities();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange],
  );

  const filteredEntities = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return entities
      .filter((e) => e.name.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [entities, search]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search entities, pages, or actions..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {filteredEntities.length > 0 && (
          <CommandGroup heading="Entities">
            {filteredEntities.map((entity) => (
              <CommandItem
                key={entity.id}
                onSelect={() => runCommand(() => navigate(`/operations/entities/${entity.typeKey ?? 'pharmacy'}`))}
              >
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{entity.name}</span>
                  {entity.city && (
                    <span className="text-xs text-muted-foreground">{entity.city}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          {entityTypes.map((et) => (
            <CommandItem key={`prosp-${et.key}`} onSelect={() => runCommand(() => navigate(`/prospecting/entities/${et.key}`))}>
              <Search className="mr-2 h-4 w-4" />
              Prospecting — {et.label}
            </CommandItem>
          ))}
          {entityTypes.map((et) => (
            <CommandItem key={`ops-${et.key}`} onSelect={() => runCommand(() => navigate(`/operations/entities/${et.key}`))}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Operations — {et.label}
            </CommandItem>
          ))}
          <CommandItem onSelect={() => runCommand(() => navigate('/reports'))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Reports
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/team'))}>
            <Users className="mr-2 h-4 w-4" />
            Team
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/integrations'))}>
            <Plug className="mr-2 h-4 w-4" />
            Integrations
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/billing'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/profile'))}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle {theme === 'dark' ? 'light' : 'dark'} mode
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => signOut())}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
