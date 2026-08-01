export type AssetStatus = "active" | "pending" | "inactive" | string;
export type AssetType = "subdomain" | "email" | "medsos" | "domain" | "akun" | string;
export type AccessRole = "owner" | "editor" | "viewer" | string;

export type Aset = {
  id: number;
  domain_name: string;
  purpose: string;
  status: AssetStatus;
  tipe_aset: AssetType;
  detail?: string | null;
  user_role?: AccessRole;
  pic_name?: string;
  institution?: string;
};

export type Permission = {
  id: number;
  user_name?: string | null;
  user_nbm: string;
  role: AccessRole;
};

export type StaffMember = {
  id: number;
  staff_name?: string | null;
  user_identifier: string;
  allowed_type: string;
};

export type SsoUser = {
  id: number | string;
  nbm?: string | null;
  name?: string | null;
  email?: string | null;
};

export type EligibleStaffUser = SsoUser & {
  nbm: string;
};

export type AdminUser = {
  nbm: string;
  name?: string | null;
};

export type PicUser = {
  id: number | string;
  nbm: string;
  name?: string | null;
  institution?: string | null;
  email?: string | null;
  email_instansi?: string | null;
  phone?: string | null;
  status?: string | null;
  surat_tugas?: string | null;
  surat_permohonan?: string | null;
};

export type PicInfo = {
  isRegistered: boolean;
  status: string | null;
  data: PicUser | null;
};

export type StaffCheck = {
  isStaff: boolean;
  allowedType: string;
};
