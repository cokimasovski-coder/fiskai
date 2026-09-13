function geminiKey(){var s={};try{s=JSON.parse(localStorage.getItem("fiskai.settings")||"{}")}catch(e){} return (s.geminiKey||s.apiKey||"").trim()}
function parseGeminiJson(text){if(!text)return null;var t=String(text).replace(/```json/g,"").replace(/```/g,"").trim();var a=t.indexOf("{");var b=t.lastIndexOf("}");if(a<0||b<=a)return null;try{return JSON.parse(t.slice(a,b+1))}catch(e){return null}}
function guessCat(shop,items){var t=((shop||"")+" "+(items||"")).toLowerCase();if(/tikves|vino|kafe|coffee|restoran|pizza|burger|bar/.test(t))return"kafe";if(/tinex|vero|ramstore|kam|market|lidl|kipper|leb|mleko|hrana/.test(t))return"hrana";if(/okta|makpetrol|shell|fuel|benz|bus|taxi|park/.test(t))return"transport";if(/evn|telekom|a1|vodovod|parno|struja/.test(t))return"smetki";if(/aptek|zdrav|bolnic/.test(t))return"zdravje";if(/kirija|stan/.test(t))return"kirija";if(/obleka|h&m|zara|obuv/.test(t))return"obleka";return"ostanato"}
async function readWithGemini(dataUrl){
  var key=geminiKey();
  if(!key)throw new Error("no-key");
  var b64=String(dataUrl).split(",")[1]||"";
  var prompt="Procitaj makedonska fiskalna smetka. Vrati SAMO JSON so polinja: shop (ime na market), amount (vkupna suma broj, ne string), date (YYYY-MM-DD ako ja gledas inaku prazno), time (HH:MM ako ja gledas), items (kratki proizvodi, eden red), currency (MKD ili EUR). Ako ne si siguren za pole, ostavi prazno ili 0. Nemoj drug tekst.";
  var url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+encodeURIComponent(key);
  var res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt},{inline_data:{mime_type:"image/jpeg",data:b64}}]}],generationConfig:{temperature:0.1}})});
  if(!res.ok){var err=await res.text();throw new Error("gemini "+res.status+" "+err.slice(0,180))}
  var j=await res.json();
  var text=((((j.candidates||[])[0]||{}).content||{}).parts||[]).map(function(p){return p.text||""}).join("\n");
  var data=parseGeminiJson(text);
  if(!data)throw new Error("no-json");
  return data;
}
function applyScan(data){
  if(!data)return;
  if(data.shop)document.getElementById("scanShop").value=data.shop;
  if(data.amount)document.getElementById("scanAmount").value=String(data.amount).replace(",",".");
  if(data.date&&/^\d{4}-\d{2}-\d{2}$/.test(data.date))document.getElementById("scanDate").value=data.date;
  if(data.time&&/^\d{2}:\d{2}/.test(data.time))document.getElementById("scanTime").value=data.time.slice(0,5);
  if(data.items)document.getElementById("scanItems").value=data.items;
  var cat=guessCat(data.shop,data.items);
  var sel=document.getElementById("scanCat"); if(sel) sel.value=cat;
}
var _onPhoto=window.onPhoto;
if(typeof onPhoto==="function"){
  onPhoto=function(e){
    var file=e.target.files&&e.target.files[0]; if(!file)return;
    compressImage(file).then(function(data){
      receiptDataUrl=data;
      var prev=document.getElementById("preview"); prev.src=data; prev.style.display="block";
      var st=document.getElementById("ocrStatus");
      if(!geminiKey()){st.textContent="Nema Gemini kluc. Vnesi suma racno ili stavi kluc vo Postavki.";return}
      if(!navigator.onLine){st.textContent="Nema internet. Vnesi suma racno, AI ke cita podocna.";return}
      st.textContent="Gemini ja cita fiskalnata...";
      readWithGemini(data).then(function(parsed){
        applyScan(parsed);
        st.textContent="Procitano. Proveri ja sumata i zacuvaj.";
      }).catch(function(err){
        st.textContent="Gemini ne uspea ("+err.message+"). Vnesi suma racno.";
      });
    });
  };
  var cam=document.getElementById("photoCam"); var gal=document.getElementById("photoGal");
  if(cam)cam.onchange=onPhoto; if(gal)gal.onchange=onPhoto;
}
(function(){
  var open=document.getElementById("openSettings");
  var saveBtn=document.getElementById("saveSettings");
  if(open){var prev=open.onclick;open.onclick=function(){if(prev)prev();var s={};try{s=JSON.parse(localStorage.getItem("fiskai.settings")||"{}")}catch(e){} var el=document.getElementById("geminiKey"); if(el) el.value=s.geminiKey||""; var g=document.getElementById("ghToken"); if(g) g.value=s.ghToken||"";};}
  if(saveBtn){var prevS=saveBtn.onclick;saveBtn.onclick=function(){if(prevS)prevS();var s={};try{s=JSON.parse(localStorage.getItem("fiskai.settings")||"{}")}catch(e){} var el=document.getElementById("geminiKey"); if(el) s.geminiKey=el.value.trim(); var g=document.getElementById("ghToken"); if(g) s.ghToken=g.value.trim(); localStorage.setItem("fiskai.settings",JSON.stringify(s)); if(window.syncNow)syncNow();};}
})();
