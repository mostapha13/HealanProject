"""ساخت فایل نمونه Excel با ۵۰ ردیف متن فارسی برای تست RAG."""

from pathlib import Path

from openpyxl import Workbook

OUTPUT = Path(__file__).resolve().parent.parent / "data" / "sample.xlsx"
ROW_COUNT = 50

HEADERS = [
    "ردیف",
    "نوع_رکورد",
    "کد",
    "عنوان",
    "متن",
    "دسته",
    "شماره_تماس",
    "تاریخ",
    "وضعیت",
]

SPECIALTIES = [
    "قلب و عروق",
    "اطفال",
    "پوست و مو",
    "ارتوپدی",
    "داخلی",
    "چشم‌پزشکی",
    "گوش و حلق و بینی",
    "روانپزشکی",
    "زنان و زایمان",
    "عمومی",
]

DOCTOR_NAMES = [
    "دکتر سارا احمدی",
    "دکتر علی رضایی",
    "دکتر مریم کریمی",
    "دکتر حسین موسوی",
    "دکتر نرگس حاتمی",
    "دکتر امیر صادقی",
    "دکتر لیلا جعفری",
    "دکتر مهدی باقری",
    "دکتر زهرا شریفی",
    "دکتر کامران نظری",
]

PATIENT_NAMES = [
    "رضا محمدی",
    "فاطمه نوری",
    "امیر حسینی",
    "سمیه اکبری",
    "پریسا مرادی",
    "حسین علوی",
    "مینا رحیمی",
    "جواد کاظمی",
    "نازنین فرهمند",
    "بهرام داوودی",
]

DISTRICTS = [
    "ونک",
    "سعادت‌آباد",
    "تجریش",
    "پاسداران",
    "شریعتی",
    "یوسف‌آباد",
    "نیاوران",
    "پیروزی",
    "ستارخان",
    "اکباتان",
]


def _doctor_row(i: int) -> list:
    code = f"D{i:03d}"
    name = DOCTOR_NAMES[i % len(DOCTOR_NAMES)]
    spec = SPECIALTIES[i % len(SPECIALTIES)]
    district = DISTRICTS[i % len(DISTRICTS)]
    phone = f"021-{88000000 + i}"
    days = ["شنبه تا چهارشنبه", "یکشنبه تا پنجشنبه", "شنبه، دوشنبه، چهارشنبه"][i % 3]
    hours = ["08:00-14:00", "09:00-17:00", "10:00-18:00"][i % 3]
    text = (
        f"{name} متخصص {spec} در کلینیک هیلان منطقه {district} فعالیت می‌کند. "
        f"آدرس: تهران، {district}، پلاک {100 + i}. "
        f"روزهای نوبت‌دهی: {days}. ساعت کاری: {hours}. "
        f"برای نوبت‌گیری با شماره {phone} تماس بگیرید یا از پنل بیمار استفاده کنید. "
        f"کد پزشک در سیستم: {code}."
    )
    return [
        str(i),
        "پزشک",
        code,
        name,
        text,
        spec,
        phone,
        "",
        "فعال",
    ]


def _appointment_row(i: int) -> list:
    p_code = f"P{2000 + i}"
    d_code = f"D{(i % 10) + 1:03d}"
    patient = PATIENT_NAMES[i % len(PATIENT_NAMES)]
    doctor = DOCTOR_NAMES[i % len(DOCTOR_NAMES)]
    spec = SPECIALTIES[i % len(SPECIALTIES)]
    date = f"1404/{(i % 12) + 1:02d}/{(i % 28) + 1:02d}"
    status = ["تأیید شده", "در انتظار", "لغو شده", "انجام شده"][i % 4]
    empty_note = ""
    if status == "لغو شده":
        empty_note = " این نوبت لغو شده و زمان آن خالی/قابل رزرو است."
    elif status == "در انتظار":
        empty_note = " این نوبت هنوز تأیید نشده و ممکن است خالی شود."
    notes = [
        "معاینه دوره‌ای",
        "پیگیری فشار خون",
        "سرفه و تب در کودک",
        "مشاوره پوست",
        "آزمایش خون",
        "کنترل قند خون",
        "ویزیت اولیه",
        "تمدید نسخه",
    ][i % 8]
    text = (
        f"نوبت بیمار {patient} (کد {p_code}) با {doctor} متخصص {spec} "
        f"در تاریخ {date} ثبت شده است. وضعیت نوبت: {status}. "
        f"موضوع ویزیت: {notes}. پزشک معالج: {d_code}.{empty_note} "
        f"بیمار می‌تواند یک روز قبل از نوبت پیامک یادآوری دریافت کند."
    )
    return [
        str(i),
        "نوبت",
        p_code,
        f"نوبت {patient}",
        text,
        spec,
        "",
        date,
        status,
    ]


def _service_row(i: int) -> list:
    code = f"S{i:03d}"
    services = [
        ("آزمایش خون کامل", "شامل CBC، قند، چربی خون. ناشتایی ۸ ساعت.", "250000"),
        ("سونوگرافی شکم", "نیاز به ناشتایی ۴ ساعته. نتیجه همان روز.", "380000"),
        ("نوار قلب", "ده دقیقه. بدون آمادگی خاص.", "180000"),
        ("ویزیت عمومی", "معاینه و نسخه. مدت ۲۰ دقیقه.", "350000"),
        ("واکسیناسیون آنفولانزا", "مناسب گروه‌های پرخطر. بدون نوبت قبلی در روزهای خاص.", "420000"),
        ("فیزیوتراپی", "جلسه ۴۵ دقیقه. با نسخه پزشک.", "300000"),
        ("مشاوره تغذیه", "برنامه غذایی شخصی‌سازی‌شده.", "400000"),
        ("رادیولوژی قفسه سینه", "با نسخه. گزارش ظرف ۲۴ ساعت.", "320000"),
    ]
    title, desc, price = services[i % len(services)]
    text = (
        f"خدمت «{title}» در مرکز هیلان ارائه می‌شود. {desc} "
        f"هزینه تقریبی: {price} تومان. کد خدمت: {code}. "
        f"برای رزرو از منوی خدمات در اپلیکیشن یا تماس با پذیرش استفاده کنید."
    )
    return [str(i), "خدمت", code, title, text, "خدمات پاراکلینیک", "021-88880000", "", "فعال"]


def _faq_row(i: int) -> list:
    code = f"F{i:03d}"
    faqs = [
        (
            "ساعت کاری پذیرش",
            "پذیرش کلینیک هیلان هر روز از ساعت ۷:۳۰ تا ۲۱:۰۰ فعال است. "
            "در روزهای تعطیل رسمی فقط بخش اورژانس و پزشک کشیک پاسخگو هستند.",
        ),
        (
            "لغو نوبت",
            "لغو نوبت تا ۲۴ ساعت قبل از زمان ویزیت بدون جریمه امکان‌پذیر است. "
            "کمتر از ۲۴ ساعت، ۳۰٪ هزینه ویزیت کسر می‌شود.",
        ),
        (
            "بیمه تکمیلی",
            "قرارداد با بیمه‌های ایران، آسیا، دانا، پارسیان و سامان. "
            "کارت بیمه را هنگام پذیرش ارائه دهید.",
        ),
        (
            "پارکینگ",
            "پارکینگ طبقات زیرین برای بیماران تا ۲ ساعت رایگان است.",
        ),
        (
            "نتیجه آزمایش",
            "نتایج آزمایش ظرف ۲۴ تا ۴۸ ساعت در پنل بیمار و پیامک اطلاع‌رسانی می‌شود.",
        ),
        (
            "پرداخت آنلاین",
            "پرداخت از درگاه بانکی، کیف پول هیلان و کارتخوان در محل پشتیبانی می‌شود.",
        ),
    ]
    title, answer = faqs[i % len(faqs)]
    text = f"سؤال متداول: {title}. پاسخ: {answer} کد سوال: {code}."
    return [str(i), "سوالات_متداول", code, title, text, "راهنما", "", "", "فعال"]


def generate_rows() -> list[list]:
    rows: list[list] = []
    # 20 پزشک + 15 نوبت + 10 خدمت + 5 سوال = 50
    for i in range(1, 21):
        rows.append(_doctor_row(i))
    for i in range(21, 36):
        rows.append(_appointment_row(i))
    for i in range(36, 46):
        rows.append(_service_row(i))
    for i in range(46, 51):
        rows.append(_faq_row(i))
    return rows


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    rows = generate_rows()
    assert len(rows) == ROW_COUNT, f"Expected {ROW_COUNT} rows, got {len(rows)}"

    wb = Workbook()
    ws = wb.active
    ws.title = "records"
    ws.append(HEADERS)
    for row in rows:
        ws.append(row)
    wb.save(OUTPUT)
    print(f"Created {OUTPUT} with {len(rows)} data rows (+ header).")


if __name__ == "__main__":
    main()
