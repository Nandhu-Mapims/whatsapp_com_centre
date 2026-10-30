import React, { useState } from 'react';
import {
  DownloadCloud,
  FileSpreadsheet,
  FileText,
  Clock,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { mockExportJobs, mockDepartments } from '../../data/mockData';
import { ExportJob } from '../../types';
import { useToast } from '../../context/ToastContext';

export const ExportReportsPage: React.FC = () => {
  const { success } = useToast();

  const [exportJobs, setExportJobs] = useState<ExportJob[]>(mockExportJobs);
  const [reportType, setReportType] = useState('Delivery Status Summary');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [department, setDepartment] = useState('ALL');
  const [format, setFormat] = useState<'XLSX' | 'CSV'>('XLSX');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportCards = [
    {
      title: 'Delivery Status Summary',
      description: 'Comprehensive recipient-by-recipient status log with provider timestamps and read confirmations.',
      icon: FileSpreadsheet,
      badge: 'Operational',
    },
    {
      title: 'Failed Messages & Diagnostic Logs',
      description: 'Detailed error trace of bounces, rate limits, and suppressed opt-outs for clinical audits.',
      icon: FileText,
      badge: 'Audit & Compliance',
    },
    {
      title: 'Department Communication Analytics',
      description: 'Aggregated metrics comparing staff acknowledgment times across hospital wings.',
      icon: FileSpreadsheet,
      badge: 'Management',
    },
    {
      title: 'Full Audit Trail Archive',
      description: 'Chronological timeline of employee imports, campaign approvals, and administrative actions.',
      icon: FileText,
      badge: 'Security',
    },
  ];

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const newJob: ExportJob = {
        id: `exp-${Date.now().toString().slice(-4)}`,
        reportType,
        dateRange,
        format,
        requestedBy: 'Current User',
        requestedAt: '2026-10-30 14:55',
        status: 'READY',
        fileSize: format === 'XLSX' ? '640 KB' : '180 KB',
        downloadUrl: '#',
      };
      setExportJobs((prev) => [newJob, ...prev]);
      setIsGenerating(false);
      success(
        'Export Generated',
        `"${reportType}" in ${format} format is ready for download.`
      );
    }, 1200);
  };

  const handleDownloadFile = (job: ExportJob) => {
    // Generate realistic simulated file download
    const filename = `${job.reportType.replace(/\s+/g, '_')}_${Date.now()}.${job.format.toLowerCase()}`;
    const dummyContent = `Report: ${job.reportType}\nOrganization: MAPIMS Hospitals\nDate Range: ${job.dateRange}\nStatus: Verified\nTimestamp: 2026-10-30`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Download Started', `Saved ${filename} to your device.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export Reports & Audits"
        description="Generate official compliance reports, delivery audit logs, and departmental engagement spreadsheets."
      />

      {/* Report Types Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((card) => {
          const isSelected = reportType === card.title;
          return (
            <div
              key={card.title}
              onClick={() => setReportType(card.title)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#243B67]/5 border-[#243B67] shadow-sm ring-1 ring-[#243B67]'
                  : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {card.badge}
                  </span>
                  <card.icon
                    className={`w-5 h-5 ${
                      isSelected ? 'text-[#243B67]' : 'text-slate-400'
                    }`}
                  />
                </div>
                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                  {card.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#243B67] font-semibold">
                <span>{isSelected ? '✓ Selected' : 'Select'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generator Configuration Form */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900">Configure Export Parameters</h3>
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>Year to Date (2026)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Scope</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All Hospital Departments</option>
              {mockDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">File Format</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="fmt"
                  checked={format === 'XLSX'}
                  onChange={() => setFormat('XLSX')}
                  className="text-[#243B67] focus:ring-[#243B67]"
                />
                <span>Excel (.xlsx)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium ml-2">
                <input
                  type="radio"
                  name="fmt"
                  checked={format === 'CSV'}
                  onChange={() => setFormat('CSV')}
                  className="text-[#243B67] focus:ring-[#243B67]"
                />
                <span>CSV (.csv)</span>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2 px-4 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <DownloadCloud className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
              <span>{isGenerating ? 'Compiling Report...' : 'Generate Report'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Reports History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900">Recent Export Jobs</h3>
          <span className="text-slate-400 text-xs">Files retained for 30 days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report Type</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Requested At</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {exportJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{job.reportType}</td>
                  <td className="py-3 px-4 text-slate-600">{job.dateRange}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{job.format}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{job.requestedAt}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{job.fileSize}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDownloadFile(job)}
                      className="px-3 py-1 bg-slate-100 hover:bg-[#243B67] hover:text-white text-[#243B67] rounded font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
