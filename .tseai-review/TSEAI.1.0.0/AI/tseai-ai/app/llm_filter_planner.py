import json,os,re
from .local_inference import post_chat_completion
FIELDS="""Allowed TSETMC V1 fields: (l18),(l30),(tno),(tvol),(tval),(py),(pf),(pmin),(pmax),(pl),(plc),(plp),(pc),(pcc),(pcp),(eps),(pe),(tmin),(tmax),(z),(mv),(bvol),(cs),(buyop),(predtran), order book (pd1..pd5),(zd1..zd5),(qd1..qd5),(po1..po5),(zo1..zo5),(qo1..qo5); client type: (ct).Buy_CountI, Buy_CountN, Buy_I_Volume, Buy_N_Volume, Sell_CountI, Sell_CountN, Sell_I_Volume, Sell_N_Volume. Allowed syntax only: + - * / %, && || !, == != > >= < <=, parentheses, strings, .indexOf, .length, string index and approved Math functions. Do not use [ih], [is], cfield, function, if, for, eval or SQL."""
async def plan_with_llm(question:str):
    if os.getenv("LLM_FILTER_PLANNER_ENABLED","false").lower()!="true":return None
    base=os.getenv("LLM_BASE_URL","").rstrip("/");model=os.getenv("LLM_MODEL","")
    if not base or not model:return None
    system=f"""You convert Persian stock-market screening requests to ONE TSETMC simple filter expression. {FIELDS}\nAll monetary numeric literals must be IRR. If user explicitly says toman multiply by 10. Return strict JSON only: {{\"tsetmc_code\":\"...\",\"explanation\":\"Persian explanation\"}}. Never invent a field outside the catalog. If impossible return {{\"tsetmc_code\":null,\"explanation\":\"unsupported\"}}."""
    headers={"Content-Type":"application/json"};key=os.getenv("LLM_API_KEY","")
    if key:headers["Authorization"]="Bearer "+key
    payload={"model":model,"temperature":0,"max_tokens":384,"chat_template_kwargs":{"enable_thinking":False},"messages":[{"role":"system","content":system},{"role":"user","content":question}]}
    response=await post_chat_completion(base+"/chat/completions",headers,payload)
    if not response:return None
    try:content=response["choices"][0]["message"]["content"].strip()
    except (KeyError,IndexError,TypeError,AttributeError):return None
    content=re.sub(r"^```(?:json)?|```$","",content,flags=re.I|re.M).strip()
    try:return json.loads(content)
    except json.JSONDecodeError:return None
