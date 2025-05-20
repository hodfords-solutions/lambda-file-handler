import { Dimension, FileDetail } from '@hodfords/lfh-common';
import { WatermarkOptions } from '@hodfords/lfh-watermark';

export type Config = {
    dimensions: Dimension[];
    allowMimeType: string[];
    format?: string[];
    keepOriginalFormat?: boolean;
    keepLargeFileIsOriginalFormat?: boolean;
    keepOriginalFile?: boolean;
    watermark?: WatermarkOptions;
};

export type ImageResult = FileDetail & {
    dimension: { width: number; height: number };
    type: 'image';
};
