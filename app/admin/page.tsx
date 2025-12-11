'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Server, Database, Save, Activity } from 'lucide-react';
import { toast } from '@/lib/toast';

interface MatchmakingConfig {
    mode: 'supabase' | 'websocket';
    ws_url: string;
}

export default function AdminDashboard() {
    const [config, setConfig] = useState<MatchmakingConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [wsCount, setWsCount] = useState<number | null>(null);

    useEffect(() => {
        fetchSettings();
        // Poll for WebSocket health if in WS mode
        const interval = setInterval(checkWsHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'matchmaking_config')
                .single();

            if (error) throw error;
            if (data) {
                setConfig(data.value);
            } else {
                // Default if no settings exist
                setConfig({ mode: 'supabase', ws_url: 'ws://localhost:8080' });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            toast.error('Failed to load settings');
            // Fallback
            setConfig({ mode: 'supabase', ws_url: 'ws://localhost:8080' });
        } finally {
            setLoading(false);
        }
    };

    const checkWsHealth = async () => {
        if (config?.mode !== 'websocket' || !config.ws_url) return;

        // Simple health check fetch if your WS server supports HTTP /health
        try {
            const httpUrl = config.ws_url.replace('ws://', 'http://').replace('wss://', 'https://');
            const res = await fetch(`${httpUrl}/health`);
            const data = await res.json();
            setWsCount(data.connections || 0);
        } catch (e) {
            setWsCount(null);
        }
    };

    const saveSettings = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('system_settings')
                .update({ value: config })
                .eq('key', 'matchmaking_config');

            if (error) throw error;
            toast.success('System settings updated successfully');
        } catch (err) {
            console.error('Error saving settings:', err);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">🛡️ Gurukul Admin Console</h1>

            <div className="grid gap-6">
                {/* MATCHMAKING CONTROL CARD */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-semibold">Matchmaking Engine</h2>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${config?.mode === 'websocket' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            CURRENT: {config?.mode?.toUpperCase()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* OPTION 1: SUPABASE */}
                        <div
                            className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${config?.mode === 'supabase' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                            onClick={() => setConfig({ ...config!, mode: 'supabase' })}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Database className="w-5 h-5" />
                                <h3 className="font-bold">Supabase (Legacy)</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Uses PostgreSQL polling & Realtime. Limit: ~200 users. Free but doesn't scale.
                            </p>
                        </div>

                        {/* OPTION 2: WEBSOCKET */}
                        <div
                            className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${config?.mode === 'websocket' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                            onClick={() => setConfig({ ...config!, mode: 'websocket' })}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Server className="w-5 h-5" />
                                <h3 className="font-bold">WebSocket (Turbo)</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Takes 10k+ users. Uses Railway server. Zero DB load. Instant 5ms matches.
                            </p>
                            {config?.mode === 'websocket' && wsCount !== null && (
                                <div className="mt-2 text-xs text-green-600 font-mono">
                                    • {wsCount} active connections
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CONFIGURATION */}
                    {config?.mode === 'websocket' && (
                        <div className="mb-6 animate-in slide-in-from-top-2">
                            <label className="block text-sm font-medium mb-2">WebSocket Server URL</label>
                            <input
                                type="text"
                                value={config.ws_url}
                                onChange={(e) => setConfig({ ...config, ws_url: e.target.value })}
                                className="w-full p-2 border rounded bg-background"
                                placeholder="wss://your-app.up.railway.app"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Deploy code from <code>/matchmaking-server</code> to Railway/Render first.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={saveSettings} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Apply Changes
                        </Button>
                    </div>
                </div>

                {/* OTHER ADMIN SECTIONS */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 border rounded-lg bg-muted/20 opacity-50">
                        <h3 className="font-bold mb-2">User Management</h3>
                        <p className="text-sm">Manage bans, reports, and verifications.</p>
                        <Button variant="outline" size="sm" className="mt-4" disabled>Coming Soon</Button>
                    </div>
                    <div className="p-6 border rounded-lg bg-muted/20 opacity-50">
                        <h3 className="font-bold mb-2">Analytics</h3>
                        <p className="text-sm">View growth, retention, and activity.</p>
                        <Button variant="outline" size="sm" className="mt-4" disabled>Coming Soon</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
