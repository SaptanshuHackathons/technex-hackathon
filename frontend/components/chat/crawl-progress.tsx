"use client";

import { cn } from "@/lib/utils";
import { Loader2, XCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CrawlProgress } from "@/lib/api";

interface CrawlProgressIndicatorProps {
    progress: CrawlProgress;
    onCancel?: (crawlId: string) => void;
    className?: string;
}

export function CrawlProgressIndicator({
    progress,
    onCancel,
    className,
}: CrawlProgressIndicatorProps) {
    const getStatusInfo = () => {
        switch (progress.status) {
            case "queued":
                return {
                    icon: <Loader2 className="h-4 w-4 animate-spin" />,
                    label: "Queued",
                    color: "text-blue-600 dark:text-blue-400",
                };
            case "scraping":
                return {
                    icon: <Loader2 className="h-4 w-4 animate-spin" />,
                    label: "Scraping",
                    color: "text-emerald-600 dark:text-emerald-400",
                };
            case "indexing":
                return {
                    icon: <Loader2 className="h-4 w-4 animate-spin" />,
                    label: "Indexing",
                    color: "text-purple-600 dark:text-purple-400",
                };
            case "completed":
                return {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    label: "Complete",
                    color: "text-green-600 dark:text-green-400",
                };
            case "failed":
                return {
                    icon: <AlertCircle className="h-4 w-4" />,
                    label: "Failed",
                    color: "text-red-600 dark:text-red-400",
                };
            case "cancelled":
                return {
                    icon: <XCircle className="h-4 w-4" />,
                    label: "Cancelled",
                    color: "text-gray-600 dark:text-gray-400",
                };
            default:
                return {
                    icon: <Loader2 className="h-4 w-4" />,
                    label: progress.status,
                    color: "text-gray-600 dark:text-gray-400",
                };
        }
    };

    const statusInfo = getStatusInfo();
    const isActive = ["queued", "scraping", "indexing"].includes(progress.status);

    return (
        <div
            className={cn(
                "rounded-lg border bg-card p-3 space-y-2",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("flex items-center gap-1.5", statusInfo.color)}>
                        {statusInfo.icon}
                        <span className="text-sm font-medium">{statusInfo.label}</span>
                    </div>
                </div>
                {isActive && onCancel && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => onCancel(progress.crawl_id)}
                    >
                        Cancel
                    </Button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
                <Progress value={progress.progress_percentage} className="h-1.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progress.progress_percentage}% complete</span>
                    <span>
                        Depth {progress.current_depth}/{progress.max_depth}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col">
                    <span className="text-muted-foreground">Indexed</span>
                    <span className="font-medium">{progress.pages_indexed}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium">{progress.pages_pending}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-muted-foreground">Links</span>
                    <span className="font-medium">{progress.total_links_found}</span>
                </div>
            </div>

            {/* Error indicator */}
            {progress.pages_failed > 0 && (
                <div className="text-xs text-orange-600 dark:text-orange-400">
                    {progress.pages_failed} page{progress.pages_failed !== 1 ? "s" : ""} failed
                </div>
            )}
        </div>
    );
}
