import json,os,re
from .llm_filter_planner import FIELDS
from .local_inference import post_chat_completion

ALLOWED="create, add, replace_all, replace_condition, remove_last, remove_condition, remove_field, clear, undo, redo, show, explain, execute"

async def plan_conversation_with_llm(question:str,current_code:str|None,current_conditions:list[str]):
    if os.getenv("LLM_FILTER_PLANNER_ENABLED","false").lower()!="true":return None
    base=os.getenv("LLM_BASE_URL","").rstrip("/");model=os.getenv("LLM_MODEL","")
    if not base or not model:return None
    numbered="\n".join(f"{i+1}. {c}" for i,c in enumerate(current_conditions)) or "(none)"
    system=f"""You edit a TSETMC simple filter through Persian conversation. {FIELDS}
Allowed operations: {ALLOWED}.
Current filter and numbered conditions are provided. Return strict JSON only with keys operation, tsetmc_code, condition_index, field_code, explanation.
For add/create/replace_all/replace_condition, tsetmc_code must contain only supported TSETMC simple syntax and all money literals must be IRR. For remove_condition use a 1-based condition_index. Never emit SQL, JavaScript function mode, [ih], [is], eval or unsupported fields. If uncertain return operation=none."""
    user=f"Current filter: {current_code or '(none)'}\nConditions:\n{numbered}\nUser request: {question}"
    headers={"Content-Type":"application/json"};key=os.getenv("LLM_API_KEY","")
    if key:headers["Authorization"]="Bearer "+key
    payload={"model":model,"temperature":0,"max_tokens":384,"chat_template_kwargs":{"enable_thinking":False},"messages":[{"role":"system","content":system},{"role":"user","content":user}]}
    response=await post_chat_completion(base+"/chat/completions",headers,payload)
    if not response:return None
    try:content=response["choices"][0]["message"]["content"].strip()
    except (KeyError,IndexError,TypeError,AttributeError):return None
    content=re.sub(r"^```(?:json)?|```$","",content,flags=re.I|re.M).strip()
    try:return json.loads(content)
    except json.JSONDecodeError:return None
