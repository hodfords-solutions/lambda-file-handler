import { S3File } from './type';

export interface FileHandlerInterface {
    file: S3File;

    validation(): Promise<boolean>;

    handle(): Promise<void>;

    getResult(): any;
}
