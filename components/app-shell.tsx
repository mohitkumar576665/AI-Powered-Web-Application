'use client';

import * as React from 'react';
import { GraduationCap, Moon, Sun, Menu } from 'lucide-react';
import { NAV_ITEMS, type ViewKey } from '@/lib/nav';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet';

interface AppShellProps {
  active: ViewKey;
  onNavigate: (key: ViewKey) => void;
  children: React.ReactNode;
}

function NavList({
  active,
  onNavigate,
}: {
  active: ViewKey;
  onNavigate: (key: ViewKey) => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                !isActive && 'group-hover:scale-110'
              )}
            />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-semibold leading-tight tracking-tight">
          StudyAI
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight">
          AI study companion
        </p>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className="h-9 w-9"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

export function AppShell({ active, onNavigate, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeItem = NAV_ITEMS.find((i) => i.key === active);

  const handleNavigate = (key: ViewKey) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 md:flex md:flex-col">
        <Brand />
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <NavList active={active} onNavigate={handleNavigate} />
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-semibold">StudyAI</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <Brand />
                <div className="overflow-y-auto scrollbar-thin">
                  <NavList active={active} onNavigate={handleNavigate} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Desktop page header */}
        <header className="hidden items-center justify-between border-b border-border px-8 py-4 md:flex">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {activeItem?.label}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeItem?.description}
            </p>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>

        {/* Mobile bottom nav — scrollable to fit all items */}
        <nav className="flex items-stretch overflow-x-auto scrollbar-thin border-t border-border bg-card/80 backdrop-blur md:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.key)}
                className={cn(
                  'flex min-w-[60px] flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate px-0.5">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
