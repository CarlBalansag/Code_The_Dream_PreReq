"use client";

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileJson, CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * ImportDataModal Component
 * Modal for importing Spotify listening history from JSON files
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close modal callback
 * @param {string} userId - User's Spotify ID
 */
export default function ImportDataModal({ isOpen, onClose, userId }) {
  const MAX_UPLOAD_MB = 3.5;
  const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on the client side before using portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle file selection
  const handleFileChange = (selectedFiles) => {
    setError(null);
    setSuccess(false);

    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];
    const existingTotalBytes = files.reduce((total, file) => total + file.size, 0);
    let newFilesBytes = 0;

    fileArray.forEach((file) => {
      // Validate file type
      if (!file.name.endsWith('.json')) {
        errors.push(`${file.name}: Must be a JSON file`);
        return;
      }

      // Validate file size (multipart overhead + Vercel limit => keep well under 4.5MB total)
      if (file.size > MAX_UPLOAD_BYTES) {
        errors.push(`${file.name}: Too large (max ~${MAX_UPLOAD_MB}MB). Please split large files.`);
        return;
      }

      newFilesBytes += file.size;
      validFiles.push(file);
    });

    if (existingTotalBytes + newFilesBytes > MAX_UPLOAD_BYTES) {
      errors.push(`Total upload too large (max ~${MAX_UPLOAD_MB}MB per request). Please upload smaller files one at a time.`);
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0 && errors.length === 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  }, []);

  // Poll for import progress
  const pollProgress = async (importJobId) => {
    try {
      const response = await fetch(`/api/import/status/${importJobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get import status');
      }

      setProgress(data);

      // If still processing, poll again
      if (data.status === 'processing' || data.status === 'pending') {
        setTimeout(() => pollProgress(importJobId), 2000);
      } else if (data.status === 'completed') {
        setProcessing(false);
        setSuccess(true);
        setFiles([]);
      } else if (data.status === 'failed') {
        setProcessing(false);
        setError(data.errorMessage || 'Import failed');
      }
    } catch (err) {
      console.error('Error polling progress:', err);
      setError(err.message);
      setProcessing(false);
    }
  };

  // Handle file upload and start import
  const handleUpload = async () => {
    if (files.length === 0 || !userId) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Append all files
      files.forEach((file) => {
        formData.append('files', file);
      });

      formData.append('userId', userId);

      const response = await fetch('/api/import/spotify-history', {
        method: 'POST',
        body: formData,
      });

      // Handle 413 error (file too large)
      if (response.status === 413) {
        throw new Error(`Upload too large. Keep the total request under ~${MAX_UPLOAD_MB}MB (multipart overhead included) or upload files one at a time.`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Server error. Please try again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start import');
      }

      console.log('✅ Import started:', data);
      setJobId(data.jobId);
      setUploading(false);
      setProcessing(true);

      // Start polling for progress
      pollProgress(data.jobId);

    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message);
      setUploading(false);
    }
  };

  // Remove a specific file
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset modal state
  const handleClose = () => {
    setFiles([]);
    setError(null);
    setSuccess(false);
    setProgress(null);
    setJobId(null);
    setProcessing(false);
    setUploading(false);
    onClose();
  };

  // Don't render on server-side or if not mounted
  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            key="import-modal-backdrop"
            className="fixed inset-0 z-[99999] bg-black/85"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Modal Content */}
          <motion.div
            key="import-modal-content"
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-[#121212] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", damping: 25 }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#282828] p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Import Spotify History</h2>
                  <p className="text-sm text-gray-400 mt-1">Upload your Spotify data export JSON files</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-200 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-[#1e3a8a]/20 border border-[#3b82f6]/30 rounded-lg p-4">
            <h3 className="text-[#3b82f6] font-semibold mb-3">How to Get Your Spotify Data:</h3>
            <ol className="text-sm text-gray-200 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://www.spotify.com/account/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1DB954] hover:underline">spotify.com/account/privacy</a></li>
              <li>Scroll to &quot;Download your data&quot;</li>
              <li>Click &quot;Request&quot; (Spotify will email you in 1-30 days)</li>
              <li>Download the ZIP file from your email</li>
              <li>Extract and find files named <code className="bg-black/30 px-1 py-0.5 rounded">StreamingHistory*.json</code></li>
              <li>Upload all JSON files here (you can select multiple at once)</li>
            </ol>
            <p className="text-xs text-gray-400 mt-3">
              Note: Total upload must be under ~{MAX_UPLOAD_MB}MB per request (Vercel serverless limit). If your files are larger, split them or upload one at a time.
            </p>
          </div>

          {/* Upload Area */}
          {!processing && !success && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-[#1DB954] bg-[#1DB954]/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {files.length > 0 ? (
                <div className="space-y-4">
                  <FileJson className="w-16 h-16 text-[#1DB954] mx-auto" />
                  <div className="text-left max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-[#181818] p-3 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-3 p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                          aria-label="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-400">
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setFiles([])}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Clear All
                    </button>
                    <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept=".json"
                        multiple
                        onChange={(e) => e.target.files && handleFileChange(e.target.files)}
                        className="hidden"
                      />
                      Add More
                    </label>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="px-6 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Start Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-white font-medium mb-2">Drag and drop your JSON files here</p>
                    <p className="text-sm text-gray-400">or</p>
                  </div>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".json"
                      multiple
                      onChange={(e) => e.target.files && handleFileChange(e.target.files)}
                      className="hidden"
                    />
                    <span className="px-6 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium rounded-lg text-sm cursor-pointer inline-block transition-colors">
                      Browse Files
                    </span>
                  </label>
                  <p className="text-xs text-gray-500">Maximum upload size: ~{MAX_UPLOAD_MB}MB per request (split large files if needed)</p>
                </div>
              )}
            </div>
          )}

          {/* Progress Display */}
          {processing && progress && (
            <div className="bg-[#181818] rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Importing...</h3>
                <span className="text-sm text-gray-400">{progress.percentComplete || 0}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#1DB954] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percentComplete || 0}%` }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Processed</p>
                  <p className="text-white font-semibold">{progress.processedTracks?.toLocaleString()} / {progress.totalTracks?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <p className="text-[#1DB954] font-semibold capitalize">{progress.status}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                This may take several minutes for large files. Please don&apos;t close this window.
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && progress && (
            <div className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-[#1DB954]" />
                <div>
                  <h3 className="text-white font-semibold">Import Complete!</h3>
                  <p className="text-sm text-gray-200">Successfully imported {progress.totalTracks?.toLocaleString()} plays</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full px-6 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-sm text-gray-200 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Warning */}
          {!processing && !success && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-500 text-sm font-medium mb-1">⚠️ Important</p>
              <ul className="text-xs text-gray-200 space-y-1 list-disc list-inside">
                <li>Large files may take several minutes to process</li>
                <li>Duplicate plays will be automatically skipped</li>
                <li>You can close this modal during import (it continues in the background)</li>
                <li>You can upload multiple JSON files at once</li>
              </ul>
            </div>
          )}
        </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}
