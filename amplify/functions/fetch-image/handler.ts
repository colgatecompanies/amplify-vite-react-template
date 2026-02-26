import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client();

export const handler = async (event: {
  arguments: { url: string; machineryId: string };
}) => {
  const { url, machineryId } = event.arguments;
  const bucketName = process.env.BUCKET_NAME;

  if (!bucketName) {
    throw new Error('BUCKET_NAME environment variable is not set');
  }

  // Fetch the image server-side (no CORS restrictions)
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  // Extract and sanitize filename from URL
  const urlParts = url.split('/');
  let filename = urlParts[urlParts.length - 1]?.split('?')[0] || 'image.jpg';
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  const key = `equipment/${machineryId}/${Date.now()}-${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return key;
};
