import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  uploadEquipmentImage,
  resolveImageUrl,
  removeImage,
  downloadImage,
} from '../utils/storageUtils';

const client = generateClient<Schema>();

interface ImageUploaderProps {
  images: string[];
  machineryId: string;
  onChange: (images: string[]) => void;
}

function ImageUploader({ images, machineryId, onChange }: ImageUploaderProps) {
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    images.forEach((key) => {
      if (!resolvedUrls[key]) {
        resolveImageUrl(key).then((url) => {
          setResolvedUrls((prev) => ({ ...prev, [key]: url }));
        });
      }
    });
  }, [images]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus(`Uploading ${files.length} file(s)...`);

    const newKeys: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        setUploadStatus(`Uploading ${i + 1} of ${files.length}...`);
        const key = await uploadEquipmentImage(files[i], machineryId);
        newKeys.push(key);
        const url = await resolveImageUrl(key);
        setResolvedUrls((prev) => ({ ...prev, [key]: url }));
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus(`Error uploading ${files[i].name}`);
      }
    }

    if (newKeys.length > 0) {
      onChange([...images, ...newKeys]);
    }
    setUploading(false);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleLoadUrl() {
    if (!imageUrl.trim()) return;

    setLoadingUrl(true);
    setUploadStatus('Loading image from URL...');

    try {
      // Call Lambda to fetch image server-side (avoids CORS)
      const { data, errors } = await client.queries.fetchImageFromUrl(
        { url: imageUrl, machineryId },
        { authMode: 'userPool' }
      );

      if (errors?.length) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }

      if (!data) {
        throw new Error('No key returned from image fetch');
      }

      const key = data;
      const resolvedUrl = await resolveImageUrl(key);
      setResolvedUrls((prev) => ({ ...prev, [key]: resolvedUrl }));
      onChange([...images, key]);
      setImageUrl('');
      setUploadStatus('');
    } catch (error) {
      console.error('Error loading from URL:', error);
      setUploadStatus(
        'Could not load image from URL. Please check the URL is valid and try again, or download the image and upload it directly.'
      );
    } finally {
      setLoadingUrl(false);
    }
  }

  async function handleRemove(key: string) {
    try {
      await removeImage(key);
    } catch (error) {
      console.error('Error removing image from storage:', error);
    }
    setResolvedUrls((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    onChange(images.filter((k) => k !== key));
  }

  async function handleDownload(key: string) {
    const url = resolvedUrls[key];
    if (!url) return;
    const parts = key.split('/');
    const filename = parts[parts.length - 1] || 'equipment-image.jpg';
    await downloadImage(url, filename);
  }

  return (
    <div className="image-uploader">
      <label>Images</label>

      {images.length > 0 && (
        <div className="image-uploader-grid">
          {images.map((key) => (
            <div key={key} className="image-uploader-item">
              {resolvedUrls[key] ? (
                <img src={resolvedUrls[key]} alt="Equipment" />
              ) : (
                <div className="image-uploader-placeholder">Loading...</div>
              )}
              <div className="image-uploader-actions">
                <button
                  type="button"
                  className="image-download-btn"
                  onClick={() => handleDownload(key)}
                  title="Download image"
                >
                  Download
                </button>
                <button
                  type="button"
                  className="image-remove-btn"
                  onClick={() => handleRemove(key)}
                  title="Remove image"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="image-upload-controls">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading || loadingUrl}
          />
        </div>

        <div className="image-url-loader">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={uploading || loadingUrl}
          />
          <button
            type="button"
            className="submit-button"
            onClick={handleLoadUrl}
            disabled={uploading || loadingUrl || !imageUrl.trim()}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {loadingUrl ? 'Loading...' : 'Load'}
          </button>
        </div>
      </div>

      {uploadStatus && (
        <p className="image-upload-progress">{uploadStatus}</p>
      )}
    </div>
  );
}

export default ImageUploader;
