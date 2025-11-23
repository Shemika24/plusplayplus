import React, { useMemo } from 'react';

interface ProgressDataItem {
    id: string;
    title: string;
    completed: number;
    total: number;
    color: string;
}

interface DailyProgressProps {
    progressData: ProgressDataItem[];
}

const DailyProgress: React.FC<DailyProgressProps> = ({ progressData }) => {
    const { totalCompleted, totalPossible } = useMemo(() => {
        return progressData.reduce(
            (acc, item) => {
                acc.totalCompleted += item.completed;
                acc.totalPossible += item.total;
                return acc;
            },
            { totalCompleted: 0, totalPossible: 0 }
        );
    }, [progressData]);

    return (
        <div className="bg-white p-4 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-dark">Daily Ad Progress</h3>
                <span className="font-bold text-dark text-sm">
                    {totalCompleted.toLocaleString()} / {totalPossible.toLocaleString()}
                </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                {progressData.map(item => {
                    const percentage = totalPossible > 0 ? (item.completed / totalPossible) * 100 : 0;
                    if (percentage === 0) return null;
                    return (
                        <div
                            key={item.id}
                            className={`${item.color} h-4 transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                            title={`${item.title}: ${item.completed}/${item.total}`}
                        ></div>
                    );
                })}
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-2 mt-3 text-xs">
                {progressData.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${item.color} flex-shrink-0`}></div>
                        <div className="flex-grow min-w-0">
                            <span className="font-medium text-dark truncate block">{item.title}</span>
                            <span className="text-gray">{item.completed}/{item.total}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(DailyProgress);
