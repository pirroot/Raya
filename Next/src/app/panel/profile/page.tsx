'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, GraduationCap, Smile } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { resolveBackendUrl } from '@/lib/api';
import ProfileCard from '@/components/panel/ProfileCard';
import AdditionalInfoCard from '@/components/panel/AdditionalInfoCard';
import {
  ProfileFormValues,
  AdditionalInfoFormValues,
  EducationOption,
} from '@/components/panel/types';
import { ProfileStatus } from '@/components/panel/ProfileStatus';
import { API_ENDPOINTS } from '@/lib/auth-constants';

let inFlightProfileRequest: Promise<any> | null = null;

function normalizeEducationLevel(value: unknown): AdditionalInfoFormValues['educationLevel'] {
  switch (String(value ?? '').toLowerCase()) {
    case 'diploma':
    case 'associate':
    case 'bachelor':
    case 'master':
    case 'phd':
      return value as AdditionalInfoFormValues['educationLevel'];
    case 'doctorate':
      return 'phd';
    default:
      return 'bachelor';
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileValues, setProfileValues] = useState<ProfileFormValues>({
    avatarUrl: null,
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
  });

  const [additionalValues, setAdditionalValues] = useState<AdditionalInfoFormValues>({
    studentCode: '',
    birthDate: '',
    educationLevel: 'bachelor',
  });

  const [status, setStatus] = useState('online');
  const [interests, setInterests] = useState<string[]>([]);

  const educationOptions: EducationOption[] = [
    { value: 'diploma', label: 'دیپلم' },
    { value: 'associate', label: 'کاردانی' },
    { value: 'bachelor', label: 'کارشناسی' },
    { value: 'master', label: 'کارشناسی ارشد' },
    { value: 'phd', label: 'دکتری' },
  ];

  useEffect(() => {
    const hasMeaningful400Payload = (error: unknown) => {
      const payload = (error as { response?: { data?: unknown } })?.response?.data;
      if (!payload) return false;
      if (typeof payload === 'string') return payload.trim().length > 0;
      if (typeof payload === 'object') {
        const data = payload as Record<string, unknown>;
        return 'message' in data || 'error' in data || 'errors' in data;
      }
      return false;
    };

    const loadProfileWithRetry = async () => {
      if (inFlightProfileRequest) {
        return inFlightProfileRequest;
      }

      let lastError: unknown;
      inFlightProfileRequest = (async () => {
        for (let attempt = 0; attempt < 4; attempt += 1) {
          try {
            return await api.get(API_ENDPOINTS.USERS.PROFILE);
          } catch (error) {
            lastError = error;
            const status = Number((error as { response?: { status?: number } })?.response?.status);
            const canRetry =
              status === 502 ||
              status === 503 ||
              (status === 400 && !hasMeaningful400Payload(error));

            if (!canRetry || attempt === 3) {
              throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 180 * (attempt + 1)));
          }
        }
        throw lastError;
      })();

      try {
        return await inFlightProfileRequest;
      } finally {
        inFlightProfileRequest = null;
      }
    };

    const loadProfile = async () => {
      try {
        const res = await loadProfileWithRetry();
        const p = res.data;

        setProfileValues({
          avatarUrl:
            p?.avatarUrl || p?.avatar_url ? resolveBackendUrl(p.avatarUrl || p.avatar_url) : null,
          username: p?.username || p?.user_name || '',
          firstName: p?.first_name || p?.firstName || '',
          lastName: p?.last_name || p?.lastName || '',
          bio: p?.bio || '',
        });

        setAdditionalValues({
          studentCode: p?.student_code || p?.studentCode || '',
          birthDate: p?.birth_date || p?.birthDate || '',
          educationLevel: normalizeEducationLevel(p?.education_level ?? p?.educationLevel),
        });

        setStatus(p?.status || 'online');
        setInterests(p?.interests || []);
      } catch (err) {
        console.error('error loading profile', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleProfileSave = async (values: ProfileFormValues) => {
    setSaving(true);
    try {
      const payload: any = {};

      if (values.username) payload.username = values.username;
      if (values.firstName) payload.first_name = values.firstName;
      if (values.lastName) payload.last_name = values.lastName;
      if (values.bio !== undefined) payload.bio = values.bio;

      if (Object.keys(payload).length > 0) {
        await api.patch(API_ENDPOINTS.USERS.PROFILE, payload);
      }

      if (values.avatarFile) {
        const formData = new FormData();
        formData.append('avatar', values.avatarFile);

        await api.post(API_ENDPOINTS.USERS.AVATAR, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setProfileValues(values);
    } catch (e) {
      console.error('profile update error', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAdditionalSave = async (values: AdditionalInfoFormValues) => {
    setSaving(true);
    try {
      const payload: any = {};

      if (values.studentCode) payload.student_code = values.studentCode;
      if (values.birthDate) payload.birth_date = values.birthDate;
      if (values.educationLevel) payload.education_level = values.educationLevel;

      if (Object.keys(payload).length === 0) {
        setSaving(false);
        return;
      }

      await api.patch(API_ENDPOINTS.USERS.PROFILE, payload);
      setAdditionalValues(values);
    } catch (e) {
      console.error('additional info update error', e);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await api.patch(API_ENDPOINTS.USERS.PROFILE, { status: newStatus });
    } catch (e) {
      console.error('status update error', e);
    }
  };

  const handleInterestsChange = async (newInterests: string[]) => {
    setInterests(newInterests);
    try {
      await api.patch(API_ENDPOINTS.USERS.PROFILE, { interests: newInterests });
    } catch (e) {
      console.error('interests update error', e);
    }
  };

  if (loading) {
    return (
      <Container className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-black text-foreground">پروفایل من</h1>
        <Link href="/panel" className="btn btn-secondary rounded-[var(--radius)] p-2.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="space-y-4">
        {/* Status & Interests */}
        <Card className="p-4">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
            <div className="rounded-[var(--radius-sm)] bg-purple-50 p-2 text-purple-500 dark:bg-purple-950/30">
              <Smile className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">وضعیت و علاقه‌مندی</h3>
              <p className="text-xs text-foreground-muted">حالت و سلیقه خود را تنظیم کنید</p>
            </div>
          </div>
          <ProfileStatus
            initialStatus={status}
            initialInterests={interests}
            onStatusChange={handleStatusChange}
            onInterestsChange={handleInterestsChange}
          />
        </Card>

        {/* Profile Information */}
        <Card className="p-4">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
            <div className="rounded-[var(--radius-sm)] bg-primary-soft p-2 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">اطلاعات پروفایل</h3>
              <p className="text-xs text-foreground-muted">ویرایش اطلاعات اصلی حساب کاربری</p>
            </div>
          </div>
          <ProfileCard
            initialProfile={profileValues}
            onSave={handleProfileSave}
            isLoading={saving}
          />
        </Card>

        {/* Additional Information */}
        <Card className="p-4">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
            <div className="rounded-[var(--radius-sm)] bg-[var(--green-cus)] p-2 text-emerald-500">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">اطلاعات تکمیلی</h3>
              <p className="text-xs text-foreground-muted">
                این اطلاعات کمک می‌کند پیشنهادهای دقیق‌تری دریافت کنید
              </p>
            </div>
          </div>
          <AdditionalInfoCard
            initialInfo={additionalValues}
            educationOptions={educationOptions}
            onSave={handleAdditionalSave}
            isLoading={saving}
          />
        </Card>
      </div>
    </Container>
  );
}
