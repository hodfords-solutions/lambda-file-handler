import { S3Client, GetObjectCommand, PutObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';
import { writeFileSync } from 'node:fs';
import * as fs from 'node:fs';

export class S3Helper {
    private static _instance: S3Helper;
    client: S3Client;

    static instance() {
        if (!S3Helper._instance) {
            S3Helper._instance = new S3Helper();
        }
        return S3Helper._instance;
    }

    config(config: S3ClientConfig) {
        this.client = new S3Client({ region: config.region, credentials: config.credentials });
    }

    async downloadFile(bucket: string, key: string, destination: string): Promise<GetObjectCommandOutput> {
        const response = await this.client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key
            })
        );
        writeFileSync(destination, await response.Body.transformToByteArray());

        return response;
    }

    async uploadFile(
        bucket: string,
        key: string,
        localPath: string,
        acl: string = 'private',
        metadata: NodeJS.Dict<string> = {}
    ) {
        const fileStream = fs.createReadStream(localPath);
        await this.client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                ACL: acl as any,
                Metadata: metadata,
                Body: fileStream
            })
        );
    }
}
