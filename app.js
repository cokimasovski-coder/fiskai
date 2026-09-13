const CATS = [
  { id: "hrana", name: "Hrana", color: "#22c55e" },
  { id: "smetki", name: "Smetki", color: "#38bdf8" },
  { id: "transport", name: "Transport", color: "#f59e0b" },
  { id: "kafe", name: "Kafe / izlez", color: "#a78bfa" },
  { id: "zdravje", name: "Zdravje", color: "#f43f5e" },
  { id: "kirija", name: "Kirija", color: "#fb7185" },
  { id: "obleka", name: "Obleka", color: "#2dd4bf" },
  { id: "ostanato", name: "Ostanato", color: "#94a3b8" }
];
const $ = function (id) { return document.getElementById(id); };
let state = [];
try { state = JSON.parse(localStorage.getItem("trosoci.v1") || "[]"); } catch (e) { state = []; }
let view = new Date();
let editId = null;
let selectedCat = "hrana";
let receiptDataUrl = "";
function save() { localStorage.setItem("trosoci.v1", JSON.stringify(state)); }
function pad(n) { return String(n).padStart(2, "0"); }
function fmtDen(n) { return Number(n || 0).toLocaleString("mk-MK"); }
function monthKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
function mkMonths() { return new Intl.DateTimeFormat("mk-MK", { month: "long", year: "numeric" }).format(view); }
function nowParts() {
  var d = new Date();
  return { date: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()), time: pad(d.getHours()) + ":" + pad(d.getMinutes()) };
}
function catById(id) {
  for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
  return CATS[CATS.length - 1];
}
function filtered() {
  var key = monthKey(view);
  return state.filter(function (x) { return x.date && x.date.indexOf(key) === 0; })
    .sort(function (a, b) { return (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")); });
}
function renderChips(target, current) {
  target.innerHTML = "";
  CATS.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (c.id === current ? " on" : "");
    b.textContent = c.name;
    b.onclick = function () { selectedCat = c.id; renderChips(target, selectedCat); };
    target.appendChild(b);
  });
}
function render() {
  $("monthLabel").textContent = mkMonths();
  var items = filtered();
  var total = 0;
  var by = {};
  items.forEach(function (x) { total += Number(x.amount || 0); by[x.cat] = (by[x.cat] || 0) + Number(x.amount || 0); });
  $("monthSum").innerHTML = fmtDen(total) + " <span>den</span>";
  var top = Object.keys(by).map(function (k) { return [k, by[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4);
  if (!top.length) $("catSummary").innerHTML = '<div class="cat-mini"><span>Nema trosoci</span><b>0 den</b></div>';
  else $("catSummary").innerHTML = top.map(function (row) { var c = catById(row[0]); return '<div class="cat-mini"><span>' + c.name + "</span><b>" + fmtDen(row[1]) + " den</b></div>"; }).join("");
  var list = $("list");
  if (!items.length) { list.innerHTML = '<div class="empty">Nema zapisi. Dodaj trosok ili skeniraj.</div>'; return; }
  list.innerHTML = items.map(function (x) {
    var c = catById(x.cat);
    return '<div class="item" data-id="' + x.id + '"><div class="dot" style="background:' + c.color + '"></div><div class="meta"><b>' + (x.shop || c.name) + "</b><small>" + x.date + " " + (x.time || "") + " · " + c.name + '</small></div><div class="amt">' + fmtDen(x.amount) + " den</div></div>";
  }).join("");
  list.querySelectorAll(".item").forEach(function (el) { el.onclick = function () { openEdit(el.getAttribute("data-id")); }; });
}
function openManual(item) {
  editId = item ? item.id : null;
  $("manualTitle").textContent = item ? "Izmeni trosok" : "Nov trosok";
  var p = item ? { date: item.date, time: item.time } : nowParts();
  $("amount").value = item ? item.amount : "";
  $("note").value = item ? (item.shop || "") : "";
  $("pay").value = item ? (item.pay || "karticka") : "karticka";
  $("date").value = p.date;
  $("time").value = p.time || "12:00";
  selectedCat = item ? item.cat : "hrana";
  renderChips($("catChips"), selectedCat);
  $("deleteManual").style.display = item ? "block" : "none";
  $("manualSheet").classList.add("open");
}
function openEdit(id) { for (var i = 0; i < state.length; i++) if (state[i].id === id) { openManual(state[i]); return; } }
function closeSheets() { $("manualSheet").classList.remove("open"); $("scanSheet").classList.remove("open"); }
$("openManual").onclick = function () { openManual(null); };
$("cancelManual").onclick = closeSheets;
$("saveManual").onclick = function () {
  var amount = Number(String($("amount").value).replace(",", "."));
  if (!amount || amount <= 0) { alert("Vnesi suma."); return; }
  var rec = { id: editId || (Date.now() + "-" + Math.random().toString(16).slice(2)), amount: amount, cat: selectedCat, date: $("date").value, time: $("time").value, shop: $("note").value.trim(), pay: $("pay").value, source: "manual" };
  if (editId) state = state.map(function (x) { return x.id === editId ? Object.assign({}, x, rec) : x; });
  else state.unshift(rec);
  save(); closeSheets(); render();
};
$("deleteManual").onclick = function () {
  if (!editId) return;
  if (confirm("Da se izbrise ovoj trosok?")) { state = state.filter(function (x) { return x.id !== editId; }); save(); closeSheets(); render(); }
};
$("openScan").onclick = function () {
  var p = nowParts();
  $("scanDate").value = p.date; $("scanTime").value = p.time; $("scanAmount").value = ""; $("scanShop").value = ""; $("scanItems").value = "";
  $("ocrStatus").textContent = "Otvori kamera ili galerija."; $("preview").style.display = "none"; receiptDataUrl = "";
  $("scanCat").innerHTML = CATS.map(function (c) { return '<option value="' + c.id + '">' + c.name + "</option>"; }).join("");
  $("prodList").innerHTML = ""; $("scanSheet").classList.add("open");
};
$("cancelScan").onclick = closeSheets;
$("btnCam").onclick = function () { $("photoCam").click(); };
$("btnGal").onclick = function () { $("photoGal").click(); };
$("openSettings").onclick = function () {
  var s = {}; try { s = JSON.parse(localStorage.getItem("fiskai.settings") || "{}"); } catch (e) {}
  $("apiKey").value = s.apiKey || ""; $("aiModel").value = s.model || "grok-4"; $("settingsSheet").classList.add("open");
};
$("cancelSettings").onclick = function () { $("settingsSheet").classList.remove("open"); };
$("saveSettings").onclick = function () {
  localStorage.setItem("fiskai.settings", JSON.stringify({ apiKey: $("apiKey").value.trim(), model: $("aiModel").value }));
  $("settingsSheet").classList.remove("open");
};
function compressImage(file) {
  return new Promise(function (resolve) {
    var img = new Image(); var url = URL.createObjectURL(file);
    img.onload = function () {
      var canvas = document.createElement("canvas"); var max = 1200; var width = img.width; var height = img.height;
      if (width > max) { height = height * max / width; width = max; }
      canvas.width = width; canvas.height = height; canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.72)); URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
function onPhoto(e) {
  var file = e.target.files && e.target.files[0];
  if (!file) return;
  compressImage(file).then(function (data) {
    receiptDataUrl = data; $("preview").src = data; $("preview").style.display = "block";
    $("ocrStatus").textContent = "Vnesi suma i prodavnica, pa zacuvaj.";
  });
}
$("photoCam").onchange = onPhoto;
$("photoGal").onchange = onPhoto;
$("saveScan").onclick = function () {
  var amount = Number(String($("scanAmount").value).replace(",", "."));
  if (!amount || amount <= 0) { alert("Vnesi ja sumata."); return; }
  state.unshift({ id: Date.now() + "-" + Math.random().toString(16).slice(2), amount: amount, cat: $("scanCat").value, date: $("scanDate").value, time: $("scanTime").value, shop: $("scanShop").value.trim(), products: $("scanItems").value.trim(), photo: receiptDataUrl, source: "scan", pay: "karticka" });
  save(); closeSheets(); render();
};
$("prevMonth").onclick = function () { view.setMonth(view.getMonth() - 1); render(); };
$("nextMonth").onclick = function () { view.setMonth(view.getMonth() + 1); render(); };
$("exportBtn").onclick = function () {
  var rows = [["datum", "vreme", "suma", "grupa", "prodavnica", "plakanje", "izvor"]];
  filtered().forEach(function (x) { rows.push([x.date, x.time, x.amount, x.cat, x.shop || "", x.pay || "", x.source || ""]); });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([rows.map(function (r) { return r.join(","); }).join("\n")], { type: "text/csv" }));
  a.download = "trosoci-" + monthKey(view) + ".csv"; a.click();
};
$("clearMonthBtn").onclick = function () {
  if (!confirm("Da se izbrisat site zapisi za ovoj mesec?")) return;
  var key = monthKey(view); state = state.filter(function (x) { return !(x.date && x.date.indexOf(key) === 0); }); save(); render();
};
document.querySelectorAll(".sheet").forEach(function (s) { s.addEventListener("click", function (e) { if (e.target === s) closeSheets(); }); });
render();
