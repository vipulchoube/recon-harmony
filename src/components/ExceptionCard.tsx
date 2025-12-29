import { useState } from 'react';
import { Exception } from '@/types/recon';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, CheckCircle, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ExceptionCardProps {
  exception: Exception;
  onResolve: (id: string) => void;
  onComment: (id: string, content: string) => void;
}

export function ExceptionCard({ exception, onResolve, onComment }: ExceptionCardProps) {
  const [comment, setComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  const handleResolve = () => {
    onResolve(exception.id);
    toast.success('Case resolved', {
      description: `${exception.caseId} has been marked as resolved`,
    });
  };

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    onComment(exception.id, comment);
    setComment('');
    setCommentDialogOpen(false);
    toast.success('Comment added', {
      description: 'Your comment has been added to the case',
    });
  };

  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                exception.status === 'open'
                  ? 'bg-destructive animate-pulse'
                  : exception.status === 'under_review'
                  ? 'bg-warning'
                  : 'bg-success'
              }`}
            />
            <div>
              <h3 className="font-mono font-semibold text-foreground">{exception.caseId}</h3>
              <p className="text-sm text-muted-foreground">{exception.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`status-badge ${
                exception.status === 'open'
                  ? 'status-open'
                  : exception.status === 'under_review'
                  ? 'status-review'
                  : 'status-resolved'
              }`}
            >
              {exception.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignee */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Assigned to:</span>
          <span className="font-medium text-foreground">{exception.assignee}</span>
        </div>

        {/* Mismatched Fields */}
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Mismatched Fields ({exception.mismatchedFields.length})
          </button>
          {isExpanded && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {exception.mismatchedFields.map((field, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50 text-sm"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">Field</p>
                    <p className="font-medium font-mono text-foreground">{field.fieldName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ledger Value</p>
                    <p className="font-mono text-info">{field.ledgerValue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Statement Value</p>
                    <p className="font-mono text-warning">{field.statementValue}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        {exception.comments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Comments</p>
            {exception.comments.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{c.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {exception.status !== 'resolved' && (
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add Comment to {exception.caseId}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Textarea
                    placeholder="Enter your comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] bg-secondary border-border"
                  />
                  <Button onClick={handleSubmitComment} className="w-full">
                    Submit Comment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleResolve} size="sm" className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
