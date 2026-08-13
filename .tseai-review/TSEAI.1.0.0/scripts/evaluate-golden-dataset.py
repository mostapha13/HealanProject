#!/usr/bin/env python3
import argparse,datetime,hashlib,json,os,statistics,time,urllib.error,urllib.request,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA_PATH=ROOT/'tests/golden-question-dataset.v1.json'
DATA_BYTES=DATA_PATH.read_bytes()
DATA=json.loads(DATA_BYTES.decode('utf-8'))
TH=json.loads((ROOT/'config/evaluation-thresholds.json').read_text(encoding='utf-8'))

def norm(x): return (x or '').strip().lower()
def static_preflight():
    cases=DATA['cases']; ids={x['id'] for x in cases}; cats={x['category'] for x in cases}
    bad=[]
    for c in cases:
        e=c['expected']
        if not e.get('route'): bad.append((c['id'],'missing_route'))
        if not isinstance(e.get('capabilities',[]),list): bad.append((c['id'],'capabilities_not_list'))
    return {'mode':'offline-preflight','total':len(cases),'uniqueIds':len(ids),'categories':sorted(cats),'issues':bad,'passed':len(cases)>=300 and len(ids)==len(cases) and not bad}

def ask(base,case,anonymous,bearer=None):
    body=json.dumps({'question':case['question'],'conversationId':'golden-'+case['id']},ensure_ascii=False).encode()
    headers={'Content-Type':'application/json','X-Anonymous-Id':anonymous,'X-Correlation-Id':f'golden-{case["id"]}'}
    if bearer: headers['Authorization']=f'Bearer {bearer}'
    req=urllib.request.Request(base.rstrip('/')+'/api/chat/ask',data=body,headers=headers,method='POST')
    t=time.perf_counter()
    try:
        with urllib.request.urlopen(req,timeout=20) as r: out=json.loads(r.read().decode())
        return out,(time.perf_counter()-t)*1000,None,r.status
    except urllib.error.HTTPError as ex:
        detail=ex.read().decode('utf-8',errors='replace')[:1000]
        return {},(time.perf_counter()-t)*1000,f'HTTP {ex.code}: {detail}',ex.code
    except Exception as ex: return {},(time.perf_counter()-t)*1000,str(ex),None

def score(base,min_interval_ms=1100,bearer=None):
    rows=[]; run_id=uuid.uuid4().hex; previous_started=0.0
    for c in DATA['cases']:
        elapsed_ms=(time.monotonic()-previous_started)*1000
        if previous_started and elapsed_ms<min_interval_ms: time.sleep((min_interval_ms-elapsed_ms)/1000)
        previous_started=time.monotonic()
        # A distinct anonymous subject keeps product quotas intact while the IP-based
        # global limiter still constrains the evaluation run to production-safe traffic.
        anonymous=f'golden-{run_id}-{c["id"]}'
        out,ms,err,http_status=ask(base,c,anonymous,bearer); e=c['expected']; route=out.get('intent') or out.get('type') or ''
        trace=out.get('trace') or []; caps={x.get('tool') for x in trace if isinstance(x,dict)}
        entity=((out.get('entity') or {}).get('selected') or {}).get('symbol') or ((out.get('entity') or {}).get('selected') or {}).get('displayName') or ''
        temporal=out.get('temporal') or {}; answer=out.get('answer') or ''
        ev=out.get('evidence') or []; val=out.get('answerValidation') or {}
        rows.append({
          'id':c['id'],'category':c['category'],'latencyMs':round(ms,2),'httpStatus':http_status,'error':err,
          'routeOk':norm(route)==norm(e.get('route')),
          'capabilityOk':all(x in caps for x in e.get('capabilities',[])),
          'entityOk':not e.get('entity') or norm(e['entity']) in norm(entity) or norm(entity) in norm(e['entity']),
          'temporalOk':not e.get('temporal') or bool(temporal.get('hasTemporalReference')),
          'mustOk':all(x in answer for x in e.get('mustContain',[])),
          'mustNotOk':all(x not in answer for x in e.get('mustNotContain',[])),
          'grounded':bool(ev) or norm(route) in {'clarification','unsupported'},
          'citationValid':val.get('isValid') is True or norm(route) in {'clarification','unsupported'},
          'hallucination':val.get('status')=='Blocked' or 'hallucination' in '|'.join(val.get('issues') or []).lower(),
          'unsafeTool':any(str(x).startswith(('sql.','shell.','http.arbitrary','mcp.arbitrary')) for x in caps)
        })
    n=max(1,len(rows)); ratio=lambda k:sum(bool(r[k]) for r in rows)/n
    metrics={'routeAccuracy':ratio('routeOk'),'capabilityAccuracy':ratio('capabilityOk'),'entityAccuracy':ratio('entityOk'),'temporalAccuracy':ratio('temporalOk'),'groundedness':ratio('grounded'),'citationValidity':ratio('citationValid'),'hallucinationRate':ratio('hallucination'),'unsafeToolRate':ratio('unsafeTool'),'p50LatencyMs':statistics.median([r['latencyMs'] for r in rows]),'p95LatencyMs':sorted([r['latencyMs'] for r in rows])[min(n-1,int(n*.95))]}
    gate=all(metrics[k]>=v for k,v in TH['minimum'].items()) and all(metrics[k]<=v for k,v in TH['maximum'].items())
    return {'mode':'live','generatedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runId':run_id,'version':(ROOT/'VERSION').read_text(encoding='utf-8').strip(),'datasetSha256':hashlib.sha256(DATA_BYTES).hexdigest(),'total':len(rows),'metrics':metrics,'gatePassed':gate,'failures':[r for r in rows if r['error'] or not all([r['routeOk'],r['capabilityOk'],r['entityOk'],r['temporalOk'],r['mustOk'],r['mustNotOk'],r['citationValid'],not r['unsafeTool']])][:100]}

ap=argparse.ArgumentParser();ap.add_argument('--base-url');ap.add_argument('--out',default='artifacts/evaluation-report.json');ap.add_argument('--min-interval-ms',type=int,default=1100);ap.add_argument('--bearer-token-env',default='TSEAI_EVALUATION_BEARER_TOKEN');a=ap.parse_args()
bearer=os.getenv(a.bearer_token_env) if a.base_url else None
r=score(a.base_url,max(0,a.min_interval_ms),bearer) if a.base_url else static_preflight(); p=ROOT/a.out;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(r,ensure_ascii=False,indent=2)); raise SystemExit(0 if r.get('passed',r.get('gatePassed',False)) else 2)
