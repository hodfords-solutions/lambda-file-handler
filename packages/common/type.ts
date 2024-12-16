export type S3File = {
    s3: {
        bucket: string;
        path: string;
        detail: any;
        metadata?: NodeJS.Dict<string>;
    };
    local: {
        tmpDir: string;
        key: string;
        fileType: string;
    };
    rootExtension: string;
};

export type Dimension = {
    width: number;
    height: number;
    keepAspectRatio?: boolean;
};

export type FileDetail = {
    name: string;
    format: string;
    size: number;
    type: string;
    isOriginal: boolean;
    path?: string;
};
