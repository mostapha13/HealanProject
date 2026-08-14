const persianDateFormatter=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{
 year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tehran'
});

const persianDateTimeFormatter=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{
 year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',
 hourCycle:'h23',timeZone:'Asia/Tehran'
});

function parsedGregorian(value){
 if(value instanceof Date)return Number.isNaN(value.getTime())?null:value;
 const text=String(value??'').trim();
 if(!text)return null;
 const numeric=text.match(/^([0-9]{4})[-/.]([0-9]{1,2})[-/.]([0-9]{1,2})(?:[T\s]|$)/);
 if(numeric){
  const year=Number(numeric[1]);
  if(year>=1200&&year<=1600)return null;
  if(year<1900||year>2200)return null;
 }
 const date=new Date(text);
 return Number.isNaN(date.getTime())?null:date;
}

export function formatPersianDate(value){
 const date=parsedGregorian(value);
 return date?persianDateFormatter.format(date):String(value??'');
}

export function formatPersianDateTime(value){
 const date=parsedGregorian(value);
 return date?persianDateTimeFormatter.format(date):String(value??'');
}
