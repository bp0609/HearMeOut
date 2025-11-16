// Hook for fetching and managing activity data

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Activity } from '@/types';

export function useActivities() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activitiesMap, setActivitiesMap] = useState<Map<string, Activity>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchActivities() {
            try {
                setLoading(true);
                setError(null);
                const data = await api.getActivities();
                setActivities(data);

                // Create a map for quick lookups
                const map = new Map<string, Activity>();
                data.forEach(activity => {
                    map.set(activity.key, activity);
                });
                setActivitiesMap(map);
            } catch (err) {
                console.error('Error fetching activities:', err);
                setError('Failed to load activities');
            } finally {
                setLoading(false);
            }
        }

        fetchActivities();
    }, []);

    return {
        activities,
        activitiesMap,
        loading,
        error,
    };
}
