import React from 'react';

const SkeletonLoader = ({ type = 'text', count = 1, className = '' }) => {
    const skeletons = Array(count).fill(0);

    const getStyles = () => {
        switch (type) {
            case 'card':
                return 'h-32 w-full rounded-lg';
            case 'avatar':
                return 'h-8 w-8 rounded-full';
            case 'title':
                return 'h-6 w-3/4 rounded';
            case 'text':
            default:
                return 'h-4 w-full rounded';
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {skeletons.map((_, index) => (
                <div
                    key={index}
                    className={`animate-pulse bg-gray-200 ${getStyles()}`}
                />
            ))}
        </div>
    );
};

export default SkeletonLoader;
