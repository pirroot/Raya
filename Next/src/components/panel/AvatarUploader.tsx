"use client";

import { Camera, User } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface AvatarUploaderProps {
  initialAvatarUrl: string | null;
  displayName: string;
  onFileChange: (file: File | null) => void;
}

export default function AvatarUploader({
  initialAvatarUrl,
  displayName,
  onFileChange,
}: AvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      onFileChange(file);
    }
  };

  const handleRemove = () => {
    setAvatarUrl(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        {/* Avatar */}
        <div className="h-24 w-24 rounded-full bg-background-subtle border-2 border-border overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || "User avatar"}
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-12 w-12 text-foreground-muted" />
            </div>
          )}
        </div>

        {/* Upload overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg transition-all hover:bg-primary-hover hover:scale-110"
        >
          <Camera size={16} />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {avatarUrl && (
        <button
          onClick={handleRemove}
          className="text-xs text-error hover:text-error/80 transition-colors"
        >
          حذف عکس
        </button>
      )}
    </div>
  );
}