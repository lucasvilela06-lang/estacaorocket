const crypto=require("crypto");
const {isStudioSession,readBody,json,getSupabaseConfig,supabaseHeaders}=require("../../lib/studio-auth");
const BUILTIN=require("../../lib/coloring-artworks"),KEYS=new Set(BUILTIN.map(x=>x.builtinKey));
function png(data){if(!data)return null;if(typeof data!=="string"||!data.startsWith("data:image/png;base64,"))throw new Error("A IMAGEM DE SUBSTITUIÇÃO PRECISA ESTAR EM PNG.");const b64=data.slice(22);if(b64.length>16000000||!/^[A-Za-z0-9+/]+={0,2}$/.test(b64))throw new Error("PNG INVÁLIDO OU MUITO GRANDE.");const bytes=Buffer.from(b64,"base64");if(bytes.length<24||bytes.subarray(0,8).toString("hex")!=="89504e470d0a1a0a")throw new Error("ARQUIVO PNG INVÁLIDO.");return bytes;}
async function find(url,key,filter){const r=await fetch(url+"/rest/v1/coloring_artworks?select=id,builtin_key,file_path,title,description,age_groups,difficulty,category,published,is_archived&"+filter+"&limit=1",{headers:supabaseHeaders(key)});if(!r.ok)throw new Error("NÃO FOI POSSÍVEL CONSULTAR O REGISTRO NO SUPABASE.");const data=await r.json();return data[0]||null;}
async function upload(url,key,path,bytes){const r=await fetch(url+"/storage/v1/object/rocket-coloring/"+path,{method:"POST",headers:supabaseHeaders(key,{"Content-Type":"image/png","x-upsert":"true","Cache-Control":"public, max-age=31536000"}),body:bytes});if(!r.ok)throw new Error("FALHA AO SUBSTITUIR A IMAGEM NO STORAGE: "+(await r.text()).slice(0,180));}
module.exports=async function handler(req,res){
 if(req.method!=="POST")return json(res,405,{error:"MÉTODO NÃO PERMITIDO."});if(!isStudioSession(req))return json(res,401,{error:"SESSÃO EXPIRADA. ENTRE NOVAMENTE NO STUDIO."});
 const {url,key}=getSupabaseConfig();if(!url||!key)return json(res,503,{error:"CONECTE O SUPABASE PARA GERENCIAR AS ILUSTRAÇÕES."});
 let body;try{body=readBody(req);}catch(_){return json(res,400,{error:"DADOS INVÁLIDOS."});}
 const action=String(body.action||""),kind=String(body.kind||""),builtinKey=String(body.builtinKey||""),id=String(body.id||"");
 if(!["save","archive","restore"].includes(action)||!["builtin","remote"].includes(kind))return json(res,400,{error:"AÇÃO OU TIPO INVÁLIDO."});
 if(kind==="builtin"&&!KEYS.has(builtinKey))return json(res,400,{error:"ILUSTRAÇÃO ORIGINAL NÃO RECONHECIDA."});
 if(kind==="remote"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return json(res,400,{error:"IDENTIFICADOR INVÁLIDO."});
 try{
  const existing=kind==="builtin"?await find(url,key,"builtin_key=eq."+encodeURIComponent(builtinKey)):await find(url,key,"id=eq."+encodeURIComponent(id));
  const artworkId=existing?.id||(kind==="builtin"?crypto.randomUUID():id);let filePath=existing?.file_path||null;
  if(action==="save"&&body.dataUrl){const bytes=png(body.dataUrl);filePath="studio/"+artworkId+".png";await upload(url,key,filePath,bytes);}
  const seed=kind==="builtin"?BUILTIN.find(x=>x.builtinKey===builtinKey):null;
  const ages=action==="save"?String(body.ageGroup||"5-7").split(",").map(x=>x.trim()).filter(x=>["2-4","5-7","8-11"].includes(x)):existing?.age_groups||(seed?.ages||["5-7"]);
  if(!ages.length)return json(res,400,{error:"ESCOLHA AO MENOS UMA FAIXA ETÁRIA."});
  const title=action==="save"?String(body.title||"").trim():(existing?.title||seed?.title||body.title||"ILUSTRAÇÃO");
  if(action==="save"&&(!title||title.length>70))return json(res,400,{error:"INFORME UM TÍTULO COM ATÉ 70 CARACTERES."});
  const row={id:artworkId,title,description:action==="save"?String(body.description||"").slice(0,1000):(existing?.description||seed?.detail||""),age_groups:ages,difficulty:action==="save"?(["simple","medium","detailed"].includes(body.difficulty)?body.difficulty:"medium"):(existing?.difficulty||seed?.difficulty||"medium"),category:action==="save"?String(body.category||"ESPAÇO").slice(0,50):(existing?.category||seed?.category||"ESPAÇO"),file_path:filePath,published:action!=="archive",is_archived:action==="archive",updated_at:new Date().toISOString()};
  if(kind==="builtin"){row.builtin_key=builtinKey;const r=await fetch(url+"/rest/v1/coloring_artworks?on_conflict=builtin_key",{method:"POST",headers:supabaseHeaders(key,{"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=representation"}),body:JSON.stringify(row)});const detail=await r.text();if(!r.ok)return json(res,502,{error:"NÃO FOI POSSÍVEL SALVAR A ILUSTRAÇÃO. EXECUTE A NOVA MIGRAÇÃO: "+detail.slice(0,200)});}
  else{const r=await fetch(url+"/rest/v1/coloring_artworks?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:supabaseHeaders(key,{"Content-Type":"application/json","Prefer":"return=representation"}),body:JSON.stringify(row)});const detail=await r.text();if(!r.ok)return json(res,502,{error:"NÃO FOI POSSÍVEL ATUALIZAR A ILUSTRAÇÃO: "+detail.slice(0,200)});}
  return json(res,200,{id:artworkId,builtinKey:kind==="builtin"?builtinKey:null,archived:action==="archive",restored:action==="restore"});
 }catch(e){return json(res,502,{error:e.message||"FALHA AO GERENCIAR A ILUSTRAÇÃO."});}
};