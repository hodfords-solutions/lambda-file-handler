import { Dimension, FileDetail } from '@hodfords/lfh-common';

export type Config = {
    dimensions: Dimension[];
    allowMimeType: string[];
    format?: string[];
    keepOriginalFormat?: boolean;
    keepLargeFileIsOriginalFormat?: boolean;
    keepOriginalFile?: boolean;
};

export type ImageResult = FileDetail & {
    dimension: { width: number; height: number };
    type: 'image';
};
