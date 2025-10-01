import {isNullish} from '@dfinity/utils';
import {useCallback, useLayoutEffect, useMemo, useState} from 'react';

export const useWindowSize = (step: number = 50) => {
    const [windowSize, setWindowSize] = useState({width: 0, height: 0});

    const handleSize = useCallback(() => {
        setWindowSize({
            width: getClosestStep(window.innerWidth, step),
            height: getClosestStep(window.innerHeight, step)
        });
    }, [step]);

    useLayoutEffect(() => {
        handleSize();

        window.addEventListener('resize', handleSize);

        return () => window.removeEventListener('resize', handleSize);
    }, [handleSize]);

    return useMemo(() => {
        return {
            width: windowSize.width,
            height: windowSize.height
        };
    }, [windowSize.width, windowSize.height]);
};

const getClosestStep = (width: number, step: number | undefined) => {
    if (isNullish(step)) {
        return width;
    }
    return Math.round(width / step) * step;
};
