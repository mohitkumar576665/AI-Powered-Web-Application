'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Palette,
  SlidersHorizontal,
  Database,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { storage } from '@/lib/storage';
import type { Difficulty, ResponseStyle, Settings } from '@/lib/types';
import { cn } from '@/lib/utils';

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = React.useState<Settings>(storage.getSettings());

  const updateSettings = (partial: Partial<Settings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    storage.saveSettings(updated);
    toast.success('Settings saved.');
  };

  const handleClearHistory = () => {
    storage.saveConversations([]);
    toast.success('Chat history cleared.');
  };

  const handleResetAll = () => {
    storage.clearAll();
    setSettings({
      difficulty: 'Intermediate',
      responseStyle: 'Balanced',
    });
    toast.success('All application data has been reset.');
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
        {/* Appearance */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    theme === 'light'
                      ? 'border-primary bg-accent'
                      : 'border-border hover:bg-accent/50'
                  )}
                >
                  <Sun className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Light</p>
                    <p className="text-xs text-muted-foreground">Bright theme</p>
                  </div>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    theme === 'dark'
                      ? 'border-primary bg-accent'
                      : 'border-border hover:bg-accent/50'
                  )}
                >
                  <Moon className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Dark</p>
                    <p className="text-xs text-muted-foreground">Dark theme</p>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Preferences */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">AI Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Difficulty level</Label>
              <Select
                value={settings.difficulty}
                onValueChange={(v) =>
                  updateSettings({ difficulty: v as Difficulty })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                AI will adapt explanations to this level.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Response style</Label>
              <Select
                value={settings.responseStyle}
                onValueChange={(v) =>
                  updateSettings({ responseStyle: v as ResponseStyle })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Concise">Concise</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Controls how detailed AI responses are.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Clear chat history</p>
                <p className="text-xs text-muted-foreground">
                  Remove all saved conversations.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your saved conversations.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearHistory}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, clear it
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Reset all data
                </p>
                <p className="text-xs text-muted-foreground">
                  Delete everything: history, quizzes, plans, settings.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all application data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete ALL data including
                      conversations, quizzes, study plans, and settings. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, reset everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <SettingsIcon className="h-3 w-3" />
          <span>StudyAI · Preferences are saved locally in your browser.</span>
        </div>
      </div>
    </div>
  );
}
