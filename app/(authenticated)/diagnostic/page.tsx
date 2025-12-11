'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function DiagnosticPage() {
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<any>(null);
    const [userId, setUserId] = useState('');

    const testFindMatch = async () => {
        setResult(null);
        setError(null);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Not logged in');
                return;
            }

            setUserId(user.id);

            console.log('Testing find_match with user:', user.id);

            const { data, error: rpcError } = await supabase.rpc('find_match', {
                p_user_id: user.id,
                p_match_mode: 'global'
            });

            console.log('RPC Response:', { data, error: rpcError });

            if (rpcError) {
                setError(rpcError);
            } else {
                setResult(data);
            }
        } catch (err: any) {
            console.error('Test error:', err);
            setError(err);
        }
    };

    const checkQueue = async () => {
        const { data, error } = await supabase
            .from('waiting_queue')
            .select('*');

        console.log('Queue:', { data, error });
        setResult(data);
        setError(error);
    };

    const checkSessions = async () => {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(10);

        console.log('Sessions:', { data, error });
        setResult(data);
        setError(error);
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Matchmaking Diagnostic</h1>

            <div className="space-y-4 mb-8">
                <Button onClick={testFindMatch} className="mr-4">
                    Test find_match RPC
                </Button>
                <Button onClick={checkQueue} className="mr-4">
                    Check Queue
                </Button>
                <Button onClick={checkSessions}>
                    Check Sessions
                </Button>
            </div>

            {userId && (
                <div className="mb-4 p-4 bg-blue-900/20 rounded">
                    <strong>User ID:</strong> {userId}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-900/20 rounded mb-4">
                    <strong>Error:</strong>
                    <pre className="mt-2 text-sm overflow-auto">
                        {JSON.stringify(error, null, 2)}
                    </pre>
                </div>
            )}

            {result && (
                <div className="p-4 bg-green-900/20 rounded">
                    <strong>Result:</strong>
                    <pre className="mt-2 text-sm overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            <div className="mt-8 p-4 bg-stone-900 rounded">
                <h2 className="text-xl font-bold mb-4">Instructions:</h2>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Click "Test find_match RPC" to test the database function</li>
                    <li>Check browser console (F12) for detailed logs</li>
                    <li>If you see an error, the SQL function isn't deployed correctly</li>
                    <li>If you see success, the function works!</li>
                </ol>
            </div>
        </div>
    );
}
