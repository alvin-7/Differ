import { useRef, useCallback, useState } from 'react';

interface DiffResult {
  leftData: any[];
  rightData: any[];
  diffObj: any;
  nullLines: { left: number[]; right: number[] };
  rowTypes: { [key: number]: 'added' | 'removed' | 'modified' };
}

interface UseDiffWorkerReturn {
  calculateDiff: (leftData: any[], rightData: any[]) => Promise<DiffResult>;
  isCalculating: boolean;
  progress: number;
  cancelCalculation: () => void;
}

export const useDiffWorker = (
  onProgress?: (progress: number) => void
): UseDiffWorkerReturn => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

  // Cancel calculation
  const cancelCalculation = useCallback(() => {
    cancelRef.current = true;
    setIsCalculating(false);
    setProgress(0);
  }, []);

  // Calculate diff asynchronously using setTimeout to prevent UI blocking
  const calculateDiff = useCallback(
    (leftData: any[], rightData: any[]): Promise<DiffResult> => {
      return new Promise((resolve, reject) => {
        cancelRef.current = false;
        setIsCalculating(true);
        setProgress(0);

        // Use setTimeout to allow UI to update
        setTimeout(() => {
          try {
            if (cancelRef.current) {
              reject(new Error('Calculation cancelled'));
              return;
            }

            // Update progress
            setProgress(10);
            if (onProgress) onProgress(10);

            // Perform the diff calculation
            const result = window.electronAPI.diffArrays(leftData, rightData);

            if (cancelRef.current) {
              reject(new Error('Calculation cancelled'));
              return;
            }

            // Update progress
            setProgress(100);
            if (onProgress) onProgress(100);

            setIsCalculating(false);
            resolve(result);
          } catch (error) {
            setIsCalculating(false);
            setProgress(0);
            reject(error);
          }
        }, 10); // Small delay to allow UI to update
      });
    },
    [onProgress]
  );

  return {
    calculateDiff,
    isCalculating,
    progress,
    cancelCalculation,
  };
};
