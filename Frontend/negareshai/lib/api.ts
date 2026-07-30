const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:6129";
const USER_MANAGER_BASE = process.env.NEXT_PUBLIC_USER_MANAGER_BASE_URL ?? "http://localhost:5074";

export type AccessMenu = {
  accessMenuId: number;
  title?: string;
  isActive: boolean;
  accessForm?: { accessFormId: number; formTitle: string; url: string };
  children: AccessMenu[];
};

export async function listMyMenus(accessSystemId = 12): Promise<AccessMenu[]> {
  const token = accessToken();
  const response = await fetch(
    `${USER_MANAGER_BASE}/UserManager/api/v1/UserAccess/MyMenus?AccessSystemId=${accessSystemId}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!response.ok) throw new Error("دریافت منوی دسترسی کاربر انجام نشد.");
  return response.json();
}

export type IdentityRole = { id:string; name:string; displayName:string; isSystem:boolean; isDeleted:boolean };
export type IdentityUser = { id:string; userName:string; firstName:string; lastName:string; email?:string; phoneNumber?:string; isActive:boolean; isDeleted:boolean; roleIds:string[] };
const identityManagementPath = "/UserManager/api/v1/NegareshAIIdentityManagement";
async function userManagerFetch(path:string, init:RequestInit={}) {
  const headers=new Headers(init.headers); const token=accessToken();
  if(token)headers.set("Authorization",`Bearer ${token}`);
  return fetch(`${USER_MANAGER_BASE}${path}`,{...init,headers});
}
export async function listIdentityUsers():Promise<IdentityUser[]> {
  const response=await userManagerFetch(`${identityManagementPath}/users`);
  if(!response.ok)throw new Error("دریافت کاربران انجام نشد."); return response.json();
}
export async function listIdentityRoles():Promise<IdentityRole[]> {
  const response=await userManagerFetch(`${identityManagementPath}/roles`);
  if(!response.ok)throw new Error("دریافت نقش‌ها انجام نشد."); return response.json();
}
export async function createIdentityRole(input:{name:string;displayName:string}) {
  const response=await userManagerFetch(`${identityManagementPath}/roles`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
  if(!response.ok)throw new Error(await response.text()||"ثبت نقش انجام نشد.");
}
export async function createIdentityUser(input:{userName:string;firstName:string;lastName:string;email?:string;phoneNumber?:string;password:string;isActive:boolean;roleIds:string[]}) {
  const response=await userManagerFetch(`${identityManagementPath}/users`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
  if(!response.ok)throw new Error(await response.text()||"ثبت کاربر انجام نشد.");
}
export async function saveRolePermissions(roleId:string, accessMenuIds:number[]) {
  const response=await userManagerFetch(`${identityManagementPath}/roles/${roleId}/permissions`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({accessMenuIds})});
  if(!response.ok)throw new Error(await response.text()||"ثبت دسترسی نقش انجام نشد.");
}
export async function getRolePermissions(roleId:string):Promise<number[]> {
  const response=await userManagerFetch(`${identityManagementPath}/roles/${roleId}/permissions`);
  if(!response.ok)throw new Error("دریافت دسترسی نقش انجام نشد.");
  return ((await response.json()) as {accessMenuIds:number[]}).accessMenuIds;
}
export async function saveDirectUserAccess(userId:string, grants:number[], denies:number[]) {
  const headers={"Content-Type":"application/json"};
  const [grantResponse,denyResponse]=await Promise.all([
    userManagerFetch(`/UserManager/api/v1/HealanRoleManagement/users/${userId}/direct-grants`,{method:"PUT",headers,body:JSON.stringify({accessSystemId:12,accessMenuIds:grants})}),
    userManagerFetch(`/UserManager/api/v1/HealanRoleManagement/users/${userId}/direct-denies`,{method:"PUT",headers,body:JSON.stringify({accessSystemId:12,accessMenuIds:denies})})
  ]);
  if(!grantResponse.ok||!denyResponse.ok)throw new Error("ثبت دسترسی مستقیم کاربر انجام نشد.");
}
export async function getDirectUserAccess(userId:string) {
  const [grantResponse,denyResponse]=await Promise.all([
    userManagerFetch(`/UserManager/api/v1/HealanRoleManagement/users/${userId}/direct-grants?accessSystemId=12`),
    userManagerFetch(`/UserManager/api/v1/HealanRoleManagement/users/${userId}/direct-denies?accessSystemId=12`)
  ]);
  if(!grantResponse.ok||!denyResponse.ok)throw new Error("دریافت دسترسی مستقیم انجام نشد.");
  const grants=await grantResponse.json() as {accessMenuIds:number[]};
  const denies=await denyResponse.json() as {accessMenuIds:number[]};
  return {grants:grants.accessMenuIds,denies:denies.accessMenuIds};
}

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
  directoryPartyId?: string;
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
  statusDefinitionId?: string;
  statusName?: string;
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
  baseDocumentProfileId?: string;
  internalOwnerUserId?: string;
  parties: ContractParty[];
  createdAtUtc: string;
};

export type ContractStatusDefinition = {
  id:string; name:string; order:number; color:string; isActive:boolean;
};
export type ContractBaseDocument = {
  id:string; documentId:string; name:string; documentTitle:string;
  description?:string; isActive:boolean;
};
export type OrganizationParty = {
  id:string; name:string; nationalIdentifier?:string; representativeName?:string;
  contactInfo?:string; isActive:boolean;
};

export async function listContractCatalog<T>(kind:"statuses"|"base-documents"|"parties"):Promise<T[]> {
  const response=await authorizedFetch(`/api/contracts/catalog/${kind}`);
  if(!response.ok) throw new Error("دریافت اطلاعات پایه قرارداد انجام نشد");
  return response.json();
}
export async function saveContractCatalog<T>(kind:"statuses"|"base-documents"|"parties",input:object,id?:string):Promise<T>{
  const response=await authorizedFetch(`/api/contracts/catalog/${kind}${id?`/${id}`:""}`,{
    method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)
  });
  if(!response.ok) throw new Error(await response.text()||"ثبت اطلاعات پایه انجام نشد");
  return response.json();
}
export async function deleteContractCatalog(kind:"statuses"|"base-documents"|"parties",id:string){
  const response=await authorizedFetch(`/api/contracts/catalog/${kind}/${id}`,{method:"DELETE"});
  if(!response.ok) throw new Error("حذف ممکن نیست؛ این گزینه احتمالاً در قرارداد استفاده شده است.");
}

export type ContractTemplate = {
  id: string; name: string; contractType: string; version: number;
  description?: string; isActive: boolean; createdAtUtc: string;
};

export type ContractGeneration = {
  id: string; contractId: string; baseDocumentVersionId: string;
  contractTemplateId: string; userInstruction: string; changeSetJson: string;
  sourceSnapshotJson: string; calculationSnapshotJson: string; diffJson: string;
  clarificationQuestionsJson?: string; status: number; modelId: string;
  promptVersion: string; generatedDocxFileId?: string; generatedPdfFileId?: string;
  createdByUserId: string; reviewedByUserId?: string; reviewComment?: string;
  createdAtUtc: string; reviewedAtUtc?: string;
};

export async function listContractTemplates(): Promise<ContractTemplate[]> {
  const response = await authorizedFetch("/api/contracts/templates");
  if (!response.ok) throw new Error("دریافت قالب‌های قرارداد انجام نشد");
  return response.json();
}

export async function uploadContractTemplate(input: {
  name: string; contractType: string; description?: string; file: File;
}): Promise<ContractTemplate> {
  const form = new FormData();
  form.append("name", input.name); form.append("contractType", input.contractType);
  if (input.description) form.append("description", input.description);
  form.append("file", input.file);
  const response = await authorizedFetch("/api/contracts/templates", {method:"POST", body:form});
  if (!response.ok) throw new Error(await response.text() || "ثبت قالب انجام نشد");
  return response.json();
}

export async function generateContract(input: {
  contractId: string; contractTemplateId: string; userInstruction: string;
  sourceDocumentIds: string[];
}): Promise<ContractGeneration> {
  const response = await authorizedFetch("/api/contracts/generations", {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await response.text() || "تولید قرارداد انجام نشد");
  return response.json();
}

export async function reviewContractGeneration(id:string, approved:boolean, comment?:string) {
  const response = await authorizedFetch(`/api/contracts/generations/${id}/review`, {
    method:"PUT", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({approved,comment})
  });
  if (!response.ok) throw new Error(await response.text() || "ثبت تصمیم انجام نشد");
  return response.json() as Promise<ContractGeneration>;
}

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

export type DocumentGroup = {
  id: string; name: string; description?: string; isActive: boolean;
  documentIds: string[]; createdAtUtc: string;
};

export type RuleSet = {
  id: string; name: string; version: number; documentGroupId?: string;
  effectiveFromUtc: string; effectiveToUtc?: string; isActive: boolean;
  rules: Array<{
    id: string; code: string; title: string; instruction: string;
    severity: number; order: number; isActive: boolean;
    parameters: Array<{id: string; key: string; valueJson: string}>;
  }>;
};

export type ComparisonFinding = {
  id: string; type: number; severity: number; title: string; reason: string;
  targetEvidence?: string; targetPage?: number; targetSection?: string;
  referenceEvidence?: string; referencePage?: number; suggestion?: string;
  confidence: number; reviewDecision: number; reviewerComment?: string;
  correctedReason?: string;
};

export type ComparisonRunSummary = {
  id: string; targetDocumentId: string; targetDocumentTitle: string;
  basisMode: number; status: number; outcome?: number; scorePercent?: number;
  findingCount: number; pendingReviewCount: number; createdAtUtc: string;
};

export type ComparisonRun = ComparisonRunSummary & {
  targetVersionId: string; documentGroupId?: string; referenceDocumentId?: string;
  referenceVersionId?: string; userInstruction?: string; ruleSetSnapshotJson: string;
  sourceSnapshotJson: string; modelId: string; promptVersion: string;
  failureReason?: string; createdByUserId: string; completedAtUtc?: string;
  findings: ComparisonFinding[];
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

async function authorizedFetch(path: string, init: RequestInit = {}) {
  const token = accessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, {...init, headers});
}

export async function listDocumentGroups(): Promise<DocumentGroup[]> {
  const response = await authorizedFetch("/api/knowledge/document-groups");
  if (!response.ok) throw new Error("دریافت گروه‌های اسناد انجام نشد");
  return response.json();
}

export async function createDocumentGroup(input: {
  name: string; description?: string; documentIds: string[];
}): Promise<DocumentGroup> {
  const response = await authorizedFetch("/api/knowledge/document-groups", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await response.text() || "ثبت گروه انجام نشد");
  return response.json();
}

export async function listRuleSets(documentGroupId = ""): Promise<RuleSet[]> {
  const query = documentGroupId
    ? `?documentGroupId=${encodeURIComponent(documentGroupId)}` : "";
  const response = await authorizedFetch(`/api/knowledge/rule-sets${query}`);
  if (!response.ok) throw new Error("دریافت مجموعه قواعد انجام نشد");
  return response.json();
}

export async function createRuleSet(input: {
  name: string; documentGroupId?: string; effectiveFromUtc?: string;
  rules: Array<{code: string; title: string; instruction: string; severity: number;
    order: number; parameters: Array<{key: string; valueJson: string}>}>;
}): Promise<RuleSet> {
  const response = await authorizedFetch("/api/knowledge/rule-sets", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({...input, effectiveToUtc: null})
  });
  if (!response.ok) throw new Error(await response.text() || "ثبت مجموعه قواعد انجام نشد");
  return response.json();
}

export async function listComparisonRuns(): Promise<ComparisonRunSummary[]> {
  const response = await authorizedFetch("/api/comparisons");
  if (!response.ok) throw new Error("دریافت تاریخچه تطابق انجام نشد");
  return response.json();
}

export async function getComparisonRun(id: string): Promise<ComparisonRun> {
  const response = await authorizedFetch(`/api/comparisons/${id}`);
  if (!response.ok) throw new Error("دریافت نتیجه تطابق انجام نشد");
  return response.json();
}

export async function startComparison(input: {
  targetDocumentId: string; basisMode: number; documentGroupId?: string;
  ruleSetIds: string[]; referenceDocumentId?: string; userInstruction?: string;
}): Promise<ComparisonRun> {
  const response = await authorizedFetch("/api/comparisons", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({...input, targetVersionId: null, referenceVersionId: null})
  });
  if (!response.ok) throw new Error(await response.text() || "اجرای تطابق انجام نشد");
  return response.json();
}

export async function reviewFinding(id: string, input: {
  decision: number; comment?: string; correctedReason?: string;
}): Promise<ComparisonFinding> {
  const response = await authorizedFetch(`/api/comparisons/findings/${id}/review`, {
    method: "PUT", headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await response.text() || "ثبت نظر کارشناس انجام نشد");
  return response.json();
}

export async function downloadComparisonReport(id: string, format: "docx"|"pdf") {
  const response = await authorizedFetch(`/api/comparisons/${id}/report.${format}`);
  if (!response.ok) throw new Error("تولید گزارش انجام نشد");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await response.blob());
  link.download = `comparison-${id}.${format}`;
  link.click();
  URL.revokeObjectURL(link.href);
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
  baseDocumentProfileId?: string;
  contractNumber?: string;
  subject: string;
  status: number;
  statusDefinitionId?: string;
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
