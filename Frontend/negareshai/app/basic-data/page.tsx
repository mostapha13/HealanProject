import Link from "next/link";

const groups = [
  {
    title: "هویت سازمان",
    description: "اطلاعات ثابتی که در اسناد و قراردادها به‌عنوان مشخصات شرکت شما استفاده می‌شود.",
    tone: "identity",
    items: [
      ["اطلاعات شرکت ما", "مشخصات ثبتی، مدیرعامل، شناسه‌ها و اطلاعات تماس", "/basic-data/organization-profile", "ضروری"],
    ],
  },
  {
    title: "مدیریت قرارداد",
    description: "اطلاعات مرجع دستیار برای ساخت، تکمیل و مدیریت قراردادها.",
    tone: "contract",
    items: [
      ["طرف‌های قرارداد", "اشخاص و شرکت‌های طرف دوم قرارداد", "/basic-data/contract-parties", "اشخاص"],
      ["انواع قرارداد", "نوع قرارداد و مسیر انتخاب خودکار قالب", "/basic-data/contract-groups", "ساختار"],
      ["قالب‌های قرارداد", "فایل‌های Word نسخه‌دار برای هر نوع قرارداد", "/basic-data/contract-templates", "قالب"],
      ["بندهای مصوب", "مواد و بندهای قابل استفاده توسط دستیار", "/basic-data/contract-clauses", "محتوا"],
      ["وضعیت‌های قرارداد", "مراحل قابل استفاده در چرخه قرارداد", "/basic-data/contract-statuses", "گردش کار"],
      ["اسناد مبنای سازمان", "منابع رسمی مورد استفاده در تولید قرارداد", "/basic-data/base-documents", "منبع"],
      ["سال‌های قراردادی", "سال‌های مجاز برای ثبت و دسته‌بندی", "/basic-data/contract-years", "زمان"],
    ],
  },
  {
    title: "تطبیق اسناد",
    description: "تنظیمات مستقل مقایسه یک سند با مراجع و قواعد مصوب همان گروه کاری.",
    tone: "comparison",
    items: [
      ["گروه‌های اسناد", "دسته‌بندی اسناد برای مقایسه و دسترسی", "/basic-data/document-groups", "دسته‌بندی"],
      ["معیارهای انطباق", "تعریف معیارهای مشترک، وزن و اهمیت آن‌ها", "/basic-data/compliance-criteria", "معیار"],
      ["معیارهای گروه سند", "اختصاص معیارها به هر گروه و تعیین وزن", "/basic-data/document-group-criteria", "اتصال"],
      ["اسناد طلایی", "اسناد مرجع اولویت‌دار برای تطبیق", "/basic-data/golden-documents", "مرجع"],
      ["مجموعه قواعد", "قواعد نسخه‌دار تحلیل و کنترل اسناد", "/basic-data/rule-sets", "قواعد"],
    ],
  },
] as const;

export default function BasicDataPage() {
  return (
    <main className="basic-studio" dir="rtl">
      <header className="basic-studio-hero">
        <div>
          <span className="basic-breadcrumb">خانه / داده‌های پایه</span>
          <h1>مرکز داده‌های پایه</h1>
          <p>اطلاعات مرجع سامانه را یک‌بار و در جای درست ثبت کنید. هر بخش مستقل است و فقط در فرایند مرتبط با خودش استفاده می‌شود.</p>
        </div>
        <Link href="/" className="basic-home-link">رفتن به نمای کلی</Link>
      </header>

      <div className="basic-callout">
        <span>نکته</span>
        <p>«مدیریت قرارداد» و «تطبیق اسناد» دو فضای مستقل هستند؛ اطلاعات یک بخش وارد فرایند بخش دیگر نمی‌شود.</p>
      </div>

      <div className="basic-domain-list">
        {groups.map(group => (
          <section className={`basic-domain basic-domain-${group.tone}`} key={group.title}>
            <header>
              <div className="basic-domain-icon" aria-hidden="true" />
              <div><h2>{group.title}</h2><p>{group.description}</p></div>
              <b>{group.items.length} بخش</b>
            </header>
            <div className="basic-domain-grid">
              {group.items.map(([title, description, href, tag]) => (
                <Link href={href} className="basic-module-card" key={href}>
                  <span>{tag}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <strong>مدیریت بخش <i>←</i></strong>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
