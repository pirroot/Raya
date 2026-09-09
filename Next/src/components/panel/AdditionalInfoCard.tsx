"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { additionalInfoSchema, type AdditionalInfoFormData } from "@/components/panel/schemas";
import type { AdditionalInfoFormValues, EducationOption } from "@/components/panel/types";
import { DatePicker } from "@/components/ui/DatePicker";

interface AdditionalInfoCardProps {
  initialInfo?: AdditionalInfoFormValues;
  educationOptions: EducationOption[];
  onSave?: (values: AdditionalInfoFormValues) => void;
  isLoading?: boolean;
  isCompact?: boolean;
}

const DEFAULT_VALUES: AdditionalInfoFormValues = {
  studentCode: "",
  birthDate: "",
  educationLevel: "bachelor",
};

export default function AdditionalInfoCard({
  initialInfo,
  educationOptions,
  onSave,
  isLoading = false,
  isCompact = false,
}: AdditionalInfoCardProps) {
  const [savedMessage, setSavedMessage] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    watch,
  } = useForm<AdditionalInfoFormData>({
    resolver: zodResolver(additionalInfoSchema),
    defaultValues: {
      studentCode: initialInfo?.studentCode || "",
      birthDate: initialInfo?.birthDate || "",
      educationLevel: initialInfo?.educationLevel || "bachelor",
    },
  });

  const birthDate = watch("birthDate");

  useEffect(() => {
    if (initialInfo) {
      reset({
        studentCode: initialInfo.studentCode || "",
        birthDate: initialInfo.birthDate || "",
        educationLevel: initialInfo.educationLevel || "bachelor",
      });
    }
  }, [initialInfo, reset]);

  const onSubmit = (data: AdditionalInfoFormData) => {
    onSave?.({
      studentCode: data.studentCode || "",
      birthDate: data.birthDate || "",
      educationLevel: data.educationLevel,
    });
    setSavedMessage("✅ اطلاعات تکمیلی ذخیره شد.");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Student Code */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">
            کد دانشجویی
          </label>
          <Controller
            name="studentCode"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                placeholder="مثال: 40123456"
                className="input"
              />
            )}
          />
          {errors.studentCode && (
            <p className="text-xs text-error">{errors.studentCode.message}</p>
          )}
        </div>

        {/* Birth Date - Persian DatePicker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">
            تاریخ تولد
          </label>
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="تاریخ تولد را انتخاب کنید"
                error={errors.birthDate?.message}
              />
            )}
          />
          {errors.birthDate && (
            <p className="text-xs text-error">{errors.birthDate.message}</p>
          )}
        </div>
      </div>

      {/* Education Level */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground-muted">
          مقطع تحصیلی
        </label>
        <Controller
          name="educationLevel"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className="input appearance-none bg-background-elevated"
            >
              {educationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.educationLevel && (
          <p className="text-xs text-error">{errors.educationLevel.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {savedMessage ? (
          <p className="text-xs font-semibold text-success">{savedMessage}</p>
        ) : (
          <div />
        )}
        <button
          type="submit"
          disabled={!isDirty || isSubmitting || isLoading}
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
              ذخیره اطلاعات
            </>
          )}
        </button>
      </div>
    </form>
  );
}