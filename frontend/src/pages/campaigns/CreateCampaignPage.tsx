import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  Users,
  FileText,
  Smartphone,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Search,
  Sparkles,
  Phone,
  RefreshCw,
  Building2,
  GraduationCap,
  Clock,
  Radio,
  Check,
  X,
  Filter,
  RotateCcw,
  ExternalLink,
  Zap,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { WhatsAppPhonePreview } from '../../components/common/WhatsAppPhonePreview';
import { mockCategories, mockDepartments, mockEmployees, mockTemplates } from '../../data/mockData';
import { WhatsAppTemplate, Employee, Campaign } from '../../types';
import { VaatiMessageType } from '../../types/vaati';
import { VaatiFormatEditor } from '../../components/vaati/VaatiFormatEditor';
import { normalizePhoneNumber, toE164Phone } from '../../utils/phoneUtils';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

type FlowStep = 1 | 2 | 3 | 4;
type CadreScope = 'BOTH' | 'TEACHING_ONLY' | 'NON_TEACHING_ONLY' | 'SPECIFIC_STAFF' | 'DIRECT_NUMBERS';

const DRAFT_STORAGE_KEY = 'aph_saved_campaign_draft';

interface SavedCampaignDraft {
  title?: string;
  gateway?: 'WATI' | 'VAATI';
  hasUserEditedTitle?: boolean;
  priority?: 'Normal' | 'Urgent' | 'Emergency';
  selectedTemplateId?: string;
  variableValues?: Record<string, string>;
  variableValuesByTemplate?: Record<string, Record<string, string>>;
  cadreScope?: CadreScope;
  selectedDepartments?: string[];
  selectedDesignations?: string[];
  selectedSpecificIds?: string[];
  customNumbersInput?: string;
  testNumber?: string;
  testRecipientName?: string;
  savedAt?: string;
}

const loadSavedDraft = (): SavedCampaignDraft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse saved campaign draft:', e);
  }
  return null;
};

export const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlGateway = searchParams.get('gateway');
  const urlTemplateId = searchParams.get('templateId');
  const { success, error, warning } = useToast();
  const { currentUser } = useAuth();

  const [initialDraft] = useState<SavedCampaignDraft | null>(() => loadSavedDraft());
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(() => {
    return Boolean(
      initialDraft &&
      (initialDraft.title || (initialDraft.variableValues && Object.keys(initialDraft.variableValues).length > 0))
    );
  });

  const [step, setStep] = useState<FlowStep>(1);

  // Gateway Selection & Health State (WATI vs VAATI)
  const [selectedGateway, setSelectedGateway] = useState<'WATI' | 'VAATI'>(
    urlGateway === 'VAATI' ? 'VAATI' : initialDraft?.gateway || 'VAATI'
  );
  const [vaatiTemplates, setVaatiTemplates] = useState<any[]>([]);
  const [vaatiMessageType, setVaatiMessageType] = useState<VaatiMessageType>('text');
  const [vaatiCtaUrl, setVaatiCtaUrl] = useState('https://inc.mapims.edu.in/login');
  const [vaatiMediaUrl, setVaatiMediaUrl] = useState('');
  const [vaatiMediaFilename, setVaatiMediaFilename] = useState('');
  const [vaatiMediaMimetype, setVaatiMediaMimetype] = useState('');
  const [vaatiPollOptions, setVaatiPollOptions] = useState<string[]>([
    'Yes, Confirm 👍',
    'No, Cancel ❌',
  ]);
  const [vaatiMultipleAnswers, setVaatiMultipleAnswers] = useState(false);
  const [vaatiAllowReplies, setVaatiAllowReplies] = useState(false);
  const [vaatiReplyPrompt, setVaatiReplyPrompt] = useState(
    '💬 Reply directly to this message to submit your response.'
  );
  const [gatewayStatus, setGatewayStatus] = useState<{
    activeGateway: string;
    isVaatiEnabled: boolean;
    vaati: {
      enabled: boolean;
      online: boolean;
      session: string;
      phone?: string;
      pushName?: string;
      error?: string;
    };
    wati: {
      enabled: boolean;
      endpoint: string;
      status: string;
    };
  } | null>(null);
  const [isTogglingGateway, setIsTogglingGateway] = useState(false);

  // Fetch gateway status
  const fetchGatewayStatus = () => {
    fetch('/api/gateway/status')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setGatewayStatus(json.data);
          if (!json.data.isVaatiEnabled && selectedGateway === 'VAATI') {
            setSelectedGateway('WATI');
          }
        }
      })
      .catch((err) => console.warn('Could not fetch gateway status:', err));
  };

  useEffect(() => {
    fetchGatewayStatus();
  }, []);

  const handleToggleVaati = async (enable: boolean) => {
    setIsTogglingGateway(true);
    try {
      const res = await fetch('/api/gateway/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ gateway: 'VAATI', enabled: enable }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        success('Gateway Updated', json.message);
        if (!enable) {
          setSelectedGateway('WATI');
        } else {
          setSelectedGateway('VAATI');
        }
        fetchGatewayStatus();
      } else {
        error('Toggle Failed', json.message || 'Could not toggle VAATI gateway.');
      }
    } catch (err: any) {
      error('Network Error', err.message);
    } finally {
      setIsTogglingGateway(false);
    }
  };

  // Common: Campaign Header (restored from saved draft if available)
  const [title, setTitle] = useState(initialDraft?.title || '');
  const [hasUserEditedTitle, setHasUserEditedTitle] = useState(Boolean(initialDraft?.hasUserEditedTitle || initialDraft?.title));
  const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>(initialDraft?.priority || 'Normal');

  // STEP 1: Template Selection & Message Editing
  const [availableTemplates, setAvailableTemplates] = useState<WhatsAppTemplate[]>(mockTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialDraft?.selectedTemplateId ||
    mockTemplates.find((t) => t.name === 'aph_notice_url')?.id ||
    mockTemplates.find((t) => t.status === 'APPROVED')?.id ||
    mockTemplates[0]?.id ||
    '6b03bd79e103c1329b7f7604'
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Variable values mapping per template so switching templates remembers typed variables for each
  const [variableValuesByTemplate, setVariableValuesByTemplate] = useState<Record<string, Record<string, string>>>(() => {
    if (initialDraft?.variableValuesByTemplate) {
      return initialDraft.variableValuesByTemplate;
    }
    if (initialDraft?.selectedTemplateId && initialDraft?.variableValues) {
      return { [initialDraft.selectedTemplateId]: initialDraft.variableValues };
    }
    return {};
  });

  // Dynamic variable parameters map (Source of Truth for {{1}}, {{2}}, {{3}})
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    if (initialDraft?.variableValues && Object.keys(initialDraft.variableValues).length > 0) {
      return initialDraft.variableValues;
    }
    return {
      '1': '{{employee.name}}',
      '2': 'Incident reporting is live !',
      '3': 'https://inc.mapims.edu.in/login',
    };
  });

  // Fetch templates from live backend
  useEffect(() => {
    setIsLoadingTemplates(true);
    fetch('/api/templates')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const activeOnly = json.data.filter((t: any) => !t.isDeleted && !t.inTrash);
          setAvailableTemplates(activeOnly);
          const noticeUrlTmpl = activeOnly.find((t: any) => t.name === 'aph_notice_url');
          const approved = activeOnly.find((t: any) => t.status === 'APPROVED');
          setSelectedTemplateId((prev) => {
            const exists = activeOnly.some((t: any) => t.id === prev);
            return exists ? prev : noticeUrlTmpl ? noticeUrlTmpl.id : approved ? approved.id : activeOnly[0]?.id;
          });
        }
      })
      .catch((err) => {
        console.warn('Using local fallback templates:', err);
      })
      .finally(() => setIsLoadingTemplates(false));

    // Also fetch VAATI custom templates
    fetch('/api/vaati/templates', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setVaatiTemplates(json.data);
          if (urlTemplateId) {
            const found = json.data.find(
              (vt: any) => vt.id === urlTemplateId || vt.name === urlTemplateId
            );
            if (found) {
              setSelectedTemplateId(found.id);
              setSelectedGateway('VAATI');
              const resolvedType: VaatiMessageType =
                found.messageType ||
                (Array.isArray(found.pollOptions) && found.pollOptions.length >= 2 ? 'poll' : 'text');
              setVaatiMessageType(resolvedType);
              if (found.ctaUrl) setVaatiCtaUrl(found.ctaUrl);
              if (found.mediaUrl) setVaatiMediaUrl(found.mediaUrl);
              if (found.mediaFilename) setVaatiMediaFilename(found.mediaFilename);
              if (found.mediaMimetype) setVaatiMediaMimetype(found.mediaMimetype);
              if (found.pollOptions?.length >= 2) setVaatiPollOptions(found.pollOptions);
              setVaatiMultipleAnswers(Boolean(found.multipleAnswers));
              setVaatiAllowReplies(Boolean(found.allowReplies));
              setVaatiReplyPrompt(
                found.replyPrompt || '💬 Reply directly to this message to submit your response.'
              );
            }
          }
        }
      })
      .catch((err) => console.warn('Could not load VAATI templates:', err));
  }, [urlTemplateId]);

  const activeTemplate: WhatsAppTemplate = useMemo(() => {
    // 1. Check if selected template is a VAATI custom template
    const vaatiMatch = vaatiTemplates.find(
      (vt) => vt.id === selectedTemplateId || vt.name === selectedTemplateId
    );
    if (vaatiMatch) {
      return {
        id: vaatiMatch.id,
        watiTemplateId: vaatiMatch.name,
        name: vaatiMatch.name,
        category: vaatiMatch.category || 'Hospital Applications',
        language: 'en',
        headerType: vaatiMatch.header ? 'TEXT' : 'NONE',
        headerText: vaatiMatch.header,
        body: vaatiMatch.body,
        footer:
          vaatiMatch.footer ||
          'Melmaruvathur Adhiparasakthi Institute of Medical Sciences (MAPIMS)',
        buttons: [],
        variables: (vaatiMatch.variables || []).map((v: any) => ({
          key: String(v.key),
          sampleValue: v.sampleValue || '',
          description: v.description || v.key,
        })),
        status: 'APPROVED',
        createdAt: vaatiMatch.createdAt || '2026-11-25',
      } as WhatsAppTemplate;
    }

    return (
      availableTemplates.find((t) => t.id === selectedTemplateId) ||
      availableTemplates.find((t) => t.name === 'aph_notice_url') ||
      availableTemplates.find((t) => t.status === 'APPROVED') ||
      availableTemplates[0] || {
        id: '6b03bd79e103c1329b7f7604',
        watiTemplateId: 'aph_notice_url',
        name: 'aph_notice_url',
        category: 'MARKETING',
        language: 'en',
        headerType: 'NONE',
        body: 'Dear {{1}},\n{{2}}\nYou can access the application using the link below:\n{{3}}\n\nRegards,\nAdhiparasakthi Hospitals',
        footer: 'APH Connect • MAPIMS Hospitals',
        buttons: [],
        variables: [
          { key: '1', sampleValue: 'Shreya', description: 'Recipient Name' },
          { key: '2', sampleValue: 'Incident reporting is live !', description: 'Notice Content' },
          { key: '3', sampleValue: 'https://inc.mapims.edu.in/login', description: 'Portal URL' },
        ],
        status: 'APPROVED',
        createdAt: '2026-11-23',
      }
    );
  }, [availableTemplates, vaatiTemplates, selectedTemplateId]);

  // Dynamically suggest a clean campaign title based on the selected template unless user already edited it
  useEffect(() => {
    if (!hasUserEditedTitle && activeTemplate) {
      const tmplName = activeTemplate.name || activeTemplate.watiTemplateId || '';
      if (tmplName.includes('notice_url')) {
        setTitle('Incident Reporting Portal Notification');
      } else if (tmplName.includes('test_sample')) {
        setTitle('Emergency Ward Clinical Advisory');
      } else if (tmplName) {
        const cleanTmplName = tmplName
          .replace(/^aph_/, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setTitle(`${cleanTmplName} Notification`);
      }
    }
  }, [activeTemplate?.id, hasUserEditedTitle]);

  // Helper to cleanly separate notice text (Parameter 2) and portal link (Parameter 3)
  const handleNoticeChange = (raw: string) => {
    // Check if the user pasted a URL or full template text into Field 2
    const urlMatch = raw.match(/https?:\/\/[^\s,]+/);
    if (urlMatch) {
      const extractedUrl = urlMatch[0].replace(/[)\]>,;]+$/, '').replace(/Regards.*$/i, '').trim();
      const cleanNotice = raw
        .replace(/https?:\/\/[^\s,]+/g, '')
        .replace(/You can access the application using the link below:?/gi, '')
        .replace(/Regards,?\s*Adhiparasakthi Hospitals/gi, '')
        .replace(/^Dear \{\{\d+\}\},?\s*/gi, '')
        .trim();

      setVariableValues((prev) => ({
        ...prev,
        '2': cleanNotice || 'Incident reporting is live !',
        '3': extractedUrl || prev['3'] || 'https://inc.mapims.edu.in/login',
      }));
      success('Link Detected & Auto-Separated', 'Portal URL moved to Parameter 3 and Notice text cleaned.');
      return;
    }
    setVariableValues((prev) => ({ ...prev, '2': raw }));
  };

  // Helper to handle and format URL entry in Parameter 3
  const handleUrlChange = (raw: string) => {
    let clean = raw.trim();
    const urlMatch = clean.match(/https?:\/\/[^\s,]+/);
    if (urlMatch) {
      clean = urlMatch[0].replace(/[)\]>,;]+$/, '').replace(/Regards.*$/i, '').trim();
    } else if (clean.startsWith('inc.mapims') || clean.startsWith('www.')) {
      clean = `https://${clean}`;
    }
    setVariableValues((prev) => ({ ...prev, '3': clean }));
  };

  // Handle switching templates while preserving user-entered variables per template
  const handleSelectTemplate = (newTmplId: string) => {
    setVariableValuesByTemplate((prev) => ({
      ...prev,
      [selectedTemplateId]: variableValues,
    }));
    setSelectedTemplateId(newTmplId);

    // Auto-align selected gateway with template type
    const vaatiMatch = vaatiTemplates.find(
      (vt) => vt.id === newTmplId || vt.name === newTmplId
    );
    if (vaatiMatch) {
      setSelectedGateway('VAATI');
      const resolvedType: VaatiMessageType =
        vaatiMatch.messageType ||
        (Array.isArray(vaatiMatch.pollOptions) && vaatiMatch.pollOptions.length >= 2 ? 'poll' : 'text');
      setVaatiMessageType(resolvedType);
      setVaatiCtaUrl(vaatiMatch.ctaUrl || 'https://inc.mapims.edu.in/login');
      setVaatiMediaUrl(vaatiMatch.mediaUrl || '');
      setVaatiMediaFilename(vaatiMatch.mediaFilename || '');
      setVaatiMediaMimetype(vaatiMatch.mediaMimetype || '');
      if (vaatiMatch.pollOptions?.length >= 2) setVaatiPollOptions(vaatiMatch.pollOptions);
      setVaatiMultipleAnswers(Boolean(vaatiMatch.multipleAnswers));
      setVaatiAllowReplies(Boolean(vaatiMatch.allowReplies));
      setVaatiReplyPrompt(
        vaatiMatch.replyPrompt || '💬 Reply directly to this message to submit your response.'
      );
    } else {
      setVaatiMessageType('text');
      setVaatiAllowReplies(false);
    }

    const savedForNew = variableValuesByTemplate[newTmplId];
    if (savedForNew && Object.keys(savedForNew).length > 0) {
      setVariableValues(savedForNew);
    }
  };

  // When active template changes, initialize variable values and auto-separate fields
  useEffect(() => {
    if (activeTemplate && Array.isArray(activeTemplate.variables)) {
      setVariableValues((prev) => {
        // If we already have saved values for this template, preserve them completely!
        const savedForThis = variableValuesByTemplate[activeTemplate.id];
        if (savedForThis && Object.keys(savedForThis).length > 0) {
          return savedForThis;
        }

        const next: Record<string, string> = { ...prev };
        activeTemplate.variables.forEach((v) => {
          const k = String(v.key);
          if (!next[k] || next[k].startsWith('Value for')) {
            next[k] =
              k === '1'
                ? '{{employee.name}}'
                : k === '2'
                ? (v.sampleValue && !v.sampleValue.includes('Employee Feedback') ? v.sampleValue : 'Incident reporting is live !')
                : k === '3'
                ? (v.sampleValue || 'https://inc.mapims.edu.in/login')
                : (v.sampleValue || '');
          }
        });

        // Dedicated defaults for aph_notice_url
        if (activeTemplate.name === 'aph_notice_url') {
          if (!next['2'] || next['2'] === 'Welcome to Adhiparasakthi hospitals!') {
            next['2'] = 'Incident reporting is live !';
          }
          if (!next['3'] || next['3'] === 'https://example.com' || next['3'] === '21 Nov 2026' || next['3'].trim() === '') {
            next['3'] = 'https://inc.mapims.edu.in/login';
          }
        }

        // Dedicated defaults for aph_notice_url4 (Headline + Action + Portal URL)
        if (activeTemplate.name === 'aph_notice_url4') {
          if (!next['1'] || next['1'] === '{{employee.name}}' || next['1'].startsWith('Value for')) {
            next['1'] = 'now live!';
          }
          if (!next['2'] || next['2'].startsWith('Value for')) {
            next['2'] = 'click the link below to log in and complete your profile.';
          }
          if (!next['3'] || next['3'].startsWith('Value for')) {
            next['3'] = 'https://inc.mapims.edu.in/login';
          }
        }

        return next;
      });
    }
  }, [activeTemplate.id, activeTemplate.name]);

  // STEP 2: Live Test Message
  const [testNumber, setTestNumber] = useState(initialDraft?.testNumber || '+91 95513 82296');
  const [testRecipientName, setTestRecipientName] = useState(initialDraft?.testRecipientName || 'Solairam');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    gateway?: string;
    messageId?: string;
    timestamp?: string;
  } | null>(null);

  const handleSendTestMessage = async () => {
    const norm = normalizePhoneNumber(testNumber);
    if (!norm.isValid) {
      error(
        'Invalid WhatsApp Number',
        'Please enter a valid 10-digit WhatsApp phone number with or without +91 (e.g. 7200504251 or +91 72005 04251).'
      );
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    // Compute rendered text for preview and VAATI direct messaging
    let renderedText = activeTemplate.body || '';
    renderedText = renderedText.replace(/\{\{(\d+)\}\}/g, (_match, p1) => {
      const val = variableValues[p1] ?? variableValues[String(p1)];
      if (val !== undefined && val !== null && String(val).trim().length > 0) {
        if (String(val).includes('{{employee.name}}')) {
          return testRecipientName || 'Dr. A. Saravanan';
        }
        return String(val);
      }
      const variableDef = (activeTemplate.variables || []).find((v) => String(v.key) === String(p1));
      return variableDef?.sampleValue || '';
    });

    // Helper to sanitize parameter values for WhatsApp Meta Cloud API constraints
    const sanitizeParam = (raw: string): string => {
      if (!raw) return '';
      return String(raw)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    };

    const isRecipientVar = (vKey: string) =>
      String(vKey) === '1' &&
      /\b(dear|hello|hi|welcome to|dr\.|mr\.|ms\.)/i.test((activeTemplate.body || '').slice(0, 45));

    // Build parameters array for WATI strictly from active template variables
    const paramsList = (activeTemplate.variables || []).map((v) => {
      let val = variableValues[v.key] ?? v.sampleValue ?? '';
      if (isRecipientVar(String(v.key)) && (val === '{{employee.name}}' || val.includes('employee.name'))) {
        val = testRecipientName || 'Dr. A. Saravanan';
      } else if (!isRecipientVar(String(v.key)) && (val === '{{employee.name}}' || !val)) {
        val = 'now live!';
      }
      return { name: v.key, value: sanitizeParam(val) };
    });

    try {
      const res = await fetch('/api/campaigns/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          whatsappNumber: norm.e164,
          gateway: selectedGateway,
          templateId: activeTemplate.id,
          templateTitle: activeTemplate.name,
          templateName: activeTemplate.watiTemplateId || activeTemplate.name,
          broadcastTitle: `Test: ${title}`,
          parameters: paramsList,
          customMessage: renderedText,
          footer: selectedGateway === 'VAATI' ? activeTemplate.footer : undefined,
          allowReplies: selectedGateway === 'VAATI' ? vaatiAllowReplies : false,
          replyPrompt:
            selectedGateway === 'VAATI' && vaatiAllowReplies && vaatiMessageType !== 'poll'
              ? vaatiReplyPrompt.trim()
              : undefined,
          messageType: selectedGateway === 'VAATI' ? vaatiMessageType : 'text',
          ctaUrl: selectedGateway === 'VAATI' && vaatiMessageType === 'url_text' ? vaatiCtaUrl.trim() : undefined,
          mediaUrl:
            selectedGateway === 'VAATI' && (vaatiMessageType === 'image_text' || vaatiMessageType === 'pdf_text')
              ? vaatiMediaUrl.trim()
              : undefined,
          mediaFilename:
            selectedGateway === 'VAATI' && (vaatiMessageType === 'image_text' || vaatiMessageType === 'pdf_text')
              ? vaatiMediaFilename.trim()
              : undefined,
          mediaMimetype:
            selectedGateway === 'VAATI' && (vaatiMessageType === 'image_text' || vaatiMessageType === 'pdf_text')
              ? vaatiMediaMimetype.trim()
              : undefined,
          pollOptions:
            selectedGateway === 'VAATI' && vaatiMessageType === 'poll'
              ? vaatiPollOptions.map((o) => o.trim()).filter(Boolean)
              : undefined,
          multipleAnswers: selectedGateway === 'VAATI' && vaatiMessageType === 'poll' ? vaatiMultipleAnswers : false,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const resultPayload = {
          success: true,
          gateway: json.gateway || selectedGateway,
          message: json.message || `Test message delivered successfully to ${testNumber}.`,
          messageId: json.providerMessageId || `wati_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setTestResult(resultPayload);
        success('Test Message Dispatched', `${selectedGateway} WhatsApp message sent to ${testNumber}. Check your phone!`);
      } else {
        const errorMsg = json.message || `Failed to dispatch test message via ${selectedGateway} gateway.`;
        setTestResult({
          success: false,
          gateway: selectedGateway,
          message: errorMsg,
          timestamp: new Date().toLocaleTimeString(),
        });
        error('Test Message Failed', errorMsg);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        gateway: selectedGateway,
        message: err.message || `Network error while contacting ${selectedGateway} service.`,
        timestamp: new Date().toLocaleTimeString(),
      });
      error('Network Error', err.message || `Unable to connect to ${selectedGateway} gateway.`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Phone normalizer for strict anti-duplication (supports with or without +91)
  const normalizePhone = (num: string): string => {
    return toE164Phone(num);
  };

  // STEP 3: Unified Audience Targeting with Multi-Select and Strict Anti-Duplication
  const [cadreScope, setCadreScope] = useState<CadreScope>(initialDraft?.cadreScope || 'BOTH');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(initialDraft?.selectedDepartments || []);
  const [deptInput, setDeptInput] = useState<string>('');
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>(initialDraft?.selectedDesignations || []);
  const [desigInput, setDesigInput] = useState<string>('');
  const [selectedSpecificIds, setSelectedSpecificIds] = useState<string[]>(initialDraft?.selectedSpecificIds || []);
  const [specificEmployeeQuery, setSpecificEmployeeQuery] = useState<string>('');
  const [customNumbersInput, setCustomNumbersInput] = useState<string>(initialDraft?.customNumbersInput || '+919551382296');
  const [employeeDirectory, setEmployeeDirectory] = useState<Employee[]>(mockEmployees);

  // Sync live employee directory from backend API on mount
  useEffect(() => {
    fetch('/api/employees', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEmployeeDirectory(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-save form contents continuously to localStorage so navigating back or refreshing never loses work
  useEffect(() => {
    try {
      const draftToSave: SavedCampaignDraft = {
        title,
        gateway: selectedGateway,
        hasUserEditedTitle,
        priority,
        selectedTemplateId,
        variableValues,
        variableValuesByTemplate: {
          ...variableValuesByTemplate,
          [selectedTemplateId]: variableValues,
        },
        cadreScope,
        selectedDepartments,
        selectedDesignations,
        selectedSpecificIds,
        customNumbersInput,
        testNumber,
        testRecipientName,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftToSave));
      setHasSavedDraft(true);
    } catch (e) {
      console.warn('Could not save draft to localStorage:', e);
    }
  }, [
    title,
    selectedGateway,
    hasUserEditedTitle,
    priority,
    selectedTemplateId,
    variableValues,
    variableValuesByTemplate,
    cadreScope,
    selectedDepartments,
    selectedDesignations,
    selectedSpecificIds,
    customNumbersInput,
    testNumber,
    testRecipientName,
  ]);

  // Reset/clear saved draft if admin wants to start a completely blank broadcast
  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setHasSavedDraft(false);
    setTitle('');
    setHasUserEditedTitle(false);
    setPriority('Normal');
    setVariableValues({
      '1': '{{employee.name}}',
      '2': 'Incident reporting is live !',
      '3': 'https://inc.mapims.edu.in/login',
    });
    setVariableValuesByTemplate({});
    setCadreScope('BOTH');
    setSelectedDepartments([]);
    setSelectedDesignations([]);
    setCustomNumbersInput('+919551382296');
    setTestNumber('+91 95513 82296');
    setTestRecipientName('Solairam');
    setTestResult(null);
    setStep(1);
    success('Saved Content Reset', 'Form cleared for a new blank broadcast.');
  };

  // Search filter inside roster
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(mockEmployees.map((e) => e.id));

  // Cadre switch handler
  const handleCadreChange = (scope: CadreScope) => {
    setCadreScope(scope);
    setSelectedDepartments([]);
    setSelectedDesignations([]);
    setDeptInput('');
    setDesigInput('');
  };

  // Department multi-select actions
  const handleAddDepartment = (dept: string) => {
    const trimmed = dept.trim();
    if (!trimmed) return;
    const match = activeDepartmentsList.find(
      (d) => d.toLowerCase() === trimmed.toLowerCase()
    ) || trimmed;
    if (!selectedDepartments.includes(match)) {
      setSelectedDepartments((prev) => [...prev, match]);
    }
    setDeptInput('');
  };

  const handleRemoveDepartment = (dept: string) => {
    setSelectedDepartments((prev) => prev.filter((d) => d !== dept));
  };

  const handleToggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      handleRemoveDepartment(dept);
    } else {
      setSelectedDepartments((prev) => [...prev, dept]);
    }
  };

  // Designation multi-select actions
  const handleAddDesignation = (desig: string) => {
    const trimmed = desig.trim();
    if (!trimmed) return;
    const match = activeDesignationsList.find(
      (d) => d.toLowerCase() === trimmed.toLowerCase()
    ) || trimmed;
    if (!selectedDesignations.includes(match)) {
      setSelectedDesignations((prev) => [...prev, match]);
    }
    setDesigInput('');
  };

  const handleRemoveDesignation = (desig: string) => {
    setSelectedDesignations((prev) => prev.filter((d) => d !== desig));
  };

  const handleToggleDesignation = (desig: string) => {
    if (selectedDesignations.includes(desig)) {
      handleRemoveDesignation(desig);
    } else {
      setSelectedDesignations((prev) => [...prev, desig]);
    }
  };

  // Determine Teaching vs Non-Teaching for an employee
  const isTeachingStaff = (emp: Employee): boolean => {
    if (emp.staffType === 'Teaching') return true;
    if (emp.staffType === 'Non-Teaching') return false;
    const cat = (emp.category || '').toLowerCase();
    const desig = (emp.designation || '').toLowerCase();
    if (cat.includes('medical') || cat.includes('clinical') || cat.includes('doctor')) return true;
    if (desig.includes('professor') || desig.includes('consultant') || desig.includes('doctor') || desig.includes('surgeon')) return true;
    return false;
  };

  // Distinct Teaching Lists (strict to Teaching staff - 27 departments, 17 designations)
  const teachingDepartmentsList = useMemo(() => {
    const set = new Set<string>();
    employeeDirectory.forEach((e) => {
      if (isTeachingStaff(e) && e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employeeDirectory]);

  const teachingDesignationsList = useMemo(() => {
    const set = new Set<string>();
    employeeDirectory.forEach((e) => {
      if (isTeachingStaff(e) && e.designation) set.add(e.designation);
    });
    return Array.from(set).sort();
  }, [employeeDirectory]);

  // Distinct Non-Teaching Lists (strict to Non-Teaching staff - 44 departments, 132 designations)
  const nonTeachingDepartmentsList = useMemo(() => {
    const set = new Set<string>();
    employeeDirectory.forEach((e) => {
      if (!isTeachingStaff(e) && e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employeeDirectory]);

  const nonTeachingDesignationsList = useMemo(() => {
    const set = new Set<string>();
    employeeDirectory.forEach((e) => {
      if (!isTeachingStaff(e) && e.designation) set.add(e.designation);
    });
    return Array.from(set).sort();
  }, [employeeDirectory]);

  // All Departments and Designations (for BOTH cadre)
  const allDepartmentsList = useMemo(() => {
    const set = new Set<string>();
    employeeDirectory.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employeeDirectory]);

  const allDesignationsList = useMemo(() => {
    const set = new Set<string>();
    employeeDirectory.forEach((e) => {
      if (e.designation) set.add(e.designation);
    });
    return Array.from(set).sort();
  }, [employeeDirectory]);

  // Active Departments and Designations based on Cadre
  const activeDepartmentsList = useMemo(() => {
    if (cadreScope === 'TEACHING_ONLY') return teachingDepartmentsList;
    if (cadreScope === 'NON_TEACHING_ONLY') return nonTeachingDepartmentsList;
    return allDepartmentsList;
  }, [cadreScope, teachingDepartmentsList, nonTeachingDepartmentsList, allDepartmentsList]);

  const activeDesignationsList = useMemo(() => {
    if (cadreScope === 'TEACHING_ONLY') return teachingDesignationsList;
    if (cadreScope === 'NON_TEACHING_ONLY') return nonTeachingDesignationsList;
    return allDesignationsList;
  }, [cadreScope, teachingDesignationsList, nonTeachingDesignationsList, allDesignationsList]);

  // Quick Badge Suggestions based on Cadre
  const quickDeptBadges = useMemo(() => {
    if (cadreScope === 'TEACHING_ONLY') {
      return ['Anaesthesiology', 'General Medicine', 'Emergency & Trauma Care', 'General Surgery', 'Paediatrics', 'Cardiology', 'Obstetrics and Gynaecology'];
    }
    if (cadreScope === 'NON_TEACHING_ONLY') {
      return ['Nursing', 'Central Laboratory', 'Pharmacy', 'Bio Medical', 'Billing', 'Human Resources', 'Maintenance', 'House Keeping'];
    }
    return ['Anaesthesiology', 'General Medicine', 'Nursing', 'Pharmacy', 'Bio Medical', 'General Surgery', 'Central Laboratory', 'Billing'];
  }, [cadreScope]);

  const quickDesigBadges = useMemo(() => {
    if (cadreScope === 'TEACHING_ONLY') {
      return ['Professor', 'Associate Professor', 'Assistant Professor', 'Senior Resident', 'Professor & HOD', 'Casualty Medical Officer', 'Consultant'];
    }
    if (cadreScope === 'NON_TEACHING_ONLY') {
      return ['Staff Nurse', 'Lab Technician', 'Female Nursing Assistant', 'Trainee Staff Nurse', 'Ward Boy', 'Executive', 'Technician'];
    }
    return ['Professor', 'Associate Professor', 'Assistant Professor', 'Staff Nurse', 'Lab Technician', 'Female Nursing Assistant', 'Professor & HOD'];
  }, [cadreScope]);

  // Categorized Selected Departments for Right Panel
  const categorizedSelectedDepartments = useMemo(() => {
    const teaching: string[] = [];
    const nonTeaching: string[] = [];
    const general: string[] = [];

    selectedDepartments.forEach((dept) => {
      const isTeaching = teachingDepartmentsList.includes(dept);
      const isNonTeaching = nonTeachingDepartmentsList.includes(dept);
      if (isTeaching && !isNonTeaching) {
        teaching.push(dept);
      } else if (isNonTeaching && !isTeaching) {
        nonTeaching.push(dept);
      } else {
        general.push(dept);
      }
    });

    return { teaching, nonTeaching, general };
  }, [selectedDepartments, teachingDepartmentsList, nonTeachingDepartmentsList]);

  // Categorized Selected Designations for Right Panel
  const categorizedSelectedDesignations = useMemo(() => {
    const teaching: string[] = [];
    const nonTeaching: string[] = [];
    const general: string[] = [];

    selectedDesignations.forEach((desig) => {
      const isTeaching = teachingDesignationsList.includes(desig);
      const isNonTeaching = nonTeachingDesignationsList.includes(desig);
      if (isTeaching && !isNonTeaching) {
        teaching.push(desig);
      } else if (isNonTeaching && !isTeaching) {
        nonTeaching.push(desig);
      } else {
        general.push(desig);
      }
    });

    return { teaching, nonTeaching, general };
  }, [selectedDesignations, teachingDesignationsList, nonTeachingDesignationsList]);

  // Candidate pool & STRICT DE-DUPLICATION ENGINE
  const {
    uniqueMatchingEmployees,
    duplicateEmployeesSuppressed,
    teachingCount,
    nonTeachingCount,
  } = useMemo(() => {
    if (cadreScope === 'SPECIFIC_STAFF') {
      const idSet = new Set(selectedSpecificIds);
      const seenPhoneNumbers = new Set<string>();
      const list: Employee[] = [];
      let dupCount = 0;

      employeeDirectory.forEach((emp) => {
        if (!idSet.has(emp.id)) return;
        const normPhone = normalizePhone(emp.whatsappNumber);
        if (seenPhoneNumbers.has(normPhone)) {
          dupCount++;
          return;
        }
        seenPhoneNumbers.add(normPhone);
        list.push(emp);
      });

      return {
        uniqueMatchingEmployees: list,
        duplicateEmployeesSuppressed: dupCount,
        teachingCount: list.filter(isTeachingStaff).length,
        nonTeachingCount: list.filter((e) => !isTeachingStaff(e)).length,
      };
    }

    if (cadreScope === 'DIRECT_NUMBERS') {
      const tokens = customNumbersInput
        .split(/[\s,;\n]+/)
        .map((t) => t.replace(/[^0-9+]/g, '').trim())
        .filter(Boolean);

      const seenPhoneNumbers = new Set<string>();
      const list: Employee[] = [];
      let dupCount = 0;

      employeeDirectory.forEach((emp) => {
        const normPhone = normalizePhone(emp.whatsappNumber);
        const empPhone = emp.whatsappNumber.replace(/[^0-9]/g, '');
        const empId = emp.employeeId.toLowerCase();
        const empName = emp.name.toLowerCase();

        const matches = tokens.some((tok) => {
          const cleanTok = tok.replace(/[^0-9]/g, '');
          if (cleanTok.length >= 7 && empPhone.includes(cleanTok)) return true;
          if (tok.length >= 3 && (empId.includes(tok.toLowerCase()) || empName.includes(tok.toLowerCase()))) return true;
          return false;
        });

        if (matches) {
          if (seenPhoneNumbers.has(normPhone)) {
            dupCount++;
          } else {
            seenPhoneNumbers.add(normPhone);
            list.push(emp);
          }
        }
      });

      return {
        uniqueMatchingEmployees: list,
        duplicateEmployeesSuppressed: dupCount,
        teachingCount: list.filter(isTeachingStaff).length,
        nonTeachingCount: list.filter((e) => !isTeachingStaff(e)).length,
      };
    }

    // Filter by Cadre, Multi-Department, and Multi-Designation
    const filteredPool = employeeDirectory.filter((emp) => {
      // Cadre filter
      const isTeaching = isTeachingStaff(emp);
      if (cadreScope === 'TEACHING_ONLY' && !isTeaching) return false;
      if (cadreScope === 'NON_TEACHING_ONLY' && isTeaching) return false;

      // Department filter (matches if any selected department matches)
      if (selectedDepartments.length > 0) {
        const empDept = (emp.department || '').toLowerCase();
        const matchesDept = selectedDepartments.some(
          (sel) =>
            empDept === sel.toLowerCase() ||
            empDept.includes(sel.toLowerCase()) ||
            sel.toLowerCase().includes(empDept)
        );
        if (!matchesDept) return false;
      }

      // Designation filter (matches if any selected designation matches)
      if (selectedDesignations.length > 0) {
        const empDesig = (emp.designation || '').toLowerCase();
        const matchesDesig = selectedDesignations.some(
          (sel) =>
            empDesig === sel.toLowerCase() ||
            empDesig.includes(sel.toLowerCase()) ||
            sel.toLowerCase().includes(empDesig)
        );
        if (!matchesDesig) return false;
      }

      return true;
    });

    // STRICT DE-DUPLICATION ENGINE:
    // Guarantee that no phone number appears more than once!
    const seenPhoneNumbers = new Set<string>();
    const seenEmployeeIds = new Set<string>();
    const uniqueList: Employee[] = [];
    let dupCount = 0;

    for (const emp of filteredPool) {
      const normPhone = normalizePhone(emp.whatsappNumber);
      const empId = emp.id || emp.employeeId;

      if (seenPhoneNumbers.has(normPhone) || seenEmployeeIds.has(empId)) {
        dupCount++;
        continue; // STRICTLY EXCLUDE DUPLICATE RECORD!
      }

      seenPhoneNumbers.add(normPhone);
      seenEmployeeIds.add(empId);
      uniqueList.push(emp);
    }

    return {
      uniqueMatchingEmployees: uniqueList,
      duplicateEmployeesSuppressed: dupCount,
      teachingCount: uniqueList.filter(isTeachingStaff).length,
      nonTeachingCount: uniqueList.filter((e) => !isTeachingStaff(e)).length,
    };
  }, [
    cadreScope,
    employeeDirectory,
    selectedDepartments,
    selectedDesignations,
    selectedSpecificIds,
    customNumbersInput,
  ]);

  // Search results for "Particular Employee(s)" picker (by Employee ID, Name, Department, Designation, or Phone)
  const specificSearchResults = useMemo(() => {
    const q = specificEmployeeQuery.trim().toLowerCase();
    if (!q) {
      return employeeDirectory.slice(0, 25);
    }
    return employeeDirectory
      .filter(
        (emp) =>
          (emp.employeeId || '').toLowerCase().includes(q) ||
          (emp.name || '').toLowerCase().includes(q) ||
          (emp.whatsappNumber || '').toLowerCase().includes(q) ||
          (emp.department || '').toLowerCase().includes(q) ||
          (emp.designation || '').toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [employeeDirectory, specificEmployeeQuery]);

  const handleToggleSpecificEmployee = (empId: string) => {
    setSelectedSpecificIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Apply search query over uniqueMatchingEmployees
  const matchingEmployees = useMemo(() => {
    if (!staffSearch.trim()) return uniqueMatchingEmployees;
    const q = staffSearch.toLowerCase();
    return uniqueMatchingEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.whatsappNumber.includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
    );
  }, [uniqueMatchingEmployees, staffSearch]);

  // Synchronize selection ONLY when filtered candidate pool changes (never wipe on staffSearch typing)
  useEffect(() => {
    setSelectedStaffIds(uniqueMatchingEmployees.map((e) => e.id));
  }, [uniqueMatchingEmployees]);

  const selectedCount = uniqueMatchingEmployees.filter((e) => selectedStaffIds.includes(e.id)).length;
  const optedOutCount = uniqueMatchingEmployees.filter(
    (e) => selectedStaffIds.includes(e.id) && e.consentStatus === 'Opted-Out'
  ).length;
  const eligibleCount = Math.max(0, selectedCount - optedOutCount);

  // STEP 4: Final Dispatch & Schedule Options
  const [dispatchTiming, setDispatchTiming] = useState<'NOW' | 'SCHEDULE'>('NOW');
  const [scheduleDateTime, setScheduleDateTime] = useState('2026-11-21T09:00');
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);

  const handleSelectAllMatching = () => {
    const ids = matchingEmployees.map((e) => e.id);
    setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAllMatching = () => {
    if (cadreScope === 'SPECIFIC_STAFF') {
      const matchingIdSet = new Set(matchingEmployees.map((e) => e.id));
      setSelectedSpecificIds((prev) => prev.filter((id) => !matchingIdSet.has(id)));
      return;
    }
    const matchingIdSet = new Set(matchingEmployees.map((e) => e.id));
    setSelectedStaffIds((prev) => prev.filter((id) => !matchingIdSet.has(id)));
  };

  const handleToggleStaffSelect = (id: string) => {
    if (cadreScope === 'SPECIFIC_STAFF') {
      handleToggleSpecificEmployee(id);
      return;
    }
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Final Broadcast Submission
  const handleFinalBroadcast = async () => {
    // Extract unique normalized phone numbers across all selected eligible staff
    const uniqueRecipients = Array.from(
      new Set(
        uniqueMatchingEmployees
          .filter((e) => selectedStaffIds.includes(e.id) && e.consentStatus !== 'Opted-Out')
          .map((e) => normalizePhone(e.whatsappNumber))
      )
    );

    if (!title.trim()) {
      error('Campaign Title Required', 'Please enter a campaign title before launching the broadcast.');
      return;
    }

    if (uniqueRecipients.length === 0) {
      error('No Eligible Recipients', 'Please select at least one eligible staff member with opted-in WhatsApp.');
      return;
    }

    setIsSubmittingCampaign(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          gateway: selectedGateway,
          templateId: activeTemplate.id,
          templateName: activeTemplate.watiTemplateId || activeTemplate.name,
          templateBody: activeTemplate.body,
          customMessage: activeTemplate.body,
          footer: selectedGateway === 'VAATI' ? activeTemplate.footer : undefined,
          allowReplies: selectedGateway === 'VAATI' ? vaatiAllowReplies : false,
          replyPrompt:
            selectedGateway === 'VAATI' && vaatiAllowReplies && vaatiMessageType !== 'poll'
              ? vaatiReplyPrompt.trim()
              : undefined,
          messageType: selectedGateway === 'VAATI' ? vaatiMessageType : 'text',
          ctaUrl: selectedGateway === 'VAATI' && vaatiMessageType === 'url_text' ? vaatiCtaUrl.trim() : undefined,
          mediaUrl:
            selectedGateway === 'VAATI' && (vaatiMessageType === 'image_text' || vaatiMessageType === 'pdf_text')
              ? vaatiMediaUrl.trim()
              : undefined,
          mediaFilename:
            selectedGateway === 'VAATI' && (vaatiMessageType === 'image_text' || vaatiMessageType === 'pdf_text')
              ? vaatiMediaFilename.trim()
              : undefined,
          mediaMimetype:
            selectedGateway === 'VAATI' && (vaatiMessageType === 'image_text' || vaatiMessageType === 'pdf_text')
              ? vaatiMediaMimetype.trim()
              : undefined,
          pollOptions:
            selectedGateway === 'VAATI' && vaatiMessageType === 'poll'
              ? vaatiPollOptions.map((o) => o.trim()).filter(Boolean)
              : undefined,
          multipleAnswers: selectedGateway === 'VAATI' && vaatiMessageType === 'poll' ? vaatiMultipleAnswers : false,
          parameters: (activeTemplate.variables || []).map((v) => {
            const raw = variableValues[v.key] ?? v.sampleValue ?? '';
            const cleaned = String(raw).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
            return { name: v.key, value: cleaned };
          }),
          categoryScope:
            cadreScope === 'BOTH'
              ? 'All Staff (Teaching & Non-Teaching)'
              : cadreScope === 'TEACHING_ONLY'
              ? 'Teaching Faculty Only'
              : cadreScope === 'NON_TEACHING_ONLY'
              ? 'Non-Teaching Staff Only'
              : cadreScope === 'SPECIFIC_STAFF'
              ? 'Selected Individual Staff'
              : 'Direct Mobile Numbers',
          departmentScope:
            selectedDepartments.length > 0
              ? selectedDepartments.join(', ')
              : 'All Departments',
          designationScope:
            selectedDesignations.length > 0
              ? selectedDesignations.join(', ')
              : 'All Designations',
          priority,
          selectedCount: uniqueRecipients.length,
          recipientNumbers: uniqueRecipients,
          timing: dispatchTiming,
          scheduledFor: dispatchTiming === 'SCHEDULE' ? scheduleDateTime : undefined,
          isDraft: false,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        try {
          sessionStorage.removeItem('hospital_campaigns');
        } catch {}
        success(
          'Broadcast Launched Successfully',
          `Dispatched "${title.trim()}" to ${eligibleCount} hospital recipients via ${selectedGateway}.`
        );
        navigate('/campaigns/history');
      } else {
        error('Launch Failed', json.message || 'Could not queue broadcast.');
      }
    } catch (err: any) {
      error('Dispatch Error', err.message || 'Network error.');
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Create Hospital WhatsApp Broadcast"
        description="Select an approved template, edit the message parameters, verify with a test message, target staff by department & cadre, and broadcast."
      >
        <div className="flex items-center gap-2">
          {hasSavedDraft && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-semibold text-slate-600 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              title="Clear saved message content and start with blank form"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset / Blank Form</span>
            </button>
          )}
          <button
            onClick={() => navigate('/campaigns/history')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </PageHeader>

      {/* Saved Draft Notice Strip */}
      {hasSavedDraft && (
        <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1E3A8A] shrink-0" />
            <span>
              <strong>Saved Message Content Active:</strong> Your template text, portal URL, and parameters are preserved. If you sent to a user and returned, you can send to another user or group without re-typing.
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:underline shrink-0 self-start sm:self-auto flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Saved Draft</span>
          </button>
        </div>
      )}

      {/* 4-Step Interactive Breadcrumb Stepper */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Step 1 */}
          <button
            onClick={() => setStep(1)}
            className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 ${
              step === 1
                ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                : step > 1
                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 font-semibold'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                step === 1
                  ? 'bg-white text-[#1E3A8A]'
                  : step > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <div className="min-w-0">
              <div className="text-xs truncate">1. Template & Message</div>
              <div className="text-[10px] opacity-75 truncate">Select & edit text</div>
            </div>
          </button>

          {/* Step 2 */}
          <button
            onClick={() => setStep(2)}
            className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 ${
              step === 2
                ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                : step > 2
                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 font-semibold'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                step === 2
                  ? 'bg-white text-[#1E3A8A]'
                  : step > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
            </div>
            <div className="min-w-0">
              <div className="text-xs truncate">2. Test Message</div>
              <div className="text-[10px] opacity-75 truncate">Send live test</div>
            </div>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => setStep(3)}
            className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 ${
              step === 3
                ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                : step > 3
                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 font-semibold'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                step === 3
                  ? 'bg-white text-[#1E3A8A]'
                  : step > 3
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > 3 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
            </div>
            <div className="min-w-0">
              <div className="text-xs truncate">3. Target Receivers</div>
              <div className="text-[10px] opacity-75 truncate">Teaching / Non-Teaching & Dept</div>
            </div>
          </button>

          {/* Step 4 */}
          <button
            onClick={() => setStep(4)}
            className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 ${
              step === 4
                ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                step === 4 ? 'bg-white text-[#1E3A8A]' : 'bg-slate-200 text-slate-500'
              }`}
            >
              4
            </div>
            <div className="min-w-0">
              <div className="text-xs truncate">4. Dispatch</div>
              <div className="text-[10px] opacity-75 truncate">Send broadcast</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6">
        {/* Left Column (Forms & Stepper Content) */}
        <div className={cn('space-y-6', step === 3 ? 'lg:col-span-8' : 'lg:col-span-7')}>
          {/* ============================================================ */}
          {/* STEP 1: SELECT APPROVED TEMPLATE & EDIT REQUIRED MESSAGE      */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Step 1: Select Approved Template & Edit Message
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Pick a Meta-approved WATI template from your library and fill the dynamic parameters.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-[#1E3A8A] rounded-md border border-blue-200">
                  Step 1 of 4
                </span>
              </div>

              {/* ============================================================ */}
              {/* GATEWAY SELECTOR (WATI Cloud API vs Self-Hosted VAATI)       */}
              {/* ============================================================ */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                        WhatsApp Dispatch Gateway
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Dual Gateway Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch between VAATI Gateway and WATI Cloud API.
                    </p>
                  </div>

                  {/* VAATI Master Power Switch (Super Admin Only) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">VAATI Engine:</span>
                    {currentUser.role === 'Super Admin' ? (
                      <button
                        type="button"
                        disabled={isTogglingGateway}
                        onClick={() => handleToggleVaati(!gatewayStatus?.isVaatiEnabled)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                          gatewayStatus?.isVaatiEnabled
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            gatewayStatus?.isVaatiEnabled ? 'bg-white animate-pulse' : 'bg-rose-600'
                          }`}
                        />
                        <span>{gatewayStatus?.isVaatiEnabled ? 'VAATI ON' : 'VAATI OFF'}</span>
                      </button>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                          gatewayStatus?.isVaatiEnabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            gatewayStatus?.isVaatiEnabled ? 'bg-emerald-500' : 'bg-rose-600'
                          }`}
                        />
                        <span>{gatewayStatus?.isVaatiEnabled ? 'VAATI ON' : 'VAATI OFF'}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: VAATI */}
                  <div
                    onClick={() => {
                      if (!gatewayStatus?.isVaatiEnabled) {
                        warning('VAATI is Turned OFF', 'Please turn ON the VAATI engine switch first.');
                        return;
                      }
                      setSelectedGateway('VAATI');
                    }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                      selectedGateway === 'VAATI'
                        ? 'bg-amber-50/70 border-amber-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    } ${!gatewayStatus?.isVaatiEnabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#C76323] text-white flex items-center justify-center font-black text-xs shadow-xs">
                          ⚡
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>VAATI Gateway</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold">
                              Self-Hosted
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Custom templates & direct WhatsApp dispatch
                          </div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="gateway_choice"
                        checked={selectedGateway === 'VAATI'}
                        disabled={!gatewayStatus?.isVaatiEnabled}
                        onChange={() => setSelectedGateway('VAATI')}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 mt-1"
                      />
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            gatewayStatus?.vaati?.online && gatewayStatus?.isVaatiEnabled
                              ? 'bg-emerald-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-700">
                          {gatewayStatus?.isVaatiEnabled
                            ? gatewayStatus?.vaati?.online
                              ? `Online: ${gatewayStatus?.vaati?.phone || 'Linked'} (${
                                  gatewayStatus?.vaati?.pushName || 'Karthi'
                                })`
                              : 'Connecting...'
                            : 'Turned OFF by Admin'}
                        </span>
                      </div>
                      <span className="font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded">
                        Custom Gateway
                      </span>
                    </div>
                  </div>

                  {/* Option 2: WATI */}
                  <div
                    onClick={() => setSelectedGateway('WATI')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                      selectedGateway === 'WATI'
                        ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center font-black text-xs shadow-xs">
                          ☁️
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>WATI Cloud API</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded font-bold">
                              Meta Official
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Official WhatsApp Business API • Meta Approved Templates
                          </div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="gateway_choice"
                        checked={selectedGateway === 'WATI'}
                        onChange={() => setSelectedGateway('WATI')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-1"
                      />
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-700">
                          Active: Endpoint 10190409
                        </span>
                      </div>
                      <span className="font-bold text-blue-800 bg-blue-100/60 px-2 py-0.5 rounded">
                        Meta Cloud
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Title & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Broadcast Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setHasUserEditedTitle(true);
                    }}
                    placeholder="Enter Campaign Title (e.g. Incident Reporting Portal Notification)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">🚨 Code Blue / Emergency</option>
                  </select>
                </div>
              </div>

              {/* Template Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>Select Approved Template from Library *</span>
                    {activeTemplate?.status === 'APPROVED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                        Meta Approved
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {availableTemplates.length} templates available
                  </span>
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] shadow-2xs"
                >
                  {vaatiTemplates.length > 0 && (
                    <optgroup label="⚡ VAATI Custom Templates">
                      {vaatiTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          ⚡ {t.name} ({t.category || 'Hospital Applications'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="☁️ WATI Cloud Templates (Meta Approved)">
                    {availableTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.status === 'APPROVED' ? '✓ ' : ''}{t.name} ({t.status} • {t.category})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Approved Template Structure & Live Highlighting Preview */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Approved Meta Message Structure
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Live Template Preview
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeTemplate.name}
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 leading-relaxed font-sans shadow-2xs whitespace-pre-wrap">
                  {(() => {
                    const isRecipientVar = (k: string) =>
                      String(k) === '1' &&
                      /\b(dear|hello|hi|welcome to|dr\.|mr\.|ms\.)/i.test((activeTemplate.body || '').slice(0, 45));

                    const parts = (activeTemplate.body || '').split(/(\{\{\d+\}\})/g);
                    return parts.map((part, idx) => {
                      const match = part.match(/\{\{(\d+)\}\}/);
                      if (match) {
                        const varKey = match[1];
                        const val = variableValues[varKey];
                        const displayVal = isRecipientVar(varKey)
                          ? (testRecipientName || 'Recipient Name')
                          : val || (varKey === '1' ? 'now live!' : '');
                        const isLink = varKey === '3' || (displayVal && displayVal.startsWith('http'));
                        return (
                          <span
                            key={idx}
                            className={cn(
                              "inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] mx-0.5 border shadow-2xs transition-all",
                              isRecipientVar(varKey)
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : varKey === '1'
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : varKey === '2'
                                ? "bg-blue-50 text-blue-900 border-blue-300"
                                : "bg-purple-50 text-purple-900 border-purple-300 font-mono underline"
                            )}
                            title={`Variable {{${varKey}}}`}
                          >
                            {isLink && <ExternalLink className="w-3 h-3 text-purple-600 shrink-0" />}
                            <span>{displayVal || `[Enter value in Field {{${varKey}}} below]`}</span>
                          </span>
                        );
                      }
                      return <span key={idx}>{part}</span>;
                    });
                  })()}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Edit message parameters in the designated separate fields below.</span>
                  <span className="font-mono text-emerald-700 font-semibold">Meta Verified</span>
                </div>
              </div>

              {/* Variable Parameters Editor */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs">
                    Edit Template Parameters (Required Message Content)
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Each variable is configured on its own dedicated separate line
                  </span>
                </div>

                <div className="space-y-3">
                  {activeTemplate.variables && activeTemplate.variables.length > 0 ? (
                    activeTemplate.variables.map((v) => {
                      const isRecipientVar =
                        String(v.key) === '1' &&
                        /\b(dear|hello|hi|welcome to|dr\.|mr\.|ms\.)/i.test((activeTemplate.body || '').slice(0, 45));

                      return (
                      <div
                        key={v.key}
                        className={cn(
                          "p-3.5 bg-white rounded-xl border shadow-2xs transition-all",
                          v.key === '2'
                            ? "border-blue-200 hover:border-blue-400 ring-1 ring-blue-50"
                            : v.key === '3'
                            ? "border-purple-200 hover:border-purple-400 ring-1 ring-purple-50"
                            : "border-slate-200 hover:border-[#1E3A8A]/40"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-xs text-[#1E3A8A] flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded text-[11px]">
                              {`{{${v.key}}}`}
                            </span>
                            <span>
                              {isRecipientVar
                                ? 'Recipient Name'
                                : activeTemplate.name === 'aph_notice_url4' && v.key === '1'
                                ? 'Application Status / Headline (Line 1)'
                                : activeTemplate.name === 'aph_notice_url4' && v.key === '2'
                                ? 'Action Instruction (Line 2)'
                                : v.key === '2'
                                ? 'Notice / Message Content (Line 2)'
                                : v.key === '3'
                                ? 'Application / Portal Link (Line 3)'
                                : v.description || `Parameter ${v.key}`}
                            </span>
                          </span>

                          {isRecipientVar && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                              Auto-Replaced with Recipient Name
                            </span>
                          )}
                          {!isRecipientVar && activeTemplate.name === 'aph_notice_url4' && v.key === '1' && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                              Headline (e.g. now live!)
                            </span>
                          )}
                          {v.key === '2' && (
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200">
                              Custom Message Content (Separate Line)
                            </span>
                          )}
                          {v.key === '3' && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold border border-purple-200">
                              Direct Portal URL (Separate Line)
                            </span>
                          )}
                        </div>

                        {v.key === '2' ? (
                          <div>
                            <textarea
                              rows={3}
                              value={variableValues[v.key] || ''}
                              onChange={(e) => handleNoticeChange(e.target.value)}
                              placeholder="Enter notice or circular message here (e.g. Incident reporting is live !)"
                              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
                            />
                            {variableValues['2'] && /[\r\n\t]|\s{4,}/.test(variableValues['2']) && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-blue-900">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                                  <span>Line breaks detected. They will automatically be converted to clean single-line text for WhatsApp Meta delivery.</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVariableValues((prev) => ({
                                      ...prev,
                                      '2': (prev['2'] || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim(),
                                    }));
                                  }}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-2xs text-[10px] shrink-0 self-start sm:self-auto"
                                >
                                  Clean Line Breaks Now
                                </button>
                              </div>
                            )}
                            {variableValues['2'] && (variableValues['2'].includes('http') || variableValues['2'].includes('You can access')) && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-[11px] text-amber-900">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>Portal link detected inside notice text.</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleNoticeChange(variableValues['2'])}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-2xs text-[10px] flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" /> Auto-Separate Link
                                </button>
                              </div>
                            )}
                            <p className="text-[11px] text-slate-400 mt-1">
                              This text is sent cleanly as Parameter 2 without any links or footers mixed in.
                            </p>
                          </div>
                        ) : v.key === '3' ? (
                          <div>
                            <div className="relative">
                              <ExternalLink className="w-4 h-4 text-purple-600 absolute left-3 top-2.5 pointer-events-none" />
                              <input
                                type="text"
                                value={variableValues[v.key] || ''}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                placeholder="https://inc.mapims.edu.in/login"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-[11px] text-slate-400">
                                Staff can tap this link in WhatsApp to open the application directly.
                              </p>
                              <button
                                type="button"
                                onClick={() => setVariableValues((prev) => ({ ...prev, '3': 'https://inc.mapims.edu.in/login' }))}
                                className="shrink-0 text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" /> Insert Portal URL
                              </button>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={variableValues[v.key] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setVariableValues((prev) => ({ ...prev, [v.key]: val }));
                            }}
                            placeholder={`Enter value for {{${v.key}}}`}
                            className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all"
                          />
                        )}
                      </div>
                    );
                  })
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-xs">
                      This template has no dynamic variable placeholders.
                    </div>
                  )}
                </div>
              </div>

              {selectedGateway === 'VAATI' && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs">
                  <VaatiFormatEditor
                    compact
                    messageType={vaatiMessageType}
                    onChangeType={(next) => {
                      setVaatiMessageType(next);
                      if (next === 'pdf_text' && !vaatiMediaUrl) {
                        setVaatiMediaFilename('MAPIMS_Circular.pdf');
                        setVaatiMediaMimetype('application/pdf');
                      } else if (next === 'image_text' && !vaatiMediaUrl) {
                        setVaatiMediaFilename('MAPIMS_Poster.jpg');
                        setVaatiMediaMimetype('image/jpeg');
                      }
                    }}
                    ctaUrl={vaatiCtaUrl}
                    onChangeCtaUrl={setVaatiCtaUrl}
                    mediaUrl={vaatiMediaUrl}
                    mediaFilename={vaatiMediaFilename}
                    mediaMimetype={vaatiMediaMimetype}
                    onChangeMedia={({ url, filename, mimetype }) => {
                      setVaatiMediaUrl(url);
                      if (filename !== undefined) setVaatiMediaFilename(filename);
                      if (mimetype !== undefined) setVaatiMediaMimetype(mimetype);
                    }}
                    pollOptions={vaatiPollOptions}
                    onChangePollOptions={setVaatiPollOptions}
                    multipleAnswers={vaatiMultipleAnswers}
                    onChangeMultipleAnswers={setVaatiMultipleAnswers}
                  />

                  {/* Allow User Replies ON / OFF Toggle for Broadcast */}
                  <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span>Collect User Replies to Question (Save to DB)</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            vaatiAllowReplies
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {vaatiAllowReplies ? 'ON' : 'OFF'}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-600 block">
                        {vaatiAllowReplies
                          ? 'Recipients can reply on WhatsApp; answers save automatically to Template Replies Inbox.'
                          : 'One-way broadcast; user replies are not recorded.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={vaatiAllowReplies}
                      onClick={() => setVaatiAllowReplies((v) => !v)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        vaatiAllowReplies ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                          vaatiAllowReplies ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Action: Save & Continue */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => success('Draft Saved', 'Template parameters saved locally.')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim()) {
                      error('Campaign Title Required', 'Please provide a descriptive title for this broadcast before proceeding.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <span>Save & Continue to Test Message</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: SEND TEST MESSAGE (PRE-FLIGHT VERIFICATION)           */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Step 2: Pre-Flight WhatsApp Verification (Test Message)
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Send a real test message to your WhatsApp terminal to inspect rendering, formatting, and buttons before mass dispatch.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-[#1E3A8A] rounded-md border border-blue-200">
                  Step 2 of 4
                </span>
              </div>

              {/* Test Message Box */}
              <div className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#059669]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      Live {selectedGateway} Test Dispatch
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedGateway === 'VAATI'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}
                    >
                      {selectedGateway === 'VAATI' ? '⚡ VAATI Direct' : '☁️ WATI Cloud'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold">Route Via:</span>
                    <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white shadow-2xs">
                      <button
                        type="button"
                        disabled={!gatewayStatus?.isVaatiEnabled}
                        onClick={() => setSelectedGateway('VAATI')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          selectedGateway === 'VAATI'
                            ? 'bg-[#C76323] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        } ${!gatewayStatus?.isVaatiEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        ⚡ VAATI
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGateway('WATI')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          selectedGateway === 'WATI'
                            ? 'bg-[#1E3A8A] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ☁️ WATI
                      </button>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                      Test Mode Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Test WhatsApp Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={testNumber}
                        onChange={(e) => setTestNumber(e.target.value)}
                        placeholder="e.g. 7200504251 or +91 72005 04251"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                      Supports mobile numbers with or without +91 (e.g. 7200504251 or +91 72005 04251)
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Sample Recipient Name for Test
                    </label>
                    <input
                      type="text"
                      value={testRecipientName}
                      onChange={(e) => setTestRecipientName(e.target.value)}
                      placeholder="e.g. Dr. A. Saravanan"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Replaces {'{{employee.name}}'} in test
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isSendingTest}
                    onClick={handleSendTestMessage}
                    className={`w-full sm:w-auto px-5 py-2.5 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-70 ${
                      selectedGateway === 'VAATI'
                        ? 'bg-[#C76323] hover:bg-[#B0541C]'
                        : 'bg-[#1E3A8A] hover:bg-[#1a2c4e]'
                    }`}
                  >
                    {isSendingTest ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Dispatching Test via {selectedGateway} Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Test WhatsApp Message via {selectedGateway}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Feedback Callout */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-3 animate-in fade-in duration-150 ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs">{testResult.message}</div>
                      {testResult.messageId && (
                        <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                          Provider Message ID: {testResult.messageId} • {testResult.timestamp}
                        </div>
                      )}
                      {testResult.success && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTestResult(null);
                              setTestNumber('');
                              setTestRecipientName('');
                            }}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-2xs flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send to Another Recipient</span>
                          </button>
                          <span className="text-[10px] text-emerald-800 font-medium">
                            Saved message content & link remain preserved
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Template
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <span>Continue to Select Receivers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SELECT RECEIVERS (TEACHING / NON-TEACHING, DEPT, DESIG)*/}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Step 3: Select Target Receivers
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Target particular employee(s) by ID/Name, or filter by Cadre, Department, and Designation.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-[#1E3A8A] rounded-md border border-blue-200 self-start sm:self-auto">
                  Step 3 of 4
                </span>
              </div>

              {/* Target Cadre Radio Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>Select Target Mode:</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {uniqueMatchingEmployees.length} unique recipients eligible
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  <label
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all',
                      cadreScope === 'BOTH'
                        ? 'bg-blue-50/80 border-[#1E3A8A] ring-1 ring-[#1E3A8A] text-[#1E3A8A] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="cadreScope"
                      checked={cadreScope === 'BOTH'}
                      onChange={() => handleCadreChange('BOTH')}
                      className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold">All Staff (Both)</div>
                      <div className="text-[10px] text-slate-400 font-normal">1,046 Total Staff</div>
                    </div>
                  </label>

                  <label
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all',
                      cadreScope === 'TEACHING_ONLY'
                        ? 'bg-blue-50/80 border-[#1E3A8A] ring-1 ring-[#1E3A8A] text-[#1E3A8A] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="cadreScope"
                      checked={cadreScope === 'TEACHING_ONLY'}
                      onChange={() => handleCadreChange('TEACHING_ONLY')}
                      className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold">👨‍⚕️ Teaching Faculty</div>
                      <div className="text-[10px] text-slate-400 font-normal">157 Doctors & Profs</div>
                    </div>
                  </label>

                  <label
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all',
                      cadreScope === 'NON_TEACHING_ONLY'
                        ? 'bg-blue-50/80 border-[#1E3A8A] ring-1 ring-[#1E3A8A] text-[#1E3A8A] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="cadreScope"
                      checked={cadreScope === 'NON_TEACHING_ONLY'}
                      onChange={() => handleCadreChange('NON_TEACHING_ONLY')}
                      className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold">🏥 Non-Teaching Staff</div>
                      <div className="text-[10px] text-slate-400 font-normal">890 Nursing & Admin</div>
                    </div>
                  </label>

                  <label
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all',
                      cadreScope === 'SPECIFIC_STAFF'
                        ? 'bg-emerald-50/90 border-emerald-600 ring-1 ring-emerald-600 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="cadreScope"
                      checked={cadreScope === 'SPECIFIC_STAFF'}
                      onChange={() => handleCadreChange('SPECIFIC_STAFF')}
                      className="text-emerald-600 focus:ring-emerald-600"
                    />
                    <div className="text-xs">
                      <div className="font-semibold">🎯 Particular Staff</div>
                      <div className="text-[10px] text-slate-400 font-normal">Search ID / Name</div>
                    </div>
                  </label>

                  <label
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all',
                      cadreScope === 'DIRECT_NUMBERS'
                        ? 'bg-blue-50/80 border-[#1E3A8A] ring-1 ring-[#1E3A8A] text-[#1E3A8A] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="cadreScope"
                      checked={cadreScope === 'DIRECT_NUMBERS'}
                      onChange={() => handleCadreChange('DIRECT_NUMBERS')}
                      className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold">📱 Direct Numbers</div>
                      <div className="text-[10px] text-slate-400 font-normal">Manual Input</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Particular Employee(s) Search & Picker Mode */}
              {cadreScope === 'SPECIFIC_STAFF' && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Search & Pick Particular Employee(s) by Employee ID, Name, or Phone:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                        {selectedSpecificIds.length} Selected
                      </span>
                      {selectedSpecificIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSpecificIds([])}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          Clear Selected
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected employee chips */}
                  {uniqueMatchingEmployees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-white rounded-xl border border-emerald-200/80">
                      {uniqueMatchingEmployees.map((emp) => (
                        <span
                          key={emp.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 text-[11px] font-bold"
                        >
                          <span className="font-mono text-[10px] text-emerald-800">{emp.employeeId}</span>
                          <span>• {emp.name}</span>
                          <span className="text-[10px] font-normal text-emerald-700">({emp.department})</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSpecificEmployee(emp.id)}
                            className="hover:bg-emerald-200 rounded p-0.5 text-emerald-800"
                            title="Remove employee"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={specificEmployeeQuery}
                      onChange={(e) => setSpecificEmployeeQuery(e.target.value)}
                      placeholder="Type Employee ID (e.g. EMP001), Staff Name (e.g. Saravanan), Department, or Mobile..."
                      className="w-full pl-9 pr-9 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    {specificEmployeeQuery && (
                      <button
                        type="button"
                        onClick={() => setSpecificEmployeeQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Clickable search matches list */}
                  <div className="bg-white border border-slate-200 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {specificSearchResults.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        No employees found matching &ldquo;{specificEmployeeQuery}&rdquo;. Try another ID, name, or number.
                      </div>
                    ) : (
                      specificSearchResults.map((emp) => {
                        const isPicked = selectedSpecificIds.includes(emp.id);
                        const isOptOut = emp.consentStatus === 'Opted-Out';
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => handleToggleSpecificEmployee(emp.id)}
                            className={cn(
                              'w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors hover:bg-slate-50',
                              isPicked && 'bg-emerald-50/70'
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                  {emp.employeeId}
                                </span>
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {emp.name}
                                </span>
                                {isOptOut && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                    Opted-Out
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {emp.department} • {emp.designation} •{' '}
                                <span className="font-mono text-slate-700">{emp.whatsappNumber}</span>
                              </div>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border',
                                isPicked
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500'
                              )}
                            >
                              {isPicked ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Selected</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Select</span>
                                </>
                              )}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Showing {specificSearchResults.length} matching staff from {employeeDirectory.length} total employees.</span>
                    <span className="font-bold text-emerald-800">{eligibleCount} eligible selected</span>
                  </div>
                </div>
              )}


              {/* Direct Mobile Numbers Mode (if active) */}
              {cadreScope === 'DIRECT_NUMBERS' && (
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#1E3A8A]" />
                      <span>Direct WhatsApp Numbers (Textbox):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomNumbersInput('+919551382296, +919842323330')}
                      className="text-[11px] text-[#1E3A8A] hover:underline font-semibold"
                    >
                      + Insert Lead Test Numbers
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={customNumbersInput}
                    onChange={(e) => setCustomNumbersInput(e.target.value)}
                    placeholder="Enter WhatsApp mobile numbers with or without +91 (e.g. 9551382296, +919842323330, 9943641747)..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Duplicates are automatically filtered out.</span>
                    <span className="font-bold text-[#1E3A8A]">
                      {uniqueMatchingEmployees.length} unique phone numbers verified
                    </span>
                  </div>
                </div>
              )}

              {/* Department & Designation Controls inside Single Card */}
              {cadreScope !== 'DIRECT_NUMBERS' && cadreScope !== 'SPECIFIC_STAFF' && (
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Department */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          <span>Department:</span>
                          {selectedDepartments.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full">
                              {selectedDepartments.length}
                            </span>
                          )}
                        </label>
                        {selectedDepartments.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedDepartments([])}
                            className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Selected Department Chips */}
                      {selectedDepartments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/90 rounded-xl border border-slate-200/80">
                          {selectedDepartments.map((dept) => (
                            <span
                              key={dept}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#1E3A8A] text-white pl-2 pr-1 py-0.5 rounded-lg shadow-2xs"
                            >
                              <span>{dept}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDepartment(dept)}
                                className="hover:bg-white/20 rounded p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={deptInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (activeDepartmentsList.includes(val)) {
                              handleAddDepartment(val);
                            } else {
                              setDeptInput(val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDepartment(deptInput);
                            }
                          }}
                          placeholder={
                            cadreScope === 'TEACHING_ONLY'
                              ? 'Search or select Teaching Department...'
                              : cadreScope === 'NON_TEACHING_ONLY'
                              ? 'Search or select Non-Teaching Department...'
                              : 'Search or select Department...'
                          }
                          list="unified-depts"
                          className="w-full pl-9 pr-14 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        />
                        <button
                          type="button"
                          disabled={!deptInput.trim()}
                          onClick={() => handleAddDepartment(deptInput)}
                          className="absolute right-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-[#1E3A8A] font-semibold text-[10px] rounded-lg transition-colors"
                        >
                          + Add
                        </button>
                        <datalist id="unified-depts">
                          {activeDepartmentsList
                            .filter((d) => !selectedDepartments.includes(d))
                            .map((d) => (
                              <option key={d} value={d} />
                            ))}
                        </datalist>
                      </div>

                      {/* Quick Department Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {quickDeptBadges.map((dept) => {
                          const isSelected = selectedDepartments.includes(dept);
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => handleToggleDepartment(dept)}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1',
                                isSelected
                                  ? 'bg-[#1E3A8A] text-white font-bold ring-1 ring-[#1E3A8A]'
                                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3 text-emerald-300" />}
                              <span>{dept}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Designation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          <span>Designation:</span>
                          {selectedDesignations.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full">
                              {selectedDesignations.length}
                            </span>
                          )}
                        </label>
                        {selectedDesignations.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedDesignations([])}
                            className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Selected Designation Chips */}
                      {selectedDesignations.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/90 rounded-xl border border-slate-200/80">
                          {selectedDesignations.map((desig) => (
                            <span
                              key={desig}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#1E3A8A] text-white pl-2 pr-1 py-0.5 rounded-lg shadow-2xs"
                            >
                              <span>{desig}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDesignation(desig)}
                                className="hover:bg-white/20 rounded p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={desigInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (activeDesignationsList.includes(val)) {
                              handleAddDesignation(val);
                            } else {
                              setDesigInput(val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDesignation(desigInput);
                            }
                          }}
                          placeholder={
                            cadreScope === 'TEACHING_ONLY'
                              ? 'Search or select Teaching Designation...'
                              : cadreScope === 'NON_TEACHING_ONLY'
                              ? 'Search or select Non-Teaching Designation...'
                              : 'Search or select Designation...'
                          }
                          list="unified-desigs"
                          className="w-full pl-9 pr-14 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        />
                        <button
                          type="button"
                          disabled={!desigInput.trim()}
                          onClick={() => handleAddDesignation(desigInput)}
                          className="absolute right-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-[#1E3A8A] font-semibold text-[10px] rounded-lg transition-colors"
                        >
                          + Add
                        </button>
                        <datalist id="unified-desigs">
                          {activeDesignationsList
                            .filter((d) => !selectedDesignations.includes(d))
                            .map((d) => (
                              <option key={d} value={d} />
                            ))}
                        </datalist>
                      </div>

                      {/* Quick Designation Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {quickDesigBadges.map((desig) => {
                          const isSelected = selectedDesignations.includes(desig);
                          return (
                            <button
                              key={desig}
                              type="button"
                              onClick={() => handleToggleDesignation(desig)}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1',
                                isSelected
                                  ? 'bg-[#1E3A8A] text-white font-bold ring-1 ring-[#1E3A8A]'
                                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3 text-emerald-300" />}
                              <span>{desig.includes('HOD') ? `★ ${desig}` : desig}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search within filtered results */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Search matching staff by name, ID or phone..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-[11px] font-semibold text-slate-500 px-2 py-1 bg-slate-100 rounded-lg">
                    {teachingCount} Teaching • {nonTeachingCount} Non-Teaching ({matchingEmployees.length} Total)
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllMatching}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllMatching}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Staff Selection Roster Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[460px] overflow-y-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-3 px-4 w-12">Select</th>
                      <th className="py-3 px-4">Staff Name & ID</th>
                      <th className="py-3 px-4">Cadre</th>
                      <th className="py-3 px-4">Department & Role</th>
                      <th className="py-3 px-4">WhatsApp Number</th>
                      <th className="py-3 px-4">Consent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {matchingEmployees.map((emp) => {
                      const isSelected = selectedStaffIds.includes(emp.id);
                      const isOptedOut = emp.consentStatus === 'Opted-Out';
                      const isTeaching = isTeachingStaff(emp);
                      return (
                        <tr
                          key={emp.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-blue-50/30' : ''
                          } ${isOptedOut ? 'opacity-60 bg-rose-50/20' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStaffSelect(emp.id)}
                              className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A] w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{emp.employeeId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isTeaching
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}
                            >
                              {isTeaching ? '👨‍⚕️ Teaching' : '🏥 Non-Teaching'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{emp.department}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{emp.designation}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-900 font-semibold">
                            {emp.whatsappNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isOptedOut
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {emp.consentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Navigation */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Test
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <span>Review & Dispatch Broadcast</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: REVIEW & DISPATCH BROADCAST                          */}
          {/* ============================================================ */}
          {step === 4 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Step 4: Final Review & Dispatch Broadcast
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Confirm your audience, check delivery parameters, and launch the broadcast.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  Ready to Dispatch
                </span>
              </div>

              {/* Working Sandbox Safeguard Notice */}
              <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3 shadow-2xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-2">
                    <span>🧪 Active Working Phase: Safe Test Mode Active</span>
                    <span className="text-[10px] bg-amber-200/90 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                      STAFF PROTECTED
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    All WhatsApp dispatches are strictly locked and diverted to your authorized test handset (<strong>+91 95513 82296</strong>). Real hospital staff ({eligibleCount} doctors & nurses) will <strong>never</strong> receive test broadcasts during this working phase.
                  </p>
                </div>
              </div>

              {/* Dispatch Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Broadcast Title
                  </span>
                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                    {title}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    selectedGateway === 'VAATI'
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-blue-50/80 border-blue-200'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase block ${
                      selectedGateway === 'VAATI' ? 'text-amber-800' : 'text-blue-800'
                    }`}
                  >
                    Active Gateway
                  </span>
                  <span
                    className={`font-bold text-xs truncate block mt-0.5 ${
                      selectedGateway === 'VAATI' ? 'text-amber-900' : 'text-blue-900'
                    }`}
                  >
                    {selectedGateway === 'VAATI' ? '⚡ VAATI (Self-Hosted)' : '☁️ WATI (Meta Cloud)'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Cadre Target
                  </span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {cadreScope === 'BOTH'
                      ? 'Teaching & Non-Teaching'
                      : cadreScope === 'TEACHING_ONLY'
                      ? 'Teaching Faculty Only'
                      : cadreScope === 'NON_TEACHING_ONLY'
                      ? 'Non-Teaching Staff Only'
                      : cadreScope === 'SPECIFIC_STAFF'
                      ? 'Particular Employee(s)'
                      : 'Direct Mobile Numbers'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Audience Scope
                  </span>
                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                    {cadreScope === 'DIRECT_NUMBERS'
                      ? 'Direct Phone Numbers'
                      : cadreScope === 'SPECIFIC_STAFF'
                      ? `${eligibleCount} Particular Employee(s) Selected`
                      : selectedDepartments.length > 0 || selectedDesignations.length > 0
                      ? [
                          selectedDepartments.length > 0 && `Dept: ${selectedDepartments.join(', ')}`,
                          selectedDesignations.length > 0 && `Desig: ${selectedDesignations.join(', ')}`,
                        ]
                          .filter(Boolean)
                          .join(' | ')
                      : 'Entire Hospital Staff'}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                    Net Verified Staff
                  </span>
                  <span className="font-extrabold text-emerald-700 text-base block mt-0.5">
                    {eligibleCount} Staff
                  </span>
                </div>
              </div>

              {/* Timing selector: Send Now vs Schedule */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Dispatch Timing</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDispatchTiming('NOW')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      dispatchTiming === 'NOW'
                        ? 'bg-white border-[#1E3A8A] shadow-xs ring-1 ring-[#1E3A8A]'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Radio className={`w-4 h-4 ${dispatchTiming === 'NOW' ? 'text-[#1E3A8A]' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900">Send Immediately</div>
                      <div className="text-[10px] text-slate-500">Dispatch via {selectedGateway} without delay</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchTiming('SCHEDULE')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      dispatchTiming === 'SCHEDULE'
                        ? 'bg-white border-[#1E3A8A] shadow-xs ring-1 ring-[#1E3A8A]'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${dispatchTiming === 'SCHEDULE' ? 'text-[#1E3A8A]' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900">Schedule for Later</div>
                      <div className="text-[10px] text-slate-500">Auto-dispatch at specified time</div>
                    </div>
                  </button>
                </div>

                {dispatchTiming === 'SCHEDULE' && (
                  <div className="pt-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Choose Future Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Final Dispatch Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Receivers
                </button>

                <button
                  type="button"
                  disabled={isSubmittingCampaign || eligibleCount === 0}
                  onClick={handleFinalBroadcast}
                  className="px-6 py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingCampaign ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting to {eligibleCount} Staff...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {dispatchTiming === 'NOW'
                          ? `Send Broadcast to ${eligibleCount} Staff Now`
                          : `Schedule Broadcast for ${scheduleDateTime}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Split Screen on Step 3 (Selected Dept & Designation with Categories) vs WhatsApp Phone Preview on other steps */}
        {step !== 3 ? (
          <div className="lg:col-span-5 lg:sticky lg:top-24 flex justify-center">
            <WhatsAppPhonePreview
              template={activeTemplate}
              variables={variableValues}
              sampleRecipientName="Dr. A. Saravanan"
            />
          </div>
        ) : (
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4 text-xs animate-in fade-in duration-150">
            {/* Target Audience Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Selected Target Receivers</h4>
                    <span className="text-[10px] text-slate-400">Live Cadre, Dept & Role Summary</span>
                  </div>
                </div>
                {(selectedDepartments.length > 0 || selectedDesignations.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDepartments([]);
                      setSelectedDesignations([]);
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
                    title="Reset Department & Designation Filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* 1. Cadre / Category */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#1E3A8A]" />
                  <span>Cadre / Category</span>
                </span>
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    {cadreScope === 'BOTH' && '👥 All Staff (Both Cadres)'}
                    {cadreScope === 'TEACHING_ONLY' && '👨‍⚕️ Teaching Faculty Only'}
                    {cadreScope === 'NON_TEACHING_ONLY' && '🏥 Non-Teaching Staff Only'}
                    {cadreScope === 'SPECIFIC_STAFF' && '🎯 Particular Employee(s)'}
                    {cadreScope === 'DIRECT_NUMBERS' && '📱 Direct Mobile Numbers'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-[#1E3A8A] rounded-md">
                    {cadreScope === 'BOTH' && `${employeeDirectory.length} Staff`}
                    {cadreScope === 'TEACHING_ONLY' && 'Teaching'}
                    {cadreScope === 'NON_TEACHING_ONLY' && 'Non-Teaching'}
                    {cadreScope === 'SPECIFIC_STAFF' && `${selectedSpecificIds.length} Picked`}
                    {cadreScope === 'DIRECT_NUMBERS' && `${uniqueMatchingEmployees.length} Numbers`}
                  </span>
                </div>
              </div>

              {/* Selected Individual Employees summary (when SPECIFIC_STAFF is active) */}
              {cadreScope === 'SPECIFIC_STAFF' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>Picked Employees</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      {uniqueMatchingEmployees.length} Selected
                    </span>
                  </div>
                  {uniqueMatchingEmployees.length === 0 ? (
                    <div className="p-2.5 bg-amber-50 border border-dashed border-amber-300 rounded-xl text-amber-800 text-[11px]">
                      Search by Employee ID or Name on the left to pick one or more recipients.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-1">
                      {uniqueMatchingEmployees.map((emp) => (
                        <span
                          key={emp.id}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-950 border border-emerald-200 pl-2 pr-1 py-0.5 rounded-lg"
                        >
                          <span>{emp.employeeId} • {emp.name}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSpecificEmployee(emp.id)}
                            className="hover:bg-emerald-200/70 rounded p-0.5 text-emerald-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Selected Departments with Categories */}
              {cadreScope !== 'DIRECT_NUMBERS' && cadreScope !== 'SPECIFIC_STAFF' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#1E3A8A]" />
                      <span>Selected Departments</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {selectedDepartments.length === 0 ? 'All Included' : `${selectedDepartments.length} Selected`}
                    </span>
                  </div>

                  {selectedDepartments.length === 0 ? (
                    <div className="p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-[11px] flex items-center justify-between">
                      <span>All departments included in active cadre</span>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Teaching Category Departments */}
                      {categorizedSelectedDepartments.teaching.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide block">
                            👨‍⚕️ Teaching Clinical ({categorizedSelectedDepartments.teaching.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {categorizedSelectedDepartments.teaching.map((dept) => (
                              <span
                                key={dept}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 pl-2 pr-1 py-0.5 rounded-lg"
                              >
                                <span>{dept}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDepartment(dept)}
                                  className="hover:bg-blue-200/70 rounded p-0.5 text-blue-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Non-Teaching Category Departments */}
                      {categorizedSelectedDepartments.nonTeaching.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide block">
                            🏥 Non-Teaching Operations ({categorizedSelectedDepartments.nonTeaching.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {categorizedSelectedDepartments.nonTeaching.map((dept) => (
                              <span
                                key={dept}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-200 pl-2 pr-1 py-0.5 rounded-lg"
                              >
                                <span>{dept}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDepartment(dept)}
                                  className="hover:bg-purple-200/70 rounded p-0.5 text-purple-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* General / Shared Departments */}
                      {categorizedSelectedDepartments.general.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                            🏢 Hospital Wide ({categorizedSelectedDepartments.general.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {categorizedSelectedDepartments.general.map((dept) => (
                              <span
                                key={dept}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 pl-2 pr-1 py-0.5 rounded-lg"
                              >
                                <span>{dept}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDepartment(dept)}
                                  className="hover:bg-slate-200 rounded p-0.5 text-slate-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Selected Designations with Categories */}
              {cadreScope !== 'DIRECT_NUMBERS' && cadreScope !== 'SPECIFIC_STAFF' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-[#1E3A8A]" />
                      <span>Selected Designations</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {selectedDesignations.length === 0 ? 'All Included' : `${selectedDesignations.length} Selected`}
                    </span>
                  </div>

                  {selectedDesignations.length === 0 ? (
                    <div className="p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-[11px] flex items-center justify-between">
                      <span>All designations included in active cadre</span>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Teaching Designations */}
                      {categorizedSelectedDesignations.teaching.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide block">
                            👨‍⚕️ Faculty & Doctor Roles ({categorizedSelectedDesignations.teaching.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {categorizedSelectedDesignations.teaching.map((desig) => (
                              <span
                                key={desig}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 pl-2 pr-1 py-0.5 rounded-lg"
                              >
                                <span>{desig.includes('HOD') ? `★ ${desig}` : desig}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDesignation(desig)}
                                  className="hover:bg-blue-200/70 rounded p-0.5 text-blue-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Non-Teaching Designations */}
                      {categorizedSelectedDesignations.nonTeaching.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide block">
                            🏥 Nursing & Allied Roles ({categorizedSelectedDesignations.nonTeaching.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {categorizedSelectedDesignations.nonTeaching.map((desig) => (
                              <span
                                key={desig}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-200 pl-2 pr-1 py-0.5 rounded-lg"
                              >
                                <span>{desig}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDesignation(desig)}
                                  className="hover:bg-purple-200/70 rounded p-0.5 text-purple-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Designations */}
                      {categorizedSelectedDesignations.general.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                            🏢 Other Designations ({categorizedSelectedDesignations.general.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {categorizedSelectedDesignations.general.map((desig) => (
                              <span
                                key={desig}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 pl-2 pr-1 py-0.5 rounded-lg"
                              >
                                <span>{desig}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDesignation(desig)}
                                  className="hover:bg-slate-200 rounded p-0.5 text-slate-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Live Reach & Anti-Duplication Metric */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Eligible Recipients</span>
                  </span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {eligibleCount} Staff
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Teaching:</span>
                    <span className="font-bold text-[#1E3A8A]">{teachingCount} Faculty</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Non-Teaching:</span>
                    <span className="font-bold text-purple-700">{nonTeachingCount} Staff</span>
                  </div>
                </div>
              </div>

              {/* Quick Action */}
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Continue to Dispatch (Step 4)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
