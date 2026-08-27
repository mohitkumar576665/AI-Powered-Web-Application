'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import type { Conversation } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface HistoryProps {
  onOpenConversation?: (conv: Conversation) => void;
}

export function HistoryView({ onOpenConversation }: HistoryProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const update = () => setConversations(storage.getConversations());
    update();
    window.addEventListener('studyai-storage-change', update);
    return () => window.removeEventListener('studyai-storage-change', update);
  }, []);

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.messages.some((m) => m.content.toLowerCase().includes(query.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.'))
      return;
    const updated = storage.getConversations().filter((c) => c.id !== id);
    storage.saveConversations(updated);
    setConversations(updated);
    toast.success('Conversation deleted.');
  };

  const handleOpen = (conv: Conversation) => {
    if (onOpenConversation) {
      onOpenConversation(conv);
    } else {
      toast.info('Opening conversation in AI Chat…');
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <HistoryIcon className="mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="text-sm font-semibold">No conversations yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {query
                ? 'No conversations match your search.'
                : 'Ask your first question in AI Chat to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv) => (
              <Card
                key={conv.id}
                className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <button
                    onClick={() => handleOpen(conv)}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {conv.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(conv.updatedAt, {
                            addSuffix: true,
                          })}
                        </span>
                        <span>{conv.messages.length} messages</span>
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(conv.id)}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
