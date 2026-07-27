let currentYear = new Date().getFullYear();
let currentLang = 'ja';
let startDayOfWeek = 0;
let showRokuyo = false;

const i18n = {
    ja: { labels: ["モード","言語","週開始","六曜","祝日一覧"], nav: ["前年","次年"], modal: ["年を選択","キャンセル"], days: ["日","月","火","水","木","金","土"], months: m=>`${m+1}月` },
    en: { labels: ["THEME","LANGUAGE","WEEK START","ROKUYO","Holiday List"], nav: ["Prev Year","Next Year"], modal: ["Select Year","Cancel"], days: ["SUN","MON","TUE","WED","THU","FRI","SAT"], months: m=>["January","February","March","April","May","June","July","August","September","October","November","December"][m] },
    fr: { labels: ["MODE","LANGUE","DÉBUT","ROKUYO","Jours fériés"], nav: ["Année préc.","Année suiv."], modal: ["Choisir l'année","Annuler"], days: ["DIM","LUN","MAR","MER","JEU","VEN","SAM"], months: m=>["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][m] },
    de: { labels: ["MODUS","SPRACHE","START","ROKUYO","Feiertage"], nav: ["Vorheriges Jahr","Nächstes Jahr"], modal: ["Jahr wählen","Abbrechen"], days: ["SO","MO","DI","MI","DO","FR","SA"], months: m=>["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][m] },
    es: { labels: ["MODO","IDIOMA","INICIO","ROKUYO","Lista de festivos"], nav: ["Año anterior","Año siguiente"], modal: ["Elegir año","Cancelar"], days: ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"], months: m=>["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m] },
    it: { labels: ["MODO","LINGUA","INIZIO","ROKUYO","Festività"], nav: ["Anno prec.","Anno succ."], modal: ["Scegli anno","Annulla"], days: ["DOM","LUN","MAR","MER","GIO","VEN","SAB"], months: m=>["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"][m] }
};

function openYearModal() {
    const modal = document.getElementById('yearModal');
    const list = document.getElementById('yearList');
    const overlay = document.getElementById('overlay');
    const t = i18n[currentLang];
    document.getElementById('modalTitle').textContent = t.modal[0];
    document.getElementById('modalCloseBtn').textContent = t.modal[1];
    list.innerHTML = '';
    for(let i = currentYear - 50; i <= currentYear + 50; i++) {
        const item = document.createElement('div');
        item.className = 'year-item' + (i === currentYear ? ' active' : '');
        item.textContent = i;
        item.onclick = () => { currentYear = i; renderCalendar(); closeYearModal(); };
        list.appendChild(item);
        if(i === currentYear) setTimeout(() => item.scrollIntoView({block: 'center'}), 10);
    }
    modal.classList.add('show'); overlay.classList.add('show');
}

function closeYearModal() {
    document.getElementById('yearModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

function handleOverlayClick() {
    closeYearModal(); document.getElementById('sidePanel').classList.remove('open');
}

function getHolidays(y) {
    const h = {};
    const add = (m,d,n) => { h[`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`] = n; };
    const happy = (m,n,nmsg) => {
        let d = 1 + (7 - new Date(y,m-1,1).getDay() + 1) % 7 + (n-1)*7;
        add(m, d, nmsg);
    };
    const easter = (() => { const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),hCalc=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,L=(32+2*e+2*i-hCalc-k)%7,mCalc=Math.floor((a+11*hCalc+22*L)/451),month=Math.floor((hCalc+L-7*mCalc+114)/31),day=((hCalc+L-7*mCalc+114)%31)+1; return new Date(y,month-1,day); })();
    const addRelativeEaster = (offset, nmsg) => { const d=new Date(easter); d.setDate(d.getDate()+offset); add(d.getMonth()+1, d.getDate(), nmsg); };

    if (currentLang === 'ja') {
        const data = [
            {m:1, d:1, ja:"元日", en:"New Year"}, {m:2, d:11, ja:"建国記念日", en:"Foundation"},
            {m:2, d:23, ja:"天皇誕生日", en:"Birthday"}, {m:4, d:29, ja:"昭和の日", en:"Showa"},
            {m:5, d:3, ja:"憲法記念日", en:"Constitution"}, {m:5, d:4, ja:"みどりの日", en:"Green"},
            {m:5, d:5, ja:"こどもの日", en:"Children"}, {m:8, d:11, ja:"山の日", en:"Mountain"},
            {m:11, d:3, ja:"文化の日", en:"Culture"}, {m:11, d:23, ja:"勤労感謝", en:"Labor"}
        ];
        data.forEach(i => add(i.m, i.d, i));
        happy(1, 2, {ja:"成人の日", en:"Coming of Age"});
        happy(7, 3, {ja:"海の日", en:"Marine Day"});
        happy(9, 3, {ja:"敬老の日", en:"Respect"});
        happy(10, 2, {ja:"スポーツ", en:"Sports"});
        const shun = Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
        const shub = Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
        add(3, shun, {ja:"春分の日", en:"Equinox"}); add(9, shub, {ja:"秋分の日", en:"Equinox"});
        
        Object.keys(h).sort().forEach(k => {
            let d = new Date(k); if(d.getDay() === 0) {
                let n = new Date(d); let nk;
                do { n.setDate(n.getDate()+1); nk = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; } while(h[nk]);
                h[nk] = {ja:"振替休日", en:"Sub. Hol."};
            }
        });
    } else if (currentLang === 'fr') {
        add(1, 1, {ja:"元日", fr:"Nouvel An"});
        add(5, 1, {ja:"メーデー", fr:"Fête du Travail"});
        add(5, 8, {ja:"第二次大戦勝利記念日", fr:"Victoire 1945"});
        add(7, 14, {ja:"革命記念日", fr:"Fête Nationale"});
        add(8, 15, {ja:"聖母被昇天祭", fr:"Assomption"});
        add(11, 1, {ja:"諸聖人の祝日", fr:"Toussaint"});
        add(11, 11, {ja:"第一次大戦休戦記念日", fr:"Armistice 1918"});
        add(12, 25, {ja:"クリスマス", fr:"Noël"});
        addRelativeEaster(1, {ja:"イースター・マンデー", fr:"Lundi de Pâques"});
        addRelativeEaster(39, {ja:"キリスト昇天祭", fr:"Ascension"});
        addRelativeEaster(50, {ja:"精霊降臨祭翌月曜", fr:"Lundi de Pentecôte"});
    } else if (currentLang === 'de') {
        add(1, 1, {ja:"元日", de:"Neujahr"});
        add(5, 1, {ja:"メーデー", de:"Tag der Arbeit"});
        add(10, 3, {ja:"ドイツ統一の日", de:"Tag der Deutschen Einheit"});
        add(12, 25, {ja:"クリスマス第1日", de:"1. Weihnachtstag"});
        add(12, 26, {ja:"クリスマス第2日", de:"2. Weihnachtstag"});
        addRelativeEaster(-2, {ja:"聖金曜日", de:"Karfreitag"});
        addRelativeEaster(1, {ja:"イースター・マンデー", de:"Ostermontag"});
        addRelativeEaster(39, {ja:"キリスト昇天祭", de:"Christi Himmelfahrt"});
        addRelativeEaster(50, {ja:"精霊降臨祭翌月曜", de:"Pfingstmontag"});
    } else if (currentLang === 'es') {
        add(1, 1, {ja:"元日", es:"Año Nuevo"});
        add(1, 6, {ja:"公現祭", es:"Día de Reyes"});
        add(5, 1, {ja:"メーデー", es:"Fiesta del Trabajo"});
        add(8, 15, {ja:"聖母被昇天祭", es:"Asunción de la Virgen"});
        add(10, 12, {ja:"ナショナルデー", es:"Fiesta Nacional de España"});
        add(11, 1, {ja:"諸聖人の祝日", es:"Día de Todos los Santos"});
        add(12, 6, {ja:"憲法記念日", es:"Día de la Constitución"});
        add(12, 8, {ja:"無原罪の御宿り", es:"Inmaculada Concepción"});
        add(12, 25, {ja:"クリスマス", es:"Navidad"});
        addRelativeEaster(-2, {ja:"聖金曜日", es:"Viernes Santo"});
    } else if (currentLang === 'it') {
        add(1, 1, {ja:"元日", it:"Capodanno"});
        add(1, 6, {ja:"公現祭", it:"Epifania"});
        add(4, 25, {ja:"解放記念日", it:"Festa della Liberazione"});
        add(5, 1, {ja:"メーデー", it:"Festa dei Lavoratori"});
        add(6, 2, {ja:"共和国記念日", it:"Festa della Repubblica"});
        add(8, 15, {ja:"聖母被昇天祭", it:"Ferragosto"});
        add(11, 1, {ja:"諸聖人の祝日", it:"Tutti i Santi"});
        add(12, 8, {ja:"無原罪の御宿り", it:"Immacolata Concezione"});
        add(12, 25, {ja:"クリスマス", it:"Natale"});
        add(12, 26, {ja:"聖ステファノ祝日", it:"Santo Stefano"});
        addRelativeEaster(1, {ja:"イースター・マンデー", it:"Lunedì dell'Angelo"});
    } else {
        // アメリカ（その他の言語用共通テンプレート）
        add(1, 1, {ja:"元日", en:"New Year's Day"});
        happy(1, 3, {ja:"MLK記念日", en:"MLK Day"});
        happy(2, 3, {ja:"大統領の日", en:"Presidents' Day"});
        let mem = new Date(y, 4, 31); while(mem.getDay() !== 1) { mem.setDate(mem.getDate() - 1); }
        add(5, mem.getDate(), {ja:"戦没将兵追悼", en:"Memorial Day"});
        add(6, 19, {ja:"独立記念", en:"Juneteenth"}); add(7, 4, {ja:"独立記念日", en:"Independence"});
        happy(9, 1, {ja:"労働感謝", en:"Labor Day"}); happy(10, 2, {ja:"コロンブス", en:"Columbus Day"});
        add(11, 11, {ja:"復員軍人", en:"Veterans Day"});
        happy(11, 4, {ja:"感謝祭", en:"Thanksgiving"}); add(12, 25, {ja:"クリスマス", en:"Christmas"});
    }
    return h;
}

function getRokuyo(y,m,d) {
    const list = ["大安","赤口","先勝","友引","先負","仏滅"];
    return list[(Math.floor((new Date(y,m,d)-new Date(2020,0,1))/86400000)+4)%6];
}

function renderCalendar() {
    const t = i18n[currentLang];
    document.getElementById('yearDisplayTop').textContent = currentYear;
    document.getElementById('prevBtn').textContent = t.nav[0];
    document.getElementById('nextBtn').textContent = t.nav[1];
    const labels = document.querySelectorAll('.menu-label');
    t.labels.forEach((l,i) => { if(labels[i]) labels[i].textContent = l; });
    document.getElementById('holidayListTitle').textContent = t.labels[4];
    const container = document.getElementById('yearContainer');
    const hGrid = document.getElementById('holidayGrid');
    container.innerHTML = ''; hGrid.innerHTML = '';
    const holidays = getHolidays(currentYear);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    for (let m=0; m<12; m++) {
        const card = document.createElement('div');
        card.className = 'month-card';
        let html = `<div class="month-title">${t.months(m)}</div><table><thead><tr>`;
        for (let i=0; i<7; i++) {
            let idx = (i+startDayOfWeek)%7;
            html += `<th class="${idx===0?'bg-sun-holiday':(idx===6?'bg-sat':'')}">${t.days[idx]}</th>`;
        }
        html += `</tr></thead><tbody>`;
        let first = new Date(currentYear, m, 1).getDay();
        let last = new Date(currentYear, m+1, 0).getDate();
        let offset = (first - startDayOfWeek + 7) % 7;
        let d = 1;
        for (let r=0; r<6; r++) {
            html += `<tr>`;
            for (let c=0; c<7; c++) {
                let cellIdx = r*7 + c;
                if(cellIdx < offset || d > last) html += `<td></td>`;
                else {
                    let key = `${currentYear}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    let dow = (cellIdx + startDayOfWeek)%7;
                    let cls = (holidays[key] || dow===0)?'bg-sun-holiday':(dow===6?'bg-sat':'');
                    if(key === todayStr) cls += ' today-cell';
                    html += `<td class="${cls}"><span class="date-num">${d}</span>`;
                    if(showRokuyo && currentLang==='ja') html += `<span class="rokuyo">${getRokuyo(currentYear, m, d)}</span>`;
                    html += `</td>`; d++;
                }
            }
            html += `</tr>`; if(d > last) break;
        }
        card.innerHTML = html + `</tbody></table>`;
        container.appendChild(card);
    }
    Object.keys(holidays).sort().forEach(k => {
        const [y,m,d] = k.split('-');
        hGrid.innerHTML += `<div class="holiday-item"><span class="holiday-date">${m}/${d}</span><span>${holidays[k][currentLang]}</span></div>`;
    });
}

function toggleMenu() { document.getElementById('sidePanel').classList.toggle('open'); document.getElementById('overlay').classList.toggle('show'); }
function setTheme(m) { document.documentElement.setAttribute('data-theme', m); document.getElementById('themeLight').classList.toggle('active', m==='light'); document.getElementById('themeDark').classList.toggle('active', m==='dark'); }
function setLang(l) { 
    currentLang = l;
    document.querySelectorAll('#langSelector .btn-toggle').forEach(b => {
        const txt = b.textContent;
        b.classList.toggle('active', (l==='ja'&&txt==='JP') || (l==='en'&&txt==='EN') || (txt.toLowerCase()===l));
    });
    document.getElementById('rokuyoMenu').style.display = (l==='ja' ? 'block' : 'none');
    renderCalendar(); 
}
function setStartDay(d) { startDayOfWeek = d; document.getElementById('startSun').classList.toggle('active', d===0); document.getElementById('startMon').classList.toggle('active', d===1); renderCalendar(); }
function toggleRokuyo(b) { showRokuyo = b; document.getElementById('rokuyoOn').classList.toggle('active', b); document.getElementById('rokuyoOff').classList.toggle('active', !b); renderCalendar(); }

document.getElementById('prevBtn').onclick = () => { currentYear--; renderCalendar(); };
document.getElementById('nextBtn').onclick = () => { currentYear++; renderCalendar(); };
renderCalendar();
