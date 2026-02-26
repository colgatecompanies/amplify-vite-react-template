import { uploadData, getUrl, remove } from 'aws-amplify/storage';

export async function uploadEquipmentImage(
  file: File,
  machineryId: string
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `equipment/${machineryId}/${timestamp}-${safeName}`;

  await uploadData({
    path: key,
    data: file,
    options: {
      contentType: file.type,
    },
  }).result;

  return key;
}

export async function resolveImageUrl(key: string): Promise<string> {
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }

  const { url } = await getUrl({ path: key });
  return url.toString();
}

export async function removeImage(key: string): Promise<void> {
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return;
  }
  await remove({ path: key });
}

export async function downloadImage(
  url: string,
  filename: string
): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
