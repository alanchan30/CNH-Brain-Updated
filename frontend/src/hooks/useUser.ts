import { useState, useEffect } from 'react';
import { supabase } from '@/components/supabaseClient';
import { User } from '@supabase/supabase-js';

const useUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (!sessionData.session) {
                    setUser(null);
                    return;
                }

                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;

                setUser(user);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch user');
                console.error('Error fetching user:', err);
            } finally {
                setLoading(false);
            }
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser(session.user);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { user, loading, error };
};

export default useUser;