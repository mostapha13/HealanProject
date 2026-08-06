"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  getOrganizationProfile,
  OrganizationProfile,
  saveOrganizationProfile,
  SaveOrganizationProfile,
} from "../../../lib/api";

const emptyProfile: SaveOrganizationProfile = {
  name: "",
  chiefExecutiveName: "",
  chiefExecutiveFatherName: "",
  chiefExecutiveNationalId: "",
  nationalIdentifier: "",
  economicCode: "",
  registrationNumber: "",
  address: "",
  postalCode: "",
  phone: "",
  fax: "",
  email: "",
  website: "",
};

const requiredFields: Array<keyof SaveOrganizationProfile> = [
  "name",
  "chiefExecutiveName",
  "chiefExecutiveFatherName",
  "chiefExecutiveNationalId",
  "nationalIdentifier",
  "economicCode",
  "address",
  "phone",
];

function toForm(profile: OrganizationProfile): SaveOrganizationProfile {
  return {
    name: profile.name || "",
    chiefExecutiveName: profile.chiefExecutiveName || "",
    chiefExecutiveFatherName: profile.chiefExecutiveFatherName || "",
    chiefExecutiveNationalId: profile.chiefExecutiveNationalId || "",
    nationalIdentifier: profile.nationalIdentifier || "",
    economicCode: profile.economicCode || "",
    registrationNumber: profile.registrationNumber || "",
    address: profile.address || "",
    postalCode: profile.postalCode || "",
    phone: profile.phone || "",
    fax: profile.fax || "",
    email: profile.email || "",
    website: profile.website || "",
  };
}

export default function OrganizationProfilePage() {
  const [form, setForm] = useState<SaveOrganizationProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    void getOrganizationProfile()
      .then((profile) => {
        const loaded = toForm(profile);
        const complete = requiredFields.every((field) => Boolean(loaded[field]?.trim()));
        setForm(loaded);
        setSaved(complete);
        setEditing(!complete);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "دریافت اطلاعات شرکت انجام نشد."))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof SaveOrganizationProfile>(key: K, value: SaveOrganizationProfile[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setMessage("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const result = await saveOrganizationProfile(form);
      setForm(toForm(result));
      setSaved(true);
      setEditing(false);
      setMessage("اطلاعات شرکت ذخیره شد و از این پس در قراردادها استفاده می‌شود.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ذخیره اطلاعات شرکت انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell" dir="rtl">
      <section className="page-content organization-profile-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">داده‌های پایه قرارداد</p>
            <h1>اطلاعات شرکت ما</h1>
            <p>
              این اطلاعات، طرف اول همه قراردادهای تولیدشده است. دستیار برای اطلاعات شرکت شما
              فقط از همین فرم استفاده می‌کند و چیزی را از متن درخواست حدس نمی‌زند.
            </p>
          </div>
          <Link className="ghost-button" href="/basic-data">بازگشت به داده‌های پایه</Link>
        </header>

        <div className={`profile-source-note ${saved ? "is-complete" : ""}`}>
          <strong>{saved ? "پروفایل شرکت آماده استفاده است" : "پروفایل شرکت را یک‌بار کامل کنید"}</strong>
          <span>در قرارداد، شرکت شما طرف اول و شرکت اعلام‌شده در درخواست طرف دوم خواهد بود.</span>
        </div>

        {saved && !editing ? (
          <section className="organization-profile-summary panel">
            <header>
              <div>
                <span>اطلاعات ذخیره‌شده</span>
                <h2>{form.name}</h2>
                <p>{message || "این مشخصات به‌عنوان طرف اول قرارداد استفاده می‌شود."}</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => setEditing(true)}>ویرایش اطلاعات</button>
            </header>
            <div className="profile-summary-grid">
              <article><span>مدیرعامل</span><strong>{form.chiefExecutiveName}</strong></article>
              <article><span>نام پدر مدیرعامل</span><strong>{form.chiefExecutiveFatherName}</strong></article>
              <article><span>شماره ملی مدیرعامل</span><strong>{form.chiefExecutiveNationalId}</strong></article>
              <article><span>شناسه ملی شرکت</span><strong>{form.nationalIdentifier}</strong></article>
              <article><span>شماره اقتصادی</span><strong>{form.economicCode}</strong></article>
              <article><span>شماره ثبت</span><strong>{form.registrationNumber || "ثبت نشده"}</strong></article>
              <article className="wide-field"><span>آدرس شرکت</span><strong>{form.address}</strong></article>
              <article><span>تلفن</span><strong>{form.phone}</strong></article>
              <article><span>کد پستی</span><strong>{form.postalCode || "ثبت نشده"}</strong></article>
              <article><span>نمابر</span><strong>{form.fax || "ثبت نشده"}</strong></article>
              <article><span>ایمیل</span><strong dir="ltr">{form.email || "ثبت نشده"}</strong></article>
              <article><span>وب‌سایت</span><strong dir="ltr">{form.website || "ثبت نشده"}</strong></article>
            </div>
          </section>
        ) : <form className="organization-profile-form" onSubmit={submit}>
          <fieldset className="panel" disabled={loading || saving}>
            <legend>مشخصات حقوقی شرکت</legend>
            <div className="profile-fields">
              <label className="wide-field">
                <span>نام کامل شرکت <b>*</b></span>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="مثلاً شرکت داده‌پردازان" />
              </label>
              <label>
                <span>شناسه ملی شرکت <b>*</b></span>
                <input required inputMode="numeric" value={form.nationalIdentifier} onChange={(e) => set("nationalIdentifier", e.target.value)} placeholder="۱۱ رقمی" />
              </label>
              <label>
                <span>شماره اقتصادی <b>*</b></span>
                <input required inputMode="numeric" value={form.economicCode} onChange={(e) => set("economicCode", e.target.value)} />
              </label>
              <label>
                <span>شماره ثبت</span>
                <input inputMode="numeric" value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} />
              </label>
            </div>
          </fieldset>

          <fieldset className="panel" disabled={loading || saving}>
            <legend>نماینده شرکت در قرارداد</legend>
            <div className="profile-fields">
              <label>
                <span>نام و نام خانوادگی مدیرعامل <b>*</b></span>
                <input required value={form.chiefExecutiveName} onChange={(e) => set("chiefExecutiveName", e.target.value)} />
              </label>
              <label>
                <span>نام پدر مدیرعامل <b>*</b></span>
                <input required value={form.chiefExecutiveFatherName} onChange={(e) => set("chiefExecutiveFatherName", e.target.value)} />
              </label>
              <label>
                <span>شماره ملی مدیرعامل <b>*</b></span>
                <input required inputMode="numeric" value={form.chiefExecutiveNationalId} onChange={(e) => set("chiefExecutiveNationalId", e.target.value)} placeholder="۱۰ رقمی" />
              </label>
            </div>
          </fieldset>

          <fieldset className="panel" disabled={loading || saving}>
            <legend>نشانی و راه‌های ارتباطی</legend>
            <div className="profile-fields">
              <label className="wide-field">
                <span>آدرس شرکت <b>*</b></span>
                <textarea required rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} />
              </label>
              <label>
                <span>تلفن شرکت <b>*</b></span>
                <input required inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>
              <label>
                <span>کد پستی</span>
                <input inputMode="numeric" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
              </label>
              <label>
                <span>نمابر</span>
                <input inputMode="tel" value={form.fax} onChange={(e) => set("fax", e.target.value)} />
              </label>
              <label>
                <span>ایمیل</span>
                <input type="email" dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label>
                <span>وب‌سایت</span>
                <input type="url" dir="ltr" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
              </label>
            </div>
          </fieldset>

          {message && <p className="profile-form-message" role="alert">{message}</p>}
          <div className="profile-save-bar">
            <div>
              <strong>منبع اطلاعات طرف اول قرارداد</strong>
              <span>{message || "فیلدهای ستاره‌دار در همه قالب‌های قرارداد قابل استفاده‌اند."}</span>
            </div>
            <button className="primary-button" disabled={loading || saving}>
              {saving ? "در حال ذخیره..." : "ذخیره اطلاعات شرکت"}
            </button>
            {saved && <button className="ghost-button" type="button" onClick={() => setEditing(false)}>انصراف</button>}
          </div>
        </form>}
      </section>
    </main>
  );
}
