'use client';

import { Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AvatarUploader from '@/components/panel/AvatarUploader';
import { profileSchema, type ProfileFormData } from '@/components/panel/schemas';
import type { ProfileFormValues } from '@/components/panel/types';

interface ProfileCardProps {
  initialProfile: Omit<ProfileFormValues, 'avatarFile'>;
  onSave?: (profileValues: ProfileFormValues) => void;
  isLoading?: boolean;
  isCompact?: boolean;
}

export default function ProfileCard({
  initialProfile,
  onSave,
  isLoading = false,
  isCompact = false,
}: ProfileCardProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saveFeedback, setSaveFeedback] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: initialProfile.username || '',
      firstName: initialProfile.firstName || '',
      lastName: initialProfile.lastName || '',
      bio: initialProfile.bio || '',
      avatarUrl: initialProfile.avatarUrl || null,
    },
  });

  useEffect(() => {
    reset({
      username: initialProfile.username || '',
      firstName: initialProfile.firstName || '',
      lastName: initialProfile.lastName || '',
      bio: initialProfile.bio || '',
      avatarUrl: initialProfile.avatarUrl || null,
    });
  }, [initialProfile, reset]);

  const bioValue = watch('bio') || '';
  const bioCharactersLeft = 180 - bioValue.length;

  const onSubmit = (data: ProfileFormData) => {
    const profileData: ProfileFormValues = {
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      bio: data.bio || '',
      avatarUrl: data.avatarUrl || null,
      avatarFile: avatarFile || undefined,
    };

    onSave?.(profileData);
    setSaveFeedback('✅ تغییرات پروفایل ذخیره شد.');
    setTimeout(() => setSaveFeedback(''), 3000);
  };

  const isSubmitDisabled = useMemo(() => {
    return !isDirty && !avatarFile;
  }, [isDirty, avatarFile]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Avatar */}
      <Controller
        name="avatarUrl"
        control={control}
        render={({ field }) => (
          <AvatarUploader
            initialAvatarUrl={field.value || null}
            displayName={`${watch('firstName')} ${watch('lastName')}`.trim()}
            onFileChange={(file) => {
              setAvatarFile(file);
              if (file) {
                const url = URL.createObjectURL(file);
                field.onChange(url);
              } else {
                field.onChange(null);
              }
            }}
          />
        )}
      />

      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">نام</label>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <input {...field} placeholder="نام خود را وارد کنید" className="input" />
            )}
          />
          {errors.firstName && <p className="text-xs text-error">{errors.firstName.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">نام خانوادگی</label>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <input {...field} placeholder="نام خانوادگی خود را وارد کنید" className="input" />
            )}
          />
          {errors.lastName && <p className="text-xs text-error">{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground-muted">یوزرنیم</label>
        <div className="relative">
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-foreground-muted">@</span>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <input {...field} placeholder="username" className="input pr-8" />
            )}
          />
        </div>
        {errors.username ? (
          <p className="text-xs text-error">{errors.username.message}</p>
        ) : (
          <p className="text-xs text-foreground-muted">فقط حروف انگلیسی، اعداد و زیرخط مجاز است</p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground-muted">بیوگرافی</label>
        <Controller
          name="bio"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={isCompact ? 3 : 4}
              placeholder="درباره خودتان بنویسید..."
              className="input min-h-[80px] resize-none"
              maxLength={180}
            />
          )}
        />
        <div className="flex justify-between text-xs">
          {errors.bio ? (
            <p className="text-error">{errors.bio.message}</p>
          ) : (
            <p className="text-foreground-muted">{bioCharactersLeft} کاراکتر باقی مانده</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {saveFeedback ? (
          <p className="text-xs font-semibold text-success">{saveFeedback}</p>
        ) : (
          <div />
        )}
        <button
          type="submit"
          disabled={isSubmitDisabled || isSubmitting || isLoading}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              در حال ذخیره...
            </span>
          ) : (
            <>
              <Save size={16} />
              ذخیره تغییرات
            </>
          )}
        </button>
      </div>
    </form>
  );
}
