import React, { useState } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Video,
  Upload,
  Search,
  Grid,
  List,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  X,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockMediaAssets } from '../../data/mockData';
import { MediaAsset } from '../../types';
import { useToast } from '../../context/ToastContext';

export const MediaLibraryPage: React.FC = () => {
  const { success, error } = useToast();
  const [assets, setAssets] = useState<MediaAsset[]>(mockMediaAssets);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'image' | 'pdf' | 'video'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadType, setUploadType] = useState<'image' | 'pdf' | 'video'>('image');
  const [uploadUrl, setUploadUrl] = useState('');

  // Confirm delete state
  const [confirmAsset, setConfirmAsset] = useState<MediaAsset | null>(null);

  const filteredAssets = assets.filter((asset) => {
    const matchesType = typeFilter === 'ALL' || asset.fileType === typeFilter;
    const matchesSearch = asset.filename.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    success('Link Copied', 'Media asset URL copied to clipboard.');
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFilename.trim() || !uploadUrl.trim()) {
      error('Validation Error', 'Filename and URL are required.');
      return;
    }

    const newAsset: MediaAsset = {
      id: `med-${Date.now()}`,
      filename: uploadFilename,
      fileType: uploadType,
      mimeType:
        uploadType === 'image'
          ? 'image/jpeg'
          : uploadType === 'pdf'
          ? 'application/pdf'
          : 'video/mp4',
      size: uploadType === 'video' ? '14.2 MB' : '1.8 MB',
      url: uploadUrl,
      uploadedBy: 'Hospital Admin',
      uploadDate: '2026-10-30',
      usageCount: 0,
    };

    setAssets((prev) => [newAsset, ...prev]);
    success('Media Uploaded', `Asset "${uploadFilename}" registered in media library.`);
    setIsUploadOpen(false);
    setUploadFilename('');
    setUploadUrl('');
  };

  const handleDelete = () => {
    if (!confirmAsset) return;
    if (confirmAsset.usageCount > 0) {
      error(
        'Action Blocked',
        `Asset "${confirmAsset.filename}" cannot be deleted because it is currently linked to ${confirmAsset.usageCount} campaigns/templates.`
      );
      setConfirmAsset(null);
      return;
    }

    setAssets((prev) => prev.filter((a) => a.id !== confirmAsset.id));
    success('Asset Deleted', `Media file removed.`);
    setConfirmAsset(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Repository of hospital flyers, circular PDFs, and educational videos approved for WhatsApp broadcasts."
      >
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Media</span>
        </button>
      </PageHeader>

      {/* Filter and View Mode Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            {(['ALL', 'image', 'pdf', 'video'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                  typeFilter === t
                    ? 'bg-white shadow-2xs font-bold text-[#243B67]'
                    : 'text-slate-600'
                }`}
              >
                {t === 'ALL' ? 'All Files' : `${t}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Grid vs List toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${
              viewMode === 'grid' ? 'bg-white shadow-2xs text-[#243B67]' : 'text-slate-500'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${
              viewMode === 'list' ? 'bg-white shadow-2xs text-[#243B67]' : 'text-slate-500'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Media Thumbnail */}
              <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden relative group">
                {asset.fileType === 'image' ? (
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : asset.fileType === 'pdf' ? (
                  <div className="flex flex-col items-center text-rose-600">
                    <FileText className="w-12 h-12" />
                    <span className="text-[10px] font-bold mt-1 text-slate-500">PDF Document</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-[#243B67]">
                    <Video className="w-12 h-12" />
                    <span className="text-[10px] font-bold mt-1 text-slate-500">MP4 Video</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {asset.size}
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 truncate" title={asset.filename}>
                  {asset.filename}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{asset.uploadDate}</span>
                  <span className="font-semibold text-[#243B67] bg-[#243B67]/5 px-2 py-0.5 rounded">
                    {asset.usageCount} uses
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleCopyLink(asset.url)}
                  className="text-slate-600 hover:text-[#243B67] font-semibold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Ref
                </button>
                <button
                  onClick={() => setConfirmAsset(asset)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Mode */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Usage Count</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    {asset.fileType === 'image' && <ImageIcon className="w-4 h-4 text-blue-600" />}
                    {asset.fileType === 'pdf' && <FileText className="w-4 h-4 text-rose-600" />}
                    {asset.fileType === 'video' && <Video className="w-4 h-4 text-emerald-600" />}
                    <span>{asset.filename}</span>
                  </td>
                  <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                    {asset.fileType}
                  </td>
                  <td className="py-3 px-4 font-mono">{asset.size}</td>
                  <td className="py-3 px-4">{asset.uploadedBy}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{asset.usageCount}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopyLink(asset.url)}
                        className="p-1.5 text-slate-500 hover:text-[#243B67] hover:bg-slate-100 rounded"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Register Hospital Media Asset</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. infection_control_notice.png"
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Media Type *</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                >
                  <option value="image">Image (JPEG/PNG up to 5MB)</option>
                  <option value="pdf">Document (PDF up to 100MB)</option>
                  <option value="video">Video (MP4 up to 16MB)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Public HTTPS Asset URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://cdn.mapims.org/media/..."
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must be an accessible URL for WATI / Meta WhatsApp media servers.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold shadow-xs"
                >
                  Upload & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(confirmAsset)}
        title="Delete Media Asset?"
        message={`Are you sure you want to remove "${confirmAsset?.filename}"?`}
        confirmLabel="Delete Asset"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmAsset(null)}
      />
    </div>
  );
};
