import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types';

interface ActivitySelectorProps {
    selectedActivities: string[];
    onSelectionChange: (activityKeys: string[]) => void;
    activities: Activity[];
    moodColor?: string; // Color from the selected mood emoji
}

export function ActivitySelector({
    selectedActivities,
    onSelectionChange,
    activities,
    moodColor = '#a855f7', // Default to purple if no mood color provided
}: ActivitySelectorProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set(selectedActivities));

    useEffect(() => {
        setSelected(new Set(selectedActivities));
    }, [selectedActivities]);

    const toggleActivity = (activityKey: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(activityKey)) {
            newSelected.delete(activityKey);
        } else {
            newSelected.add(activityKey);
        }
        setSelected(newSelected);
        onSelectionChange(Array.from(newSelected));
    };

    const isSelected = (activityKey: string) => selected.has(activityKey);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activities.map((activity) => {
                const selected = isSelected(activity.key);

                return (
                    <button
                        key={activity.key}
                        type="button"
                        onClick={() => toggleActivity(activity.key)}
                        className={cn(
                            'relative p-4 rounded-xl border-2 transition-all duration-200',
                            'flex flex-col items-center gap-2',
                            'hover:scale-105 active:scale-95',
                            selected
                                ? 'shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                        style={{
                            backgroundColor: selected ? `${moodColor}15` : undefined,
                            borderColor: selected ? moodColor : undefined,
                        }}
                    >
                        {/* Selection indicator */}
                        {selected && (
                            <div
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                                style={{ backgroundColor: moodColor }}
                            >
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}

                        {/* Icon */}
                        <div className="text-3xl emoji">{activity.icon}</div>

                        {/* Label */}
                        <span
                            className={cn(
                                'text-sm font-medium text-center',
                                selected ? 'text-gray-900' : 'text-gray-600'
                            )}
                        >
                            {activity.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
