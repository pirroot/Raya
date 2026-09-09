export type UniversityType =
  | "state"
  | "azad"
  | "medical"
  | "nonprofit"
  | "payame_noor";

export type MajorCategory =
  | "engineering"
  | "medical"
  | "humanities"
  | "management"
  | "science"
  | "art";

export type UniversityOption = {
  universityId: string;
  universitySlug: string;
  universityNameFa: string;
  universityType: UniversityType;
  universityBranchId: string;
  universityBranchSlug: string;
  universityBranchNameFa: string;
  cityId: string;
  citySlug: string;
  cityNameFa: string;
};

export type MajorOption = {
  majorId: string;
  majorSlug: string;
  majorNameFa: string;
  majorCategoryId: string;
  majorCategorySlug: MajorCategory;
  majorCategoryNameFa: string;
  subCategory: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
};
