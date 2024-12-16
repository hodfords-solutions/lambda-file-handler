import { Config, S3Event, SnsEvent } from './type';
import * as fs from 'node:fs';
import { FileDetail, FileHandlerInterface, makeUuid, S3File } from '@hodfords/lfh-common';
import { S3Helper } from '@hodfords/lfh-common';
import { fileTypeFromFile } from 'file-type';
import { FileNotSupportException } from './file-not-support.exception';

export class FileHandler {
    private tmpDir: string;
    private file: S3File;
    private handler: FileHandlerInterface;

    constructor(
        private config: Config,
        private events: SnsEvent[]
    ) {
        S3Helper.instance().config(config.awsConfig);
        this.tmpDir = `${config.tmpDir}/${makeUuid()}` || `${process.cwd()}/tmp/${makeUuid()}`;
    }

    prepareEvent() {
        if (this.events.length !== 1) {
            throw new Error('Currently, AWS S3 has only one Record. Throw exception if SNS/S3 has data changes.');
        }
        let event = this.events[0];
        let s3Events: S3Event[] = JSON.parse(event.Sns.Message).Records;
        if (s3Events.length !== 1) {
            throw new Error('Currently, AWS S3 has only one Record. Throw exception if SNS/S3 has data changes.');
        }
        let s3Event = s3Events[0];
        if (s3Event.s3.object.key.split('.').length < 2) {
            throw new Error('Cannot get extension from file.');
        }

        this.file = {
            s3: {
                bucket: s3Event.s3.bucket.name,
                path: s3Event.s3.object.key,
                detail: {
                    size: s3Event.s3.object.size
                }
            },
            rootExtension: s3Event.s3.object.key.split('.').pop(),
            local: {
                tmpDir: this.tmpDir,
                fileType: null,
                key: makeUuid()
            }
        };
    }

    createTmpDir(): void {
        fs.mkdirSync(this.tmpDir, { recursive: true });
    }

    async getFileToLocal(): Promise<void> {
        let localPath = `${this.tmpDir}/${this.file.local.key}.${this.file.rootExtension}`;
        let file = await S3Helper.instance().downloadFile(this.file.s3.bucket, this.file.s3.path, localPath);
        this.file.s3.metadata = file.Metadata;
        let fileType = await fileTypeFromFile(localPath);
        this.file.local.fileType = fileType.mime;
    }

    async validation(): Promise<void> {
        let handler = await this.getHandler();
        if (!handler) {
            throw new FileNotSupportException('File not support.');
        }
        await handler.validation();
    }

    async handle(): Promise<void> {
        this.createTmpDir();
        this.prepareEvent();
        await this.getFileToLocal();
        await this.validation();
        const handler = await this.getHandler();
        await handler.handle();
        await this.uploadFile();
        this.removeTmpDir();
        return this.getNotification();
    }

    async getHandler(): Promise<FileHandlerInterface> {
        if (!this.handler) {
            this.handler = await this.config.handler(this.file);
        }
        return this.handler;
    }

    async uploadFile(): Promise<void> {
        let results: FileDetail[] = this.handler.getResult();
        await Promise.all(
            results.map(async (result) => {
                let localPath = `${this.tmpDir}/${result.name}`;
                let key = this.config.pathFactory(this.file, result);
                let acl = this.config.aclFactory ? this.config.aclFactory(this.file, result) : 'private';
                let metadata = this.config.metadataFactory ? this.config.metadataFactory(this.file, result) : {};
                result.path = key;
                await S3Helper.instance().uploadFile(this.file.s3.bucket, key, localPath, acl, metadata);
            })
        );
    }

    removeTmpDir(): void {
        fs.rmSync(this.tmpDir, { force: true, recursive: true });
    }

    async getNotification(): Promise<any> {
        let notification = {
            statusCode: 200,
            data: this.handler.getResult(),
            type: 'S3_FILE_HANDLE'
        };
        if (this.config.notificationFactory) {
            notification = { ...notification, ...this.config.notificationFactory(this.file, this.handler.getResult()) };
        }

        return notification;
    }

    async buildFailedNotification(error: Error): Promise<any> {
        let notification = {
            statusCode: 500,
            data: error.message,
            type: 'S3_FILE_HANDLE'
        };

        if (this.config.notificationFactory) {
            notification = { ...notification, ...this.config.notificationFactory(this.file, null) };
        }
        return notification;
    }
}
