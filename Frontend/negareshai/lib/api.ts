const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:6129";
const IDENTITY_BASE = process.env.NEXT_PUBLIC_IDENTITY_BASE_URL ?? "http://localhost:5005";

export type DocumentListItem = {
  id: string;
  title: string;
  documentType: string;
  versionCount: number;
  confidentialityLevel: number;
  processingStatus: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type DocumentListResponse = {
  items: DocumentListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type DashboardActivity = {
  action: string;
  entityType: string;
  entityId?: string;
  createdAtUtc: string;
};

export type DashboardDeadline = {
  contractId: string;
  subject: string;
  endDate: string;
  daysRemaining: number;
};

export type DashboardResponse = {
  organizationName: string;
  currentUserId: string;
  documentCount: number;
  activeContractCount: number;
  pendingReviewCount: number;
  readyDocumentCount: number;
  recentDocuments: DocumentListItem[];
  recentActivities: DashboardActivity[];
  upcomingDeadlines: DashboardDeadline[];
};

export type RuntimeSetting = {
  id: string;
  category: string;
  key: string;
  valueJson: string;
  version: number;
  isActive: boolean;
  updatedAtUtc: string;
};

export type ContractParty = {
  id?: string;
  role: number;
  name: string;
  nationalIdentifier?: string;
  representativeName?: string;
};

export type ContractItem = {
  id: string;
  documentId: string;
  subject: string;
  contractNumber?: string;
  status: number;
  amount?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  partyCount: number;
  updatedAtUtc: string;
};

export type ContractListResponse = {
  items: ContractItem[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type ContractDetail = ContractItem & {
  internalOwnerUserId?: string;
  parties: ContractParty[];
  createdAtUtc: string;
};

export type DocumentVersion = {
  id: string;
  versionNumber: number;
  fileId: string;
  changeSummary?: string;
  createdByUserId?: string;
  createdAtUtc: string;
};

export type DocumentDetail = {
  id: string;
  organizationId: string;
  title: string;
  documentType: string;
  confidentialityLevel: number;
  processingStatus: number;
  isArchived: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  versions: DocumentVersion[];
};

function accessToken() {
  return typeof window !== "undefined"
    ? window.localStorage.getItem("negareshai.access_token")
    : null;
}

export async function listDocuments(search = ""): Promise<DocumentListResponse> {
  const token = accessToken();
  const query = new URLSearchParams();
  if (search.trim()) query.set("search", search.trim());
  const response = await fetch(`${API_BASE}/api/documents?${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("دریافت فهرست اسناد انجام نشد");
  return response.json();
}

export async function getDashboard(): Promise<DashboardResponse> {
  const token = accessToken();
  const response = await fetch(`${API_BASE}/api/dashboard`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("دریافت اطلاعات داشبورد انجام نشد");
  return response.json();
}

export async function listRuntimeSettings(category = ""): Promise<RuntimeSetting[]> {
  const token = accessToken();
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await fetch(`${API_BASE}/api/runtime-settings${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("دریافت تنظیمات پویای سامانه انجام نشد");
  return response.json();
}

export async function listContracts(search = ""): Promise<ContractListResponse> {
  const token = accessToken();
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`${API_BASE}/api/contracts${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("دریافت قراردادها انجام نشد");
  return response.json();
}

export async function saveContract(input: {
  id?: string;
  documentId: string;
  contractNumber?: string;
  subject: string;
  status: number;
  amount?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  internalOwnerUserId?: string;
  parties: ContractParty[];
}) {
  const token = accessToken();
  const response = await fetch(
    input.id ? `${API_BASE}/api/contracts/${input.id}` : `${API_BASE}/api/contracts`,
    {
      method: input.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(input)
    });
  if (!response.ok) throw new Error(await response.text() || "ثبت قرارداد انجام نشد");
  return response.json();
}

export async function getContract(id: string): Promise<ContractDetail> {
  const token = accessToken();
  const response = await fetch(`${API_BASE}/api/contracts/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("دریافت جزئیات قرارداد انجام نشد");
  return response.json();
}

export async function archiveContract(id: string) {
  const token = accessToken();
  const response = await fetch(`${API_BASE}/api/contracts/${id}/archive`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("بایگانی قرارداد انجام نشد");
}

export async function getDocumentDetail(id: string, includeArchived = false): Promise<DocumentDetail> {
  const token = accessToken();
  const response = await fetch(
    `${API_BASE}/api/documents/${id}/details?includeArchived=${includeArchived}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error("دریافت جزئیات سند انجام نشد");
  return response.json();
}

export async function archiveDocument(id: string) {
  const token = accessToken();
  const response = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("بایگانی سند انجام نشد");
}

export async function restoreDocument(id: string) {
  const token = accessToken();
  const response = await fetch(`${API_BASE}/api/documents/${id}/restore`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("بازیابی سند انجام نشد");
}

export async function listArchivedDocuments(): Promise<DocumentListItem[]> {
  const token = accessToken();
  const response = await fetch(`${API_BASE}/api/documents/archived`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("دریافت بایگانی اسناد انجام نشد");
  return response.json();
}

export async function updateDocument(id: string, input: {
  title: string;
  documentType: string;
  confidentialityLevel: number;
}) {
  const token = accessToken();
  const response = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await response.text() || "ویرایش سند انجام نشد");
  return response.json();
}

export async function uploadDocumentVersion(id: string, file: File, changeSummary = "") {
  const token = accessToken();
  const form = new FormData();
  form.append("file", file);
  if (changeSummary.trim()) form.append("changeSummary", changeSummary.trim());
  const response = await fetch(`${API_BASE}/api/documents/${id}/versions`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  if (!response.ok) throw new Error(await response.text() || "ثبت نسخه جدید انجام نشد");
  return response.json();
}

export async function downloadDocumentVersion(documentId: string, versionId: string) {
  const token = accessToken();
  const response = await fetch(
    `${API_BASE}/api/documents/${documentId}/versions/${versionId}/download`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error("دانلود نسخه سند انجام نشد");
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename\\?="?([^";]+)"?/i);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = match?.[1] ?? "document";
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function login(username: string, password: string) {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: "HealanClinicMobile",
    username,
    password,
    scope: "openid profile Content_Producer"
  });
  const response = await fetch(`${IDENTITY_BASE}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) throw new Error("نام کاربری یا رمز عبور صحیح نیست");
  const result = await response.json();
  setAccessToken(result.access_token);
}

export async function registerDocument(input: {
  title: string;
  documentType: string;
  fileId: string;
  confidentialityLevel?: number;
}) {
  const token = accessToken();
  const response = await fetch(`${API_BASE}/api/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error("ثبت سند انجام نشد");
  return response.json();
}

export function uploadDocument(
  input: { file: File; title?: string; documentType?: string; confidentialityLevel?: number },
  onProgress?: (percent: number) => void
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const token = accessToken();
    const form = new FormData();
    form.append("file", input.file);
    if (input.title) form.append("title", input.title);
    form.append("documentType", input.documentType ?? "contract");
    if (input.confidentialityLevel) {
      form.append("confidentialityLevel", String(input.confidentialityLevel));
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/documents/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        onProgress?.(Math.round(event.loaded / event.total * 100));
      }
    };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300
      ? resolve(JSON.parse(xhr.responseText))
      : reject(new Error(xhr.responseText || `بارگذاری انجام نشد (${xhr.status})`));
    xhr.onerror = () => reject(new Error("ارتباط با سرور برای بارگذاری سند برقرار نشد"));
    xhr.send(form);
  });
}

export function setAccessToken(token: string) {
  window.localStorage.setItem("negareshai.access_token", token);
}

export function clearAccessToken() {
  window.localStorage.removeItem("negareshai.access_token");
}
