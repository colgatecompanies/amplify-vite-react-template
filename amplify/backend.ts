import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { fetchImageFn } from './functions/fetch-image/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';

const backend = defineBackend({
  auth,
  data,
  storage,
  fetchImageFn,
});

// Grant the fetch-image Lambda write access to the S3 storage bucket
const bucket = backend.storage.resources.bucket;
const lambdaFn = backend.fetchImageFn.resources.lambda as LambdaFunction;

lambdaFn.addToRolePolicy(
  new PolicyStatement({
    actions: ['s3:PutObject'],
    resources: [`${bucket.bucketArn}/*`],
  })
);

lambdaFn.addEnvironment('BUCKET_NAME', bucket.bucketName);
