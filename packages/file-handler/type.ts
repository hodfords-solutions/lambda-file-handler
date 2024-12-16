import { FileDetail, S3File } from '@hodfords/lfh-common';
import { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';

export type Config = {
    handler: any;
    tmpDir?: string;
    awsConfig: S3ClientConfig;
    pathFactory: (original: S3File, result: FileDetail) => string;
    metadataFactory?: (original: S3File, result: FileDetail) => NodeJS.Dict<string>;
    aclFactory?: (original: S3File, result: FileDetail) => string;
    notificationFactory?: (original: S3File, results: FileDetail[]) => NodeJS.Dict<any>;
};

export type SnsEvent = {
    EventSource: string;
    EventVersion: string;
    EventSubscriptionArn: string;
    Sns: {
        Type: string;
        MessageId: string;
        TopicArn: string;
        Subject: string;
        Message: string;
        Timestamp: string;
        SignatureVersion: string;
        Signature: string;
        SigningCertUrl: string;
        UnsubscribeUrl: string;
        MessageAttributes: any;
    };
};

export type S3Event = {
    eventVersion: string;
    eventSource: string;
    awsRegion: string;
    eventTime: string;
    eventName: string;
    userIdentity: {
        principalId: string;
    };
    requestParameters: {
        sourceIPAddress: string;
    };
    responseElements: {
        'x-amz-request-id': string;
        'x-amz-id-2': string;
    };
    s3: {
        s3SchemaVersion: string;
        configurationId: string;
        bucket: {
            name: string;
            ownerIdentity: {
                principalId: string;
            };
            arn: string;
        };
        object: {
            key: string;
            size: string;
            eTag: string;
            versionId: string;
            sequencer: string;
        };
    };
    glacierEventData: {
        restoreEventData: {
            lifecycleRestorationExpiryTime: string;
            lifecycleRestoreStorageClass: string;
        };
    };
};
