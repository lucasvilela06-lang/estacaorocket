const {json,getSupabaseConfig,supabaseHeaders}=require("../../lib/studio-auth");
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","public, s-maxage=60, stale-while-revalidate=300");
 if(req.method!=="GET")return json(res,405,{error:"MÉTODO NÃO PERMITIDO."});
 const {url,key}=getSupabaseConfig();if(!url||!key)return json(res,200,{artworks:[],builtinOverrides:[],hiddenBuiltinIds:[]});
 try{
  const response=await fetch(url+"/rest/v1/coloring_artworks?select=id,builtin_key,title,description,age_groups,difficulty,category,file_path,width,height,published,is_archived",{headers:supabaseHeaders(key)});
  const data=await response.json();if(!response.ok)throw new Error("CATÁLOGO INDISPONÍVEL");
  const rows=Array.isArray(data)?data:[];
  const hiddenBuiltinIds=rows.filter(x=>x.builtin_key&&x.is_archived).map(x=>x.builtin_key);
  const builtinOverrides=rows.filter(x=>x.builtin_key&&!x.is_archived).map(x=>({builtinKey:x.builtin_key,id:x.id,title:x.title,ages:x.age_groups||[],category:x.category||"ESPAÇO",src:x.file_path&&x.published?"/api/coloring/image?id="+encodeURIComponent(x.id):null}));
  const artworks=rows.filter(x=>!x.builtin_key&&x.published&&!x.is_archived).map(x=>({id:x.id,title:x.title,detail:x.description||"",ages:x.age_groups||[],category:x.category||"ESPAÇO",src:"/api/coloring/image?id="+encodeURIComponent(x.id),width:x.width,height:x.height}));
  return json(res,200,{artworks,builtinOverrides,hiddenBuiltinIds});
 }catch(_){return json(res,200,{artworks:[],builtinOverrides:[],hiddenBuiltinIds:[]});}
};