'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Terminal, AlertTriangle, Info, CheckCircle, XCircle, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type LogEntry = {
    id: string
    level: 'info' | 'warning' | 'error' | 'success'
    message: string
    timestamp: string
    source: string
}

export function SystemLogsTab() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [filter, setFilter] = useState<string>('all')

    useEffect(() => {
        fetchLogs()

        // Real-time subscription
        const channel = supabase
            .channel('system_logs')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'system_logs'
                },
                (payload) => {
                    const newLog = payload.new as any
                    setLogs(prev => [
                        {
                            id: newLog.id,
                            level: newLog.level,
                            message: newLog.message,
                            timestamp: newLog.created_at,
                            source: newLog.source
                        },
                        ...prev
                    ].slice(0, 50)) // Keep last 50 logs
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [])

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error

            setLogs(data?.map(log => ({
                id: log.id,
                level: log.level as any,
                message: log.message,
                timestamp: log.created_at,
                source: log.source
            })) || [])
        } catch (error) {
            console.error('Error fetching logs:', error)
        }
    }

    const filteredLogs = filter === 'all'
        ? logs
        : logs.filter(log => log.level === filter)

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Filter className="w-4 h-4 text-stone-500" />
                        <Button
                            size="sm"
                            variant={filter === 'all' ? 'default' : 'ghost'}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            size="sm"
                            variant={filter === 'info' ? 'default' : 'ghost'}
                            onClick={() => setFilter('info')}
                        >
                            Info
                        </Button>
                        <Button
                            size="sm"
                            variant={filter === 'warning' ? 'default' : 'ghost'}
                            onClick={() => setFilter('warning')}
                        >
                            Warnings
                        </Button>
                        <Button
                            size="sm"
                            variant={filter === 'error' ? 'default' : 'ghost'}
                            onClick={() => setFilter('error')}
                        >
                            Errors
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Logs */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="w-5 h-5" />
                        System Logs ({filteredLogs.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 font-mono text-sm">
                        {filteredLogs.map((log) => (
                            <LogLine key={log.id} log={log} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function LogLine({ log }: { log: LogEntry }) {
    const icons = {
        info: <Info className="w-4 h-4 text-blue-400" />,
        warning: <AlertTriangle className="w-4 h-4 text-orange-400" />,
        error: <XCircle className="w-4 h-4 text-red-400" />,
        success: <CheckCircle className="w-4 h-4 text-green-400" />
    }

    const colors = {
        info: 'border-l-blue-500',
        warning: 'border-l-orange-500',
        error: 'border-l-red-500',
        success: 'border-l-green-500'
    }

    return (
        <div className={`p-3 bg-stone-950/50 rounded border-l-4 ${colors[log.level]} border-white/5 hover:bg-stone-950/80 transition-colors`}>
            <div className="flex items-start gap-3">
                {icons[log.level]}
                <div className="flex-1">
                    <p className="text-stone-300">{log.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-stone-600">
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                            {log.source}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    )
}
