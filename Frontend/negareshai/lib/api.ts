import { getFreshAccessToken, redirectToSignin } from "./auth";

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
export async function listIdentityUsers(includeDeleted=false):Promise<IdentityUser[]> {
  const response=await userManagerFetch(`${identityManagementPath}/users?includeDeleted=${includeDeleted}`);
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
export async function updateIdentityRole(id:string,input:{name:string;displayName:string}) {
  const response=await userManagerFetch(`${identityManagementPath}/roles/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
  if(!response.ok)throw new Error(await response.text()||"Role update failed.");
}
export async function deleteIdentityRole(id:string) {
  const response=await userManagerFetch(`${identityManagementPath}/roles/${id}`,{method:"DELETE"});
  if(!response.ok)throw new Error(await response.text()||"Role deletion failed.");
}
export async function restoreIdentityRole(id:string) {
  const response=await userManagerFetch(`${identityManagementPath}/roles/${id}/restore`,{method:"POST"});
  if(!response.ok)throw new Error(await response.text()||"Role restore failed.");
}
export async function createIdentityUser(input:{userName:string;firstName:string;lastName:string;email?:string;phoneNumber?:string;password:string;isActive:boolean;roleIds:string[]}) {
  const response=await userManagerFetch(`${identityManagementPath}/users`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
  if(!response.ok)throw new Error(await response.text()||"ثبت کاربر انجام نشد.");
}
export async function updateIdentityUser(id:string,input:{userName:string;firstName:string;lastName:string;email?:string;phoneNumber?:string;password?:string;isActive:boolean;roleIds:string[]}) {
  const response=await userManagerFetch(`${identityManagementPath}/users/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
  if(!response.ok)throw new Error(await response.text()||"User update failed.");
}
export async function deleteIdentityUser(id:string) {
  const response=await userManagerFetch(`${identityManagementPath}/users/${id}`,{method:"DELETE"});
  if(!response.ok)throw new Error(await response.text()||"User deletion failed.");
}
export async function restoreIdentityUser(id:string) {
  const response=await userManagerFetch(`${identityManagementPath}/users/${id}/restore`,{method:"POST"});
  if(!response.ok)throw new Error(await response.text()||"User restore failed.");
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
  primaryContractGroupId?: string;
  contractGroupIds: string[];
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
  contactInfo?:string; address?:string; isActive:boolean;
};
export type OrganizationProfile = {
  id:string;
  name:string;
  chiefExecutiveName?:string;
  chiefExecutiveFatherName?:string;
  chiefExecutiveNationalId?:string;
  nationalIdentifier?:string;
  economicCode?:string;
  registrationNumber?:string;
  address?:string;
  postalCode?:string;
  phone?:string;
  fax?:string;
  email?:string;
  website?:string;
  updatedAtUtc?:string;
};
export type SaveOrganizationProfile = {
  name:string;
  chiefExecutiveName:string;
  chiefExecutiveFatherName:string;
  chiefExecutiveNationalId:string;
  nationalIdentifier:string;
  economicCode:string;
  registrationNumber:string;
  address:string;
  postalCode:string;
  phone:string;
  fax:string;
  email:string;
  website:string;
};
export async function getOrganizationProfile():Promise<OrganizationProfile>{
  const response=await authorizedFetch("/api/master-data/organization-profile");
  if(!response.ok) throw new Error("دریافت اطلاعات شرکت انجام نشد.");
  return response.json();
}
export async function saveOrganizationProfile(input:SaveOrganizationProfile):Promise<OrganizationProfile>{
  const response=await authorizedFetch("/api/master-data/organization-profile",{
    method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)
  });
  if(!response.ok) throw new Error(await response.text()||"ذخیره اطلاعات شرکت انجام نشد.");
  return response.json();
}
export type ContractGroup = { id:string; name:string; description?:string; isActive:boolean; };
export type ContractYear={id:string;year:number;isActive:boolean};
export type ContractCatalogKind = "statuses"|"base-documents"|"parties"|"groups"|"years";
export type ComplianceCriterion={id:string;code:string;title:string;description?:string;defaultWeight:number;isCriticalByDefault:boolean;isActive:boolean};
export async function listCriteria(pageNumber=1,pageSize=20):Promise<PagedResponse<ComplianceCriterion>>{const r=await authorizedFetch(`/api/master-data/criteria?pageNumber=${pageNumber}&pageSize=${pageSize}`);if(!r.ok)throw new Error("دریافت معیارها انجام نشد.");return r.json();}
export async function saveCriterion(input:Omit<ComplianceCriterion,"id">,id?:string){const r=await authorizedFetch(`/api/master-data/criteria${id?`/${id}`:""}`,{method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});if(!r.ok)throw new Error(await r.text()||"ذخیره معیار انجام نشد.");return r.json() as Promise<ComplianceCriterion>;}
export async function deleteCriterion(id:string){const r=await authorizedFetch(`/api/master-data/criteria/${id}`,{method:"DELETE"});if(!r.ok)throw new Error("حذف معیار انجام نشد.");}
export type GoldenDocument={id:string;documentGroupId:string;documentId:string;documentTitle:string;priority:number;isActive:boolean};
export async function listGoldenDocuments(groupId?:string){const r=await authorizedFetch(`/api/master-data/golden-documents?${groupId?`documentGroupId=${groupId}&`:""}pageNumber=1&pageSize=100`);if(!r.ok)throw new Error("دریافت اسناد طلایی انجام نشد.");return r.json() as Promise<PagedResponse<GoldenDocument>>;}
export async function saveGoldenDocument(input:{documentGroupId:string;documentId:string;priority:number;isActive:boolean},id?:string){const r=await authorizedFetch(`/api/master-data/golden-documents${id?`/${id}`:""}`,{method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});if(!r.ok)throw new Error("ذخیره سند طلایی انجام نشد.");return r.json() as Promise<GoldenDocument>;}
export async function deleteGoldenDocument(id:string){const r=await authorizedFetch(`/api/master-data/golden-documents/${id}`,{method:"DELETE"});if(!r.ok)throw new Error("حذف سند طلایی انجام نشد.");}
export type ApprovedContractClause={id:string;contractGroupId:string;groupName:string;code:string;title:string;text:string;order:number;isRequired:boolean;isActive:boolean};
export async function listApprovedContractClauses(contractGroupId?:string,pageNumber=1,pageSize=20):Promise<PagedResponse<ApprovedContractClause>>{const q=new URLSearchParams({pageNumber:String(pageNumber),pageSize:String(pageSize)});if(contractGroupId)q.set("contractGroupId",contractGroupId);const r=await authorizedFetch(`/api/master-data/approved-contract-clauses?${q}`);if(!r.ok)throw new Error("دریافت بندهای قرارداد انجام نشد.");return r.json();}
export async function saveApprovedContractClause(input:{contractGroupId:string;code:string;title:string;text:string;order:number;isRequired:boolean;isActive:boolean},id?:string):Promise<ApprovedContractClause>{const r=await authorizedFetch(`/api/master-data/approved-contract-clauses${id?`/${id}`:""}`,{method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});if(!r.ok)throw new Error(await r.text()||"ذخیره بند قرارداد انجام نشد.");return r.json();}
export async function deleteApprovedContractClause(id:string){const r=await authorizedFetch(`/api/master-data/approved-contract-clauses/${id}`,{method:"DELETE"});if(!r.ok)throw new Error("حذف بند قرارداد انجام نشد.");}
export async function restoreApprovedContractClause(id:string){const r=await authorizedFetch(`/api/master-data/approved-contract-clauses/${id}/restore`,{method:"POST"});if(!r.ok)throw new Error("بازیابی بند قرارداد انجام نشد.");}
export type DocumentGroupCriterion={id:string;complianceCriterionId:string;code:string;title:string;weight:number;isCritical:boolean;order:number};
export async function getDocumentGroupCriteria(id:string){const r=await authorizedFetch(`/api/master-data/document-groups/${id}/criteria`);if(!r.ok)throw new Error("دریافت معیارهای گروه انجام نشد.");return r.json() as Promise<DocumentGroupCriterion[]>;}
export async function saveDocumentGroupCriteria(id:string,items:Array<{complianceCriterionId:string;weight:number;isCritical:boolean;order:number}>){const r=await authorizedFetch(`/api/master-data/document-groups/${id}/criteria`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({items})});if(!r.ok)throw new Error("ذخیره معیارهای گروه انجام نشد.");}

export async function listContractCatalog<T>(kind:ContractCatalogKind,pageNumber=1,pageSize=20):Promise<PagedResponse<T>> {
  const response=await authorizedFetch(`/api/contracts/catalog/${kind}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  if(!response.ok) throw new Error("دریافت اطلاعات پایه قرارداد انجام نشد");
  return (await response.json()) as PagedResponse<T>;
}
export async function saveContractCatalog<T>(kind:ContractCatalogKind,input:object,id?:string):Promise<T>{
  const response=await authorizedFetch(`/api/contracts/catalog/${kind}${id?`/${id}`:""}`,{
    method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)
  });
  if(!response.ok) throw new Error(await response.text()||"ثبت اطلاعات پایه انجام نشد");
  return response.json();
}
export async function deleteContractCatalog(kind:ContractCatalogKind,id:string){
  const response=await authorizedFetch(`/api/contracts/catalog/${kind}/${id}`,{method:"DELETE"});
  if(!response.ok) throw new Error("حذف ممکن نیست؛ این گزینه احتمالاً در قرارداد استفاده شده است.");
}

export type ContractTemplate = {
  id: string; name: string; contractType: string; version: number;
  description?: string; isActive: boolean; createdAtUtc: string;
  contractGroupId?:string; contractYear?:number; effectiveFrom?:string; effectiveTo?:string;
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
  return ((await response.json()) as PagedResponse<ContractTemplate>).items;
}

export async function uploadContractTemplate(input: {
  name: string; contractType: string; description?: string; file: File;
  contractGroupId?:string;contractYear?:number;effectiveFrom?:string;effectiveTo?:string;
}): Promise<ContractTemplate> {
  const form = new FormData();
  form.append("name", input.name); form.append("contractType", input.contractType);
  if (input.description) form.append("description", input.description);
  if(input.contractGroupId)form.append("contractGroupId",input.contractGroupId);
  if(input.contractYear)form.append("contractYear",String(input.contractYear));
  if(input.effectiveFrom)form.append("effectiveFrom",input.effectiveFrom);
  if(input.effectiveTo)form.append("effectiveTo",input.effectiveTo);
  form.append("file", input.file);
  const response = await authorizedFetch("/api/contracts/templates", {method:"POST", body:form});
  if (!response.ok) throw new Error(await response.text() || "ثبت قالب انجام نشد");
  return response.json();
}
export async function getEffectiveContractTemplate(contractGroupId:string,startDate:string){const r=await authorizedFetch(`/api/contracts/templates/effective?contractGroupId=${contractGroupId}&startDate=${startDate}`);if(!r.ok)throw new Error("دریافت قالب مؤثر انجام نشد.");return r.json() as Promise<{template?:ContractTemplate;reason?:string}>;}
export async function updateContractTemplate(id:string,input:{name:string;contractType:string;description?:string;contractGroupId?:string;contractYear?:number;effectiveFrom?:string;effectiveTo?:string;isActive:boolean}){const r=await authorizedFetch(`/api/contracts/templates/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});if(!r.ok)throw new Error("ویرایش قالب انجام نشد.");return r.json() as Promise<ContractTemplate>;}
export async function deleteContractTemplate(id:string){const r=await authorizedFetch(`/api/contracts/templates/${id}`,{method:"DELETE"});if(!r.ok)throw new Error("حذف قالب انجام نشد.");}

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
  lifecycleStatus: number;
  extractedText?: string;
  extractedFieldsJson?: string;
  extractionMetadataJson?: string;
  expertReviewedByUserId?: string;
  expertReviewedAtUtc?: string;
  expertReviewNote?: string;
  managerReviewedByUserId?: string;
  managerReviewedAtUtc?: string;
  managerReviewNote?: string;
  isRagPublished: boolean;
  ragPublishedAtUtc?: string;
  files: Array<{
    id:string; fileId:string; fileName:string; contentType:string;
    sortOrder:number; pageNumber?:number; sha256:string; size:number;
  }>;
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
  passingThreshold: number; documentIds: string[]; createdAtUtc: string;
};

export type DataScopeRow = {
  id: string; resourceType: number; resourceId: string; subjectType: number;
  subjectId: string; isDenied: boolean; createdByUserId: string;
  createdAtUtc: string; updatedByUserId?: string; updatedAtUtc?: string;
};

export type PagedResponse<T> = {
  items: T[]; pageNumber: number; pageSize: number; totalCount: number;
  totalPages: number; hasPreviousPage: boolean; hasNextPage: boolean;
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
  id: string; ruleId?: string; complianceCriterionId?: string;
  type: number; severity: number; weight: number; isCritical: boolean;
  isApplicable: boolean; isPassed: boolean; title: string; reason: string;
  targetEvidence?: string; targetPage?: number; targetSection?: string;
  referenceEvidence?: string; referencePage?: number; referenceSection?: string;
  referenceDocumentId?: string; referenceVersionId?: string; suggestion?: string;
  confidence: number; reviewDecision: number; reviewerComment?: string;
  correctedReason?: string;
};

export type ComparisonRunSummary = {
  id: string; targetDocumentId: string; targetDocumentTitle: string;
  basisMode: number; status: number; outcome?: number; scorePercent?: number;
  hasCriticalFailure: boolean; approvalStatus: number;
  findingCount: number; pendingReviewCount: number; createdAtUtc: string;
};

export type ComparisonRun = ComparisonRunSummary & {
  targetVersionId: string; documentGroupId?: string; referenceDocumentId?: string;
  referenceVersionId?: string; userInstruction?: string; ruleSetSnapshotJson: string;
  criterionSnapshotJson: string; sourceSnapshotJson: string; toolTraceJson: string;
  modelId: string; promptVersion: string; passingThreshold: number;
  outcomeExplanation?: string; expertReviewedByUserId?: string;
  expertReviewedAtUtc?: string; expertReviewNote?: string;
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
  return ((await response.json()) as PagedResponse<RuntimeSetting>).items;
}

async function authorizedFetch(path: string, init: RequestInit = {}) {
  const send = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, {...init, headers});
  };

  const token = await getFreshAccessToken().catch(() => accessToken());
  let response = await send(token);
  if (response.status !== 401) return response;

  const renewedToken = await getFreshAccessToken(true);
  if (renewedToken) {
    response = await send(renewedToken);
    if (response.status !== 401) return response;
  }

  await redirectToSignin();
  throw new Error("نشست ورود شما منقضی شده است؛ در حال انتقال به صفحه ورود...");
}

export async function listDataScopes(input: {
  resourceType: number; subjectType: number; subjectId: string;
  pageNumber?: number; pageSize?: number;
}): Promise<PagedResponse<DataScopeRow>> {
  const query = new URLSearchParams({
    resourceType: String(input.resourceType),
    subjectType: String(input.subjectType),
    subjectId: input.subjectId,
    pageNumber: String(input.pageNumber ?? 1),
    pageSize: String(input.pageSize ?? 100)
  });
  const response = await authorizedFetch(`/api/access/data-scopes?${query}`);
  if (!response.ok) throw new Error("دریافت محدوده دسترسی انجام نشد.");
  return response.json();
}

export async function saveDataScopes(input: {
  resourceType: number; subjectType: number; subjectId: string;
  grantedResourceIds: string[]; deniedResourceIds: string[];
}) {
  const response = await authorizedFetch("/api/access/data-scopes", {
    method: "PUT", headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await response.text() || "ثبت محدوده دسترسی انجام نشد.");
}

export async function listDocumentGroups(): Promise<DocumentGroup[]> {
  const response = await authorizedFetch("/api/knowledge/document-groups");
  if (!response.ok) throw new Error("دریافت گروه‌های اسناد انجام نشد");
  return ((await response.json()) as PagedResponse<DocumentGroup>).items;
}

export async function createDocumentGroup(input: {
  name: string; description?: string; documentIds: string[]; passingThreshold?: number;
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
  return ((await response.json()) as PagedResponse<RuleSet>).items;
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

export type ContractConversationListItem = {
  id:string; title:string; partyName:string; groupName:string; contractYear:number;
  status:number; draftCount:number; updatedAtUtc:string;
};
export type ContractConversationMessage = {
  id:string; sequence:number; role:number; content:string; sourceSnapshotJson?:string; createdAtUtc:string;
};
export type ContractClarification = {id:string;key:string;question:string;answer?:string;isAnswered:boolean};
export type ContractDraftVersion = {
  id:string;versionNumber:number;baseContractId?:string;baseDocumentVersionId?:string;
  contractTemplateId:string;instructionSnapshot:string;changeSetJson:string;sourceSnapshotJson:string;
  calculationSnapshotJson:string;diffJson:string;conflictAnalysisJson:string;generatedDocxFileId:string;generatedPdfFileId?:string;
  approvalStatus:number;finalDocumentVersionId?:string;createdAtUtc:string;
};
export type ContractConversation = {
  id:string;title:string;organizationPartyId:string;partyName:string;primaryContractGroupId:string;
  groupName:string;contractYear:number;subject:string;baseContractId?:string;status:number;
  messages:ContractConversationMessage[];clarifications:ContractClarification[];
  drafts:ContractDraftVersion[];updatedAtUtc:string;
};
export async function listContractConversations():Promise<ContractConversationListItem[]> {
  const r=await authorizedFetch("/api/contracts/conversations");if(!r.ok)throw new Error("دریافت گفت‌وگوهای قرارداد انجام نشد.");return r.json();
}
export async function startContractConversation(input:{message:string;organizationPartyId?:string;primaryContractGroupId?:string;contractYear?:number;subject?:string;additionalSourceContractIds?:string[]}):Promise<ContractConversation>{
  const r=await authorizedFetch("/api/contracts/conversations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});if(!r.ok)throw new Error(await r.text()||"شروع گفت‌وگو انجام نشد.");return r.json();
}
export async function getContractConversation(id:string):Promise<ContractConversation>{const r=await authorizedFetch(`/api/contracts/conversations/${id}`);if(!r.ok)throw new Error("گفت‌وگو یافت نشد.");return r.json();}
export type ContractSourceOption={contractId:string;documentId:string;subject:string;contractNumber?:string;partyName:string;primaryContractGroupId:string;groupName:string;contractYear?:number;finalVersionId:string};
export async function listContractSourceOptions():Promise<ContractSourceOption[]>{const r=await authorizedFetch("/api/contracts/conversations/source-options");if(!r.ok)throw new Error("دریافت منابع قابل انتخاب انجام نشد.");return r.json();}
export async function sendContractConversationMessage(id:string,message:string):Promise<ContractConversation>{const r=await authorizedFetch(`/api/contracts/conversations/${id}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message})});if(!r.ok)throw new Error(await r.text()||"ارسال پیام انجام نشد.");return r.json();}
export async function reviewContractDraft(conversationId:string,draftId:string,stage:"requester"|"expert"|"manager",approved:boolean,note?:string):Promise<ContractConversation>{const r=await authorizedFetch(`/api/contracts/conversations/${conversationId}/drafts/${draftId}/${stage}-review`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({approved,note})});if(!r.ok){if(r.status===403)throw new Error(stage==="expert"?"شما دسترسی بررسی کارشناس قرارداد را ندارید.":stage==="manager"?"شما دسترسی نهایی‌سازی قرارداد را ندارید.":"شما دسترسی ثبت این تصمیم را ندارید.");if(r.status===409)throw new Error("این پیش‌نویس قبلاً بررسی شده است؛ صفحه را تازه‌سازی کنید.");throw new Error(stage==="manager"?"نهایی‌سازی سند انجام نشد؛ سرویس پردازش سند را بررسی و دوباره تلاش کنید.":"ثبت تصمیم انجام نشد.");}return r.json();}
export async function downloadContractDraftFile(conversationId:string,draftId:string,format:"docx"|"pdf"):Promise<Blob>{const r=await authorizedFetch(`/api/contracts/conversations/${conversationId}/drafts/${draftId}/download/${format}`);if(!r.ok)throw new Error("دریافت خروجی پیش‌نویس انجام نشد.");return r.blob();}
export async function updateDocumentGroup(id:string,input:{name:string;description?:string;isActive:boolean;documentIds:string[];passingThreshold?:number}){const r=await authorizedFetch(`/api/knowledge/document-groups/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});if(!r.ok)throw new Error("ویرایش گروه سند انجام نشد.");return r.json() as Promise<DocumentGroup>;}
export async function deleteDocumentGroup(id:string){const r=await authorizedFetch(`/api/knowledge/document-groups/${id}`,{method:"DELETE"});if(!r.ok)throw new Error("حذف گروه سند انجام نشد.");}
export async function setRuleSetActive(id:string,isActive:boolean){const r=await authorizedFetch(`/api/knowledge/rule-sets/${id}/active?isActive=${isActive}`,{method:"PUT"});if(!r.ok)throw new Error("تغییر وضعیت RuleSet انجام نشد.");}
export async function deleteRuleSet(id:string){const r=await authorizedFetch(`/api/knowledge/rule-sets/${id}`,{method:"DELETE"});if(!r.ok)throw new Error("حذف RuleSet انجام نشد.");}

export async function listComparisonRuns(): Promise<ComparisonRunSummary[]> {
  const response = await authorizedFetch("/api/comparisons");
  if (!response.ok) throw new Error("دریافت تاریخچه تطابق انجام نشد");
  return ((await response.json()) as PagedResponse<ComparisonRunSummary>).items;
}

export async function getComparisonRun(id: string): Promise<ComparisonRun> {
  const response = await authorizedFetch(`/api/comparisons/${id}`);
  if (!response.ok) throw new Error("دریافت نتیجه تطابق انجام نشد");
  return response.json();
}

export async function listComparisonApprovedReferenceDocumentIds(documentGroupId:string):Promise<string[]>{
  const response=await authorizedFetch(`/api/comparisons/approved-reference-document-ids?documentGroupId=${encodeURIComponent(documentGroupId)}`);
  if(!response.ok)throw new Error("دریافت اسناد مرجع گروه انجام نشد");
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
  persistForDocumentGroup?: boolean;
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
  contractGroupIds?:string[];
  primaryContractGroupId?:string;
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
  return ((await response.json()) as PagedResponse<DocumentListItem>).items;
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

export async function reviewComparison(id:string,input:{approved:boolean;note?:string}):Promise<ComparisonRun>{
  const response=await authorizedFetch(`/api/comparisons/${id}/expert-review`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
  if(!response.ok)throw new Error(await response.text()||"ثبت تأیید نتیجه انطباق انجام نشد");
  return response.json();
}

export async function uploadDocumentBatch(input:{
  files:File[]; pageNumbers?:number[]; title?:string;
  documentType?:string; confidentialityLevel?:number; documentGroupIds:string[];
}):Promise<DocumentDetail>{
  const form=new FormData();
  input.files.forEach(file=>form.append("files",file));
  input.pageNumbers?.forEach(page=>form.append("pageNumbers",String(page)));
  input.documentGroupIds.forEach(id=>form.append("documentGroupIds",id));
  if(input.title)form.append("title",input.title);
  form.append("documentType",input.documentType??"contract");
  form.append("confidentialityLevel",String(input.confidentialityLevel??2));
  const response=await authorizedFetch("/api/documents/upload-batch",{method:"POST",body:form});
  if(!response.ok)throw new Error(await response.text()||"بارگذاری و استخراج سند انجام نشد.");
  return response.json();
}

export async function saveExtractedDocumentFields(documentId:string,versionId:string,value:string){
  const response=await authorizedFetch(`/api/documents/${documentId}/versions/${versionId}/extracted-fields`,{
    method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({extractedFieldsJson:value})});
  if(!response.ok)throw new Error(await response.text()||"ذخیره اطلاعات استخراج‌شده انجام نشد.");
  return response.json() as Promise<DocumentDetail>;
}

async function reviewDocumentVersion(documentId:string,versionId:string,stage:"expert"|"manager",approved:boolean,note?:string){
  const response=await authorizedFetch(`/api/documents/${documentId}/versions/${versionId}/${stage}-review`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({approved,note})});
  if(!response.ok)throw new Error(await response.text()||"ثبت تصمیم بازبینی انجام نشد.");
  return response.json() as Promise<DocumentDetail>;
}
export const expertReviewDocumentVersion=(documentId:string,versionId:string,approved:boolean,note?:string)=>
  reviewDocumentVersion(documentId,versionId,"expert",approved,note);
export const managerReviewDocumentVersion=(documentId:string,versionId:string,approved:boolean,note?:string)=>
  reviewDocumentVersion(documentId,versionId,"manager",approved,note);

export function setAccessToken(token: string) {
  window.localStorage.setItem("negareshai.access_token", token);
}

export function clearAccessToken() {
  window.localStorage.removeItem("negareshai.access_token");
}

export type WorkflowStageDefinition={type:number;title:string;order:number;defaultAssignedUserId?:string};
export type WorkflowDefinition={id:string;definitionKey:string;name:string;contractGroupId?:string;version:number;isActive:boolean;stages:WorkflowStageDefinition[];createdAtUtc:string};
export type WorkflowStage={id:string;type:number;title:string;order:number;assignedUserId?:string;decision:number;comment?:string;decidedByUserId?:string;decidedAtUtc?:string;delegatedFromUserId?:string};
export type WorkflowAction={id:string;type:number;comment?:string;fromUserId?:string;toUserId?:string;performedByUserId:string;performedAtUtc:string};
export type ContractWorkflow={id:string;contractId:string;subject:string;contractGroupId?:string;status:number;currentStageOrder:number;createdAtUtc:string;stages:WorkflowStage[];actions:WorkflowAction[]};
export type RiskChecklistDefinitionItem={code:string;title:string;weight:number;isCritical:boolean};
export type RiskChecklistDefinition={id:string;definitionKey:string;name:string;contractGroupId?:string;version:number;isActive:boolean;items:RiskChecklistDefinitionItem[];createdAtUtc:string};
export type RiskChecklistItem=RiskChecklistDefinitionItem&{score:number;note?:string};
export type RiskAssessment={id:string;contractId:string;subject:string;checklistDefinitionId?:string;checklistDefinitionVersion?:number;version:number;score:number;level:number;summary?:string;items:RiskChecklistItem[];createdByUserId:string;createdAtUtc:string};
export type ContractOperation={id:string;contractId:string;subject:string;type:number;title:string;dueDate:string;amount?:number;currency:string;status:number;reminderDaysBefore:number;description?:string;assignedUserId?:string;completedByUserId?:string;completedAtUtc?:string};
export type ManagementDashboard={activeContracts:number;pendingApprovals:number;myPendingTasks:number;overdueOperations:number;upcomingOperations:number;highRisks:number;upcoming:ContractOperation[]};
export type ReminderRunResult={asOf:string;markedOverdue:number;upcomingQueued:number;overdueQueued:number;existingSkipped:number};

async function operationsRequest<T>(path:string,init?:RequestInit):Promise<T>{
  const token=accessToken();
  const response=await fetch(`${API_BASE}/api/contract-operations${path}`,{...init,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{ }),...(init?.headers??{})}});
  if(!response.ok)throw new Error(await response.text()||"عملیات قرارداد انجام نشد");
  return response.status===204?undefined as T:response.json();
}
export const listWorkflowDefinitions=(pageNumber=1,pageSize=20,archived=false)=>operationsRequest<PagedResponse<WorkflowDefinition>>(`/workflow-definitions?pageNumber=${pageNumber}&pageSize=${pageSize}&archived=${archived}`);
export const saveWorkflowDefinition=(input:{name:string;contractGroupId?:string;stages:WorkflowStageDefinition[];isActive?:boolean},id?:string)=>operationsRequest<WorkflowDefinition>(id?`/workflow-definitions/${id}`:"/workflow-definitions",{method:id?"PUT":"POST",body:JSON.stringify(input)});
export const deleteWorkflowDefinition=(id:string)=>operationsRequest<void>(`/workflow-definitions/${id}`,{method:"DELETE"});
export const restoreWorkflowDefinition=(id:string)=>operationsRequest<void>(`/workflow-definitions/${id}/restore`,{method:"POST"});
export function listWorkflows():Promise<ContractWorkflow[]>;
export function listWorkflows(pageNumber:number,pageSize?:number,myWorklistOnly?:boolean,archived?:boolean):Promise<PagedResponse<ContractWorkflow>>;
export async function listWorkflows(pageNumber?:number,pageSize=20,myWorklistOnly=false,archived=false){
  const result=await operationsRequest<PagedResponse<ContractWorkflow>>(`/workflows?pageNumber=${pageNumber??1}&pageSize=${pageSize}&myWorklistOnly=${myWorklistOnly}&archived=${archived}`);
  return pageNumber===undefined?result.items:result;
}
export const startWorkflow=(input:{contractId:string;workflowDefinitionId?:string;legalUserId?:string;technicalUserId?:string;financialUserId?:string;expertUserId?:string;managerialUserId?:string;stageAssignments?:{type:number;assignedUserId?:string}[]})=>operationsRequest<ContractWorkflow>("/workflows",{method:"POST",body:JSON.stringify(input)});
export const decideWorkflow=(id:string,decision:number,comment?:string)=>operationsRequest<ContractWorkflow>(`/workflows/${id}/decision`,{method:"POST",body:JSON.stringify({decision,comment})});
export const commentWorkflow=(id:string,comment:string)=>operationsRequest<ContractWorkflow>(`/workflows/${id}/comments`,{method:"POST",body:JSON.stringify({comment})});
export const delegateWorkflow=(id:string,assignedUserId:string,comment?:string)=>operationsRequest<ContractWorkflow>(`/workflows/${id}/delegate`,{method:"POST",body:JSON.stringify({assignedUserId,comment})});
export const deleteWorkflow=(id:string)=>operationsRequest<void>(`/workflows/${id}`,{method:"DELETE"});
export const restoreWorkflow=(id:string)=>operationsRequest<void>(`/workflows/${id}/restore`,{method:"POST"});
export const listRiskChecklists=(pageNumber=1,pageSize=20,archived=false)=>operationsRequest<PagedResponse<RiskChecklistDefinition>>(`/risk-checklists?pageNumber=${pageNumber}&pageSize=${pageSize}&archived=${archived}`);
export const saveRiskChecklist=(input:{name:string;contractGroupId?:string;items:RiskChecklistDefinitionItem[];isActive?:boolean},id?:string)=>operationsRequest<RiskChecklistDefinition>(id?`/risk-checklists/${id}`:"/risk-checklists",{method:id?"PUT":"POST",body:JSON.stringify(input)});
export const deleteRiskChecklist=(id:string)=>operationsRequest<void>(`/risk-checklists/${id}`,{method:"DELETE"});
export const restoreRiskChecklist=(id:string)=>operationsRequest<void>(`/risk-checklists/${id}/restore`,{method:"POST"});
export const listRisks=(pageNumber=1,pageSize=20,archived=false,contractId?:string)=>operationsRequest<PagedResponse<RiskAssessment>>(`/risks?pageNumber=${pageNumber}&pageSize=${pageSize}&archived=${archived}${contractId?`&contractId=${contractId}`:""}`);
export function listOperations():Promise<ContractOperation[]>;
export function listOperations(pageNumber:number,pageSize?:number,archived?:boolean,mineOnly?:boolean,contractId?:string):Promise<PagedResponse<ContractOperation>>;
export async function listOperations(pageNumber?:number,pageSize=20,archived=false,mineOnly=false,contractId?:string){
  const result=await operationsRequest<PagedResponse<ContractOperation>>(`/items?pageNumber=${pageNumber??1}&pageSize=${pageSize}&archived=${archived}&mineOnly=${mineOnly}${contractId?`&contractId=${contractId}`:""}`);
  return pageNumber===undefined?result.items:result;
}
export type SaveOperationInput={contractId:string;type:number;title:string;dueDate:string;amount?:number;currency:string;reminderDaysBefore:number;description?:string;assignedUserId?:string};
export const createOperation=(input:SaveOperationInput)=>operationsRequest<ContractOperation>("/items",{method:"POST",body:JSON.stringify(input)});
export const updateOperation=(id:string,input:SaveOperationInput)=>operationsRequest<ContractOperation>(`/items/${id}`,{method:"PUT",body:JSON.stringify(input)});
export const changeOperationStatus=(id:string,status:number)=>operationsRequest<void>(`/items/${id}/status`,{method:"PUT",body:JSON.stringify({status})});
export const deleteOperation=(id:string)=>operationsRequest<void>(`/items/${id}`,{method:"DELETE"});
export const restoreOperation=(id:string)=>operationsRequest<void>(`/items/${id}/restore`,{method:"POST"});
export const assessContractRisk=(input:{contractId:string;summary?:string;checklistDefinitionId?:string;items:{code:string;title:string;weight:number;score:number;note?:string;isCritical?:boolean}[]})=>operationsRequest<RiskAssessment>(`/risks`,{method:"POST",body:JSON.stringify(input)});
export const deleteRisk=(id:string)=>operationsRequest<void>(`/risks/${id}`,{method:"DELETE"});
export const restoreRisk=(id:string)=>operationsRequest<void>(`/risks/${id}/restore`,{method:"POST"});
export const processOperationReminders=(asOf?:string)=>operationsRequest<ReminderRunResult>(`/reminders/process${asOf?`?asOf=${asOf}`:""}`,{method:"POST"});
export const getManagementDashboard=()=>operationsRequest<ManagementDashboard>("/dashboard");
export async function downloadContractOperationsReport(from?:string,to?:string){
  const token=accessToken();const query=new URLSearchParams();if(from)query.set("from",from);if(to)query.set("to",to);
  const response=await fetch(`${API_BASE}/api/contract-operations/reports.csv${query.size?`?${query}`:""}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
  if(!response.ok)throw new Error(await response.text()||"دریافت گزارش انجام نشد");
  const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="contract-operations.csv";link.click();URL.revokeObjectURL(url);
}
