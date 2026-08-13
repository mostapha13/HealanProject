using TSEAI.Application.Filters.ChatAssets;

static void Assert(bool ok,string message){if(!ok) throw new Exception(message);}
var d=new DeterministicChatFilterAssetCommandDetector();

var x=d.Detect("همین رو با اسم کم P/E ذخیره کن");
Assert(x.Operation==ChatFilterAssetOperation.SaveCurrent && x.Name=="کم P/E","save current");
x=d.Detect("این فیلتر رو با اسم پرحجم ذخیره کن");
Assert(x.Operation==ChatFilterAssetOperation.SaveCurrent && x.Name=="پرحجم","save this filter");
x=d.Detect("فیلترهای ذخیره شده من رو بده");
Assert(x.Operation==ChatFilterAssetOperation.ListSaved,"list saved");
x=d.Detect("فیلتر کم P/E رو بارگذاری کن");
Assert(x.Operation==ChatFilterAssetOperation.LoadSaved && x.Name=="کم P/E","load saved");
x=d.Detect("فیلتر ذخیره شده کم P/E رو حذف کن");
Assert(x.Operation==ChatFilterAssetOperation.DeleteSaved,"delete saved");
x=d.Detect("همین رو هشدار کن");
Assert(x.Operation==ChatFilterAssetOperation.CreateAlert,"alert current");
x=d.Detect("برای فیلتر کم P/E یک هشدار بساز");
Assert(x.Operation==ChatFilterAssetOperation.CreateAlert && x.Name=="کم P/E","alert saved");
x=d.Detect("هشدارهای من رو بده");
Assert(x.Operation==ChatFilterAssetOperation.ListAlerts,"list alerts");
x=d.Detect("هشدار کم P/E رو غیرفعال کن");
Assert(x.Operation==ChatFilterAssetOperation.DisableAlert,"disable alert");
x=d.Detect("هشدار کم P/E رو فعال کن");
Assert(x.Operation==ChatFilterAssetOperation.EnableAlert,"enable alert");
x=d.Detect("هشدار کم P/E رو حذف کن");
Assert(x.Operation==ChatFilterAssetOperation.DeleteAlert,"delete alert");
x=d.Detect("آخرین خبر بانک ملت رو بده");
Assert(x.Operation==ChatFilterAssetOperation.None,"must not over-capture knowledge");
x=d.Detect("شرط دوم رو حذف کن");
Assert(x.Operation==ChatFilterAssetOperation.None,"must leave conversational edit to sprint21");
Console.WriteLine("TSEAI Chat Filter Assets smoke tests passed.");
