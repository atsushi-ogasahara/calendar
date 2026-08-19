// --- 多言語対応データの定義 ---
const i18n = {
    ja: { 
        labels: ["モード","言語","週開始","六曜","祝日一覧"],
        weekStart: ["日曜","月曜"],
        nav: ["前年","次年"],
        modal: ["年を選択","キャンセル"],
        days: ["日","月","火","水","木","金","土"],
        months: m=>`${m+1}月`,
        updateTitle: "{year}年カレンダー",
        updateDesc: "{year}年のシンプルなオンラインカレンダーです。日付、これからの祝日、曜日をブラウザ上ですぐに確認できます。"
    },
    en: {
        labels: ["THEME","LANGUAGE","WEEK START","ROKUYO","Holiday List"],
        weekStart: ["SUN","MON"],
        nav: ["Prev Year","Next Year"],
        modal: ["Select Year","Cancel"],
        days: ["SUN","MON","TUE","WED","THU","FRI","SAT"],
        months: m=>["January","February","March","April","May","June","July","August","September","October","November","December"][m],
        updateTitle: "{year} Calendar EN",
        updateDesc: "Simple online calendar for {year}. Quickly view calendar dates, upcoming holidays, and days of the week in your browser."
    },
    fr: {
        labels: ["MODE","LANGUE","DÉBUT","ROKUYO","Jours fériés"],
        weekStart: ["DIM","LUN"],
        nav: ["Année préc.","Année suiv."],
        modal: ["Choisir l'année","Annuler"],
        days: ["DIM","LUN","MAR","MER","JEU","VEN","SAM"],
        months: m=>["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][m],
        updateTitle: "Calendrier {year} FR",
        updateDesc: "Calendrier en ligne simple pour {year}. Consultez rapidement les dates du calendrier, les jours fériés à venir et les jours de la semaine dans votre navigateur."
    },
    de: {
        labels: ["MODUS","SPRACHE","START","ROKUYO","Feiertage"],
        weekStart: ["SO","MO"],
        nav: ["Vorheriges Jahr","Nächstes Jahr"],
        modal: ["Jahr wählen","Abbrechen"],
        days: ["SO","MO","DI","MI","DO","FR","SA"],
        months: m=>["Januar","Februar","März","April","Mai","Juin","Juli","Août","September","Oktober","November","Dezember"][m],
        updateTitle: "Kalender {year} DE",
        updateDesc: "Einfacher Online-Kalender für {year}. Schnelle Ansicht von Kalendertagen, bevorstehenden Feiertagen und Wochentagen in Ihrem Browser."
    },
    es: {
        labels: ["MODO","IDIOMA","INICIO","ROKUYO","Lista de festivos"],
        weekStart: ["DOM","LUN"],
        nav: ["Año anterior","Año siguiente"],
        modal: ["Elegir año","Cancelar"],
        days: ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"],
        months: m=>["Enero","Février","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m],
        updateTitle: "Calendario {year} ES",
        updateDesc: "Calendario en línea simple para {year}. Vea rápidamente las fechas del calendario, los próximos días festivos y los días de la semana en su navegador."
    },
    it: {
        labels: ["MODO","LINGUA","INIZIO","ROKUYO","Festività"],
        weekStart: ["DOM","LUN"],
        nav: ["Anno prec.","Anno succ."],
        modal: ["Scegli anno","Annulla"],
        days: ["DOM","LUN","MAR","MER","GIO","VEN","SAB"],
        months: m=>["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"][m],
        updateTitle: "Calendario {year} IT",
        updateDesc: "Calendario in linea semplice per {year}. Visualizza rapidamente le date del calendario, le festività imminenti e i giorni della settimana nel tuo browser."
    }
};

// --- URLのハッシュ（#）から最新の状態を都度取得（file:// 対応） ---
function getAppState() {
    const urlParams = new URLSearchParams(window.location.search);
    const yearParam = urlParams.get('year');

    const hashString = window.location.hash.startsWith('#') 
        ? window.location.hash.slice(1) 
        : window.location.hash;
    const hashParams = new URLSearchParams(hashString);

    const startParam = hashParams.get('start');
    const rokuyoParam = hashParams.get('rokuyo');
    const themeParam = hashParams.get('theme');

    const pathParts = window.location.pathname.split('/');
    const supportedLangs = ['ja', 'fr', 'de', 'es', 'it'];
    const detectedLang = pathParts.find(part => supportedLangs.includes(part)) || 'en';

    return {
        year: yearParam ? parseInt(yearParam, 10) : new Date().getFullYear(),
        lang: detectedLang,
        start: startParam ? parseInt(startParam, 10) : 0,
        rokuyo: rokuyoParam === 'true',
        theme: themeParam || 'light'   
    };
}

// --- URLの設定値を書き換える ---
function updateURLParam(key, value) {
    // 1. 現在の「クエリ（?）」と「ハッシュ（#）」をそれぞれ個別に取得
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    if (key === 'year') {
        // [A] yearの更新：クエリ側に入れる
        urlParams.set('year', value);
    } else {
        // [B] theme, start, rokuyoの更新：ハッシュ側に入れる
        hashParams.set(key, value);
    }

    // 2. 組み立て直す（例: ?year=2026#theme=dark&start=0）
    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';
    const hashString = hashParams.toString() ? `#${hashParams.toString()}` : '';
    const newUrl = `${window.location.pathname}${queryString}${hashString}`;

    // 3. 【超重要】history.pushState でURL全体をリロードなしで上書き
    window.history.pushState({ year: getAppState().year }, '', newUrl);

    // 4. history.pushState は自動でイベントを起こさないため、
    // 画面の同期（ダークモード適用やカレンダー再描画）を手動で即座に実行する
    syncViewWithURL();
}

// --- 言語切り替え時の処理（ハッシュを連れて隣のフォルダへ） ---
function navigateLanguage(event, targetLang) {
    // 1. まず通常のリンク遷移をキャンセルする
    event.preventDefault();

    const state = getAppState();
    // 同じ言語が選ばれた場合は何もしない
    if (targetLang === state.lang) return;
    
    // 2. 現在のクエリ（?year=）とハッシュ（#）をそのまま取得
    const currentParams = window.location.search + window.location.hash;
    
    // 3. パラメータを結合して、目的の言語フォルダへ遷移
    window.location.href = `../${targetLang}/` + currentParams;
}

// --- 祝日データ計算ロジック ---
function getHolidays(y) {
    const h = {};
    const add = (m, d, nmsg) => { 
        h[`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`] = nmsg; 
    };
    const happy = (m, n, nmsg) => {
        let d = 1 + (7 - new Date(y, m-1, 1).getDay() + 1) % 7 + (n-1)*7;
        add(m, d, nmsg);
    };
    const easter = (() => { 
        const a=y%19, b=Math.floor(y/100), c=y%100, d=Math.floor(b/4), e=b%4, f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3), hCalc=(19*a+b-d-g+15)%30, i=Math.floor(c/4), k=c%4, L=(32+2*e+2*i-hCalc-k)%7, mCalc=Math.floor((a+11*hCalc+22*L)/451), month=Math.floor((hCalc+L-7*mCalc+114)/31), day=((hCalc+L-7*mCalc+114)%31)+1; 
        return new Date(y, month-1, day); 
    })();
    const addRelativeEaster = (offset, nmsg) => { 
        const d = new Date(easter); 
        d.setDate(d.getDate() + offset); 
        h[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`] = nmsg;
    };

    const state = getAppState();
    const currentLang = state.lang;

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
        add(3, shun, {ja:"春分の日", en:"Equinox"}); 
        add(9, shub, {ja:"秋分の日", en:"Equinox"});
        
        Object.keys(h).sort().forEach(k => {
            let d = new Date(k); 
            if(d.getDay() === 0) {
                let n = new Date(d); 
                let nk;
                do { 
                    n.setDate(n.getDate()+1); 
                    nk = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; 
                } while(h[nk]);
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
        add(1, 1, {ja:"元日", en:"New Year's Day"});
        happy(1, 3, {ja:"MLK記念日", en:"MLK Day"});
        happy(2, 3, {ja:"大統領の日", en:"Presidents' Day"});
        let mem = new Date(y, 4, 31); 
        while(mem.getDay() !== 1) { mem.setDate(mem.getDate() - 1); }
        add(5, mem.getDate(), {ja:"戦没将兵追悼", en:"Memorial Day"});
        add(6, 19, {ja:"独立記念", en:"Juneteenth"}); 
        add(7, 4, {ja:"独立記念日", en:"Independence"});
        happy(9, 1, {ja:"労働感謝", en:"Labor Day"}); 
        happy(10, 2, {ja:"コロンブス", en:"Columbus Day"});
        add(11, 11, {ja:"復員軍人", en:"Veterans Day"});
        happy(11, 4, {ja:"感謝祭", en:"Thanksgiving"}); 
        add(12, 25, {ja:"クリスマス", en:"Christmas"});
    }
    return h;
}

// 六曜計算ロジック
function getRokuyo(y,m,d) {
    const list = ["大安","赤口","先勝","友引","先負","仏滅"];
    return list[(Math.floor((new Date(y,m,d)-new Date(2020,0,1))/86400000)+4)%6];
}

// --- カレンダー描画関数 ---
function renderCalendar() {
    const state = getAppState();
    const t = i18n[state.lang] || i18n['en'];

    const currentYear = state.year;
    let titleText = t.updateTitle.replace('{year}', currentYear);
    document.title = titleText;

    let descText = t.updateDesc.replace('{year}', currentYear);
    document.getElementById('meta-description').setAttribute('content', descText);

    document.getElementById('yearDisplayTop').textContent = state.year;
    document.getElementById('prevBtn').textContent = t.nav[0];
    document.getElementById('nextBtn').textContent = t.nav[1];

    document.getElementById('startSun').textContent = t.weekStart[0];
    document.getElementById('startMon').textContent = t.weekStart[1];

    const labels = document.querySelectorAll('.menu-label');
    t.labels.forEach((l,i) => { if(labels[i]) labels[i].textContent = l; });
    const listTitleElement = document.getElementById('holidayListTitle');
    if (listTitleElement) {
        if (state.lang === 'ja') {
            listTitleElement.textContent = `${state.year}年の祝日・休日一覧`;
        } else {
            listTitleElement.textContent = `List of Holidays in ${state.year}`;
        }
    }
    
    const container = document.getElementById('yearContainer');
    const hGrid = document.getElementById('holidayGrid');
    container.innerHTML = ''; 
    hGrid.innerHTML = '';
    
    const holidays = getHolidays(state.year);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    
    for (let m=0; m<12; m++) {
        const card = document.createElement('div');
        card.className = 'month-card';
        let html = `<h2 class="month-title">${t.months(m)}</h2><table><thead><tr>`;
        
        for (let i=0; i<7; i++) {
            let idx = (i + state.start) % 7;
            html += `<th class="${idx===0?'bg-sun-holiday':(idx===6?'bg-sat':'')}">${t.days[idx]}</th>`;
        }
        html += `</tr></thead><tbody>`;
        
        let first = new Date(state.year, m, 1).getDay();
        let last = new Date(state.year, m+1, 0).getDate();
        let offset = (first - state.start + 7) % 7;
        let d = 1;
        
        for (let r=0; r<6; r++) {
            html += `<tr>`;
            for (let c=0; c<7; c++) {
                let cellIdx = r*7 + c;
                if(cellIdx < offset || d > last) html += `<td></td>`;
                else {
                    let key = `${state.year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    let dow = (cellIdx + state.start) % 7;
                    let cls = (holidays[key] || dow===0)?'bg-sun-holiday':(dow===6?'bg-sat':'');
                    if(key === todayStr) cls += ' today-cell';
                    
                    html += `<td class="${cls}"><span class="date-num">${d}</span>`;
                    if(state.rokuyo && state.lang==='ja') {
                        html += `<span class="rokuyo">${getRokuyo(state.year, m, d)}</span>`;
                    }
                    html += `</td>`; 
                    d++;
                }
            }
            html += `</tr>`; 
            if(d > last) break;
        }
        card.innerHTML = html + `</tbody></table>`;
        container.appendChild(card);
    }
    
    // hGrid（祝日コンテナ）の中身を初期化（今回は <ul> タグとして出力する準備）
    hGrid.innerHTML = '<ul class="holiday-list-ul"></ul>';
    const ulContainer = hGrid.querySelector('.holiday-list-ul');

    Object.keys(holidays).sort().forEach(k => {
        const [y, m, d] = k.split('-');
        const holidayName = holidays[k][state.lang] || holidays[k]['en'] || holidays[k]['ja'];
    
        // 【SEO対策】div ではなく <li> タグを使い、日付には時間要素を示す <time> タグを導入
        ulContainer.innerHTML += `
            <li class="holiday-item">
                <time datetime="${y}-${m}-${d}" class="holiday-date">${m}/${d}</time>
                <span class="holiday-name">${holidayName}</span>
            </li>`;
    });
}

// --- UI状態同期関数 ---
function syncViewWithURL() {
    const state = getAppState();

    // ① テーマの変更適用
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('themeLight').classList.toggle('active', state.theme === 'light');
    document.getElementById('themeDark').classList.toggle('active', state.theme === 'dark');

    // ② 言語ボタンのアクティブ状態
    document.querySelectorAll('#langSelector .btn-toggle').forEach(b => {
        const txt = b.textContent;
        const isActive = (state.lang==='ja'&&txt==='JP') || (state.lang==='en'&&txt==='EN') || (txt.toLowerCase()===state.lang);
        b.classList.toggle('active', isActive);
    });
    document.getElementById('rokuyoMenu').style.display = (state.lang === 'ja' ? 'block' : 'none');

    // ③ 週の開始日ボタンのアクティブ状態
    document.getElementById('startSun').classList.toggle('active', state.start === 0);
    document.getElementById('startMon').classList.toggle('active', state.start === 1);

    // ④ 六曜ボタンのアクティブ状態
    document.getElementById('rokuyoOn').classList.toggle('active', state.rokuyo);
    document.getElementById('rokuyoOff').classList.toggle('active', !state.rokuyo);

    // ⑤ カレンダーを描画
    renderCalendar();
}

// --- その他のメニュー・モーダル操作 ---
function toggleMenu() { 
    document.getElementById('sidePanel').classList.toggle('open'); 
    document.getElementById('overlay').classList.toggle('show'); 
}

function openYearModal() {
    const modal = document.getElementById('yearModal');
    const list = document.getElementById('yearList');
    const overlay = document.getElementById('overlay');
    const state = getAppState();
    const t = i18n[state.lang];
    
    document.getElementById('modalTitle').textContent = t.modal[0];
    document.getElementById('modalCloseBtn').textContent = t.modal[1];
    list.innerHTML = '';
    
    for(let i = state.year - 50; i <= state.year + 50; i++) {
        const item = document.createElement('div');
        item.className = 'year-item' + (i === state.year ? ' active' : '');
        item.textContent = i;
        item.onclick = () => { 
            updateURLParam('year', i); 
            closeYearModal(); 
        };
        list.appendChild(item);
        if(i === state.year) setTimeout(() => item.scrollIntoView({block: 'center'}), 10);
    }
    modal.classList.add('show'); 
    overlay.classList.add('show');
}

function closeYearModal() {
    document.getElementById('yearModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

function handleOverlayClick() {
    closeYearModal(); 
    document.getElementById('sidePanel').classList.remove('open');
}

// --- イベント設定と初期起動 ---
document.getElementById('prevBtn').onclick = () => { 
    updateURLParam('year', getAppState().year - 1); 
};
document.getElementById('nextBtn').onclick = () => { 
    updateURLParam('year', getAppState().year + 1); 
};

// 【重要】ブラウザの「戻る・進む」ボタンでクエリパラメータ(?year=)が変わったことを検知して画面を同期
window.addEventListener('popstate', syncViewWithURL);

// ハッシュ変更イベント（file:// スキームで動作するための鍵）
window.addEventListener('hashchange', syncViewWithURL);

// 初回起動
document.addEventListener('DOMContentLoaded', syncViewWithURL);
