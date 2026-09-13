function setSyncText(t){var el=document.getElementById("syncStatus");if(el)el.textContent=t}
function ghHeaders(token){return{Authorization:"Bearer "+token,"Accept":"application/vnd.github+json","Content-Type":"application/json","X-GitHub-Api-Version":"2022-11-28"}}
function toB64(str){return btoa(unescape(encodeURIComponent(str)))}
function fromB64(str){return decodeURIComponent(escape(atob(str)))}
async function pullCloud(token){
  var res=await fetch("https://api.github.com/repos/cokimasovski-coder/fiskai/contents/data/backup.json",{headers:ghHeaders(token)});
  if(res.status===404)return{items:[],sha:null};
  if(!res.ok)throw new Error("pull "+res.status);
  var j=await res.json();
  var data=JSON.parse(fromB64(j.content.replace(/\n/g,"")));
  return{items:data.items||[],budget:data.budget||{},sha:j.sha};
}
function mergeItems(local,cloud){
  var map={};
  (cloud||[]).forEach(function(x){if(x&&x.id)map[x.id]=x});
  (local||[]).forEach(function(x){if(x&&x.id)map[x.id]=x});
  return Object.keys(map).map(function(k){return map[k]});
}
async function pushCloud(token,payload,sha){
  var body={message:"FiskAI backup",content:toB64(JSON.stringify(payload))};
  if(sha)body.sha=sha;
  var res=await fetch("https://api.github.com/repos/cokimasovski-coder/fiskai/contents/data/backup.json",{method:"PUT",headers:ghHeaders(token),body:JSON.stringify(body)});
  if(!res.ok)throw new Error("push "+res.status);
  return res.json();
}
async function syncNow(){
  var s={};try{s=JSON.parse(localStorage.getItem("fiskai.settings")||"{}")}catch(e){}
  if(!s.ghToken){setSyncText("Локално на телефон. Стави GitHub токен за backup.");return}
  if(!navigator.onLine){setSyncText("Нема интернет. Записите се чуваат тука, ќе се качат подоцна.");return}
  setSyncText("Синхронизирам...");
  try{
    var cloud=await pullCloud(s.ghToken);
    var local=[];try{local=JSON.parse(localStorage.getItem("trosoci.v1")||"[]")}catch(e){}
    var merged=mergeItems(local,cloud.items);
    localStorage.setItem("trosoci.v1",JSON.stringify(merged));
    if(typeof state!=="undefined")state=merged;
    var budget={};try{budget=JSON.parse(localStorage.getItem("fiskai.budget")||"{}")}catch(e){}
    if(cloud.budget&&Object.keys(budget).length===0){budget=cloud.budget;localStorage.setItem("fiskai.budget",JSON.stringify(budget))}
    await pushCloud(s.ghToken,{items:merged,budget:budget,updatedAt:new Date().toISOString()},cloud.sha);
    setSyncText("Качено на GitHub · "+new Date().toLocaleTimeString("mk-MK"));
    if(typeof render==="function")render();
  }catch(err){
    setSyncText("Backup не успеа. Податоците се сќ уште на телефонот.");
    console.error(err);
  }
}
window.addEventListener("online",function(){syncNow()});
window.addEventListener("offline",function(){setSyncText("Офлајн. Внесовите ќе се качат кога ќе има интернет.")});
setTimeout(function(){syncNow()},800);
