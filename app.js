// Registro del Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('ServiceWorker registrado correctamente'))
      .catch(err => console.log('Error al registrar ServiceWorker: ', err));
  });
}

window.onpopstate = function() { closeModals(); };

// BASE DE DATOS DE FÁBRICA
const PRECIOS_FABRICA = {
    lona:{pub:5.5,fin:8}, adh:{pub:5.5,fin:8}, micro:{pub:7,fin:9}, pana:{pub:9,fin:13}, lam:{pub:4,fin:5},
    d_a3:{pub:1.4,fin:1.55}, d_a4:{pub:0.7,fin:0.8}, d_sa3:{pub:1.75,fin:1.9},
    f_a6:{pub:40,fin:40}, f_a5:{pub:55,fin:55}, f_a4:{pub:110,fin:110},
    o_a3:{pub:180,fin:180}, o_3550:{pub:190,fin:190}, o_a4:{pub:120,fin:120}, o_a5:{pub:90,fin:90}, o_a6:{pub:70,fin:70},
    t_estandar:{pub:15,fin:30}, t_mate:{pub:45,fin:45}, t_uv:{pub:50,fin:50},
    c_bolsillo:{pub:0.75,fin:0.85}, troquel:{pub:15,fin:15},
    plotter:{pub:3,fin:4.5}, laser_m2:{pub:12,fin:15}, acrilico_m2:{pub:50,fin:50}, laser_min:{pub:0.35,fin:0.35}, laminado_s:{pub:4,fin:5},
    caja:{pub:65,fin:75}, bastidor:{pub:14,fin:16}, panelado:{pub:35,fin:35}, tensado:{pub:7,fin:7}, alu_est:{pub:90,fin:90}, valla_postes:{pub:40.75,fin:40.75},
    l_acrilico_acrilico: {pub: 1.75, fin: 1.75}, l_acrilico_aluminio: {pub: 1.5, fin: 1.5}, l_tol: {pub: 1.9, fin: 1.9}, l_acero: {pub: 2.5, fin: 2.5}, l_descuento_led: {pub: 0.15, fin: 0.15},
    fuente_12v:{pub:11,fin:12}, tira_led:{pub:15,fin:16}, punto_neon:{pub:1.5,fin:1.5},
    alu:{pub:70,fin:70}, sintra_3:{pub:6,fin:8}, sintra_6:{pub:10,fin:12}, sintra_10:{pub:15,fin:18},
    mdf_15b:{pub:11,fin:11}, mdf_3:{pub:7,fin:9}, mdf_59:{pub:9,fin:11}, mdf_10:{pub:10,fin:12},
    ranurado:{pub:25,fin:25}, arenado:{pub:6.5,fin:10}, cartoncillo:{pub:2.05,fin:2.05}, lona_respaldo:{pub:2.5,fin:2.5},
    barilla:{pub:0.6,fin:0.6}, acri_3:{pub:50,fin:50}, acri_2:{pub:35,fin:35}, canto_duro:{pub:0.012,fin:0.012},
    mano_obra:{pub:15,fin:15}, doble_fast:{pub:4,fin:4}, extras_gen:{pub:5,fin:5}, hilo_corte:{pub:0.006,fin:0.006}, timer:{pub:25,fin:25},
    p1:{pub:15,fin:15}, p2:{pub:20,fin:20}, p3:{pub:30,fin:30}, p4:{pub:45,fin:45}
};

const EXTRAS_FABRICA = [];

let preciosBase = JSON.parse(localStorage.getItem('viva_precios_v8.7')) || PRECIOS_FABRICA;
let productosExtra = JSON.parse(localStorage.getItem('viva_productos_extra_v8.7')) || EXTRAS_FABRICA;
let estadoCotizacion = {};

const CATEGORIAS_MAP = {
    granformato: ['lona', 'adh', 'micro', 'pana', 'lam'],
    papeleria: ['digital_las', 'flyers', 'offset', 'tarjetas', 'carpeta', 'troquel'],
    servicios: ['plotter', 'laser_m2', 'acrilico_m2', 'laser_min', 'laminado_s'],
    rotulacion: ['caja', 'bastidor', 'panelado', 'tensado', 'alu_est', 'valla_postes', 'letras', 'neon', 'branding'],
    materiales: ['alu', 'sintra', 'mdf', 'ranurado', 'arenado', 'cartoncillo', 'lona_respaldo', 'barilla', 'acri_3', 'acri_2', 'canto_duro'],
    extras: ['mano_obra', 'doble_fast', 'extras_gen', 'hilo_corte', 'timer', 'instala', 'dinamicos']
};

const DIC_NOMBRES = { 
    lona:"Lona (m²)", adh:"Adhesivo (m²)", micro:"Microperforado (m²)", pana:"Panaflex (m²)", lam:"Adhesivo Laminado (m²)",
    digital_las:"Láser Impresión", flyers:"Flyers (1000u)", offset:"Impresión Offset (1000u)", tarjetas:"Tarjetas (1000u)", carpeta:"Carpeta Full Color", troquel:"Troquel",
    plotter:"Corte Plóter ($)", laser_m2:"Corte Láser (m²)", acrilico_m2:"Acrílico (m²)", laser_min:"Corte Láser (min)", laminado_s:"Laminado",
    caja:"Caja de Luz (m²)", bastidor:"Bastidor Metálico (m²)", panelado:"Rótulo Panelado (m²)", tensado:"Tensado Lona (m²)", alu_est:"Alucobond + Estructural (m²)", valla_postes:"Estructura Valla + Postes (m²)", letras:"Letras 3D", neon:"Rótulo Neón LED", branding:"Branding Vehicular (m²)",
    alu:"Alucobond (m²)", sintra:"PVC / Sintra (m²)", mdf:"MDF (m²)", ranurado:"Tablero Ranurado (m²)", arenado:"Vinil Arenado (m²)", cartoncillo:"Cartoncillo (m²)", lona_respaldo:"Lona Respaldo (m²)", barilla:"Barilla Cromada (u)", acri_3:"Acrílico 3mm (m²)", acri_2:"Acrílico 2mm (m²)", canto_duro:"Canto Duro (cm)",
    mano_obra:"Mano de Obra", doble_fast:"Doble Fast", extras_gen:"Extras", hilo_corte:"Hilo de Corte", timer:"Timer", instala:"Instalación", dinamicos:"Ítems Dinámicos / Nuevos"
};

let numeroProformaActual = Date.now().toString().slice(-5);
const URL_NUBE = "https://script.google.com/macros/s/AKfycbw6o-tBVuM1R3Olz9kBfgeCC2v-oOlaPU2GeXEOOEybmiwKTMRvZC3OLd3hnZSsB7HY/exec";

async function obtenerSiguienteProforma() {
    try {
        const respuesta = await fetch(URL_NUBE);
        const num = await respuesta.text();
        numeroProformaActual = num.toString().padStart(5, '0');
    } catch (error) {
        console.error("Usando ID temporal por falta de conexión");
    }
    let numSpan = document.getElementById('proforma-number-display');
    if(!numSpan){
        numSpan = document.createElement('span');
        numSpan.id = 'proforma-number-display';
        numSpan.style = "font-size:0.6em; margin-left:10px; color:#f39200; font-family: sans-serif;";
        document.getElementById('display-logo').appendChild(numSpan);
    }
    numSpan.innerText = `N° ${numeroProformaActual}`;
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg; t.className = "show";
    setTimeout(() => { t.className = ""; }, 3000);
}

function cambiarSeccion(seccionId) {
    document.getElementById('view-dashboard').classList.remove('active');
    ['granformato', 'papeleria', 'servicios', 'rotulacion', 'materiales', 'extras'].forEach(k => {
        const el = document.getElementById('view-' + k);
        if(el) el.classList.remove('active');
    });
    if(seccionId === 'dashboard') {
        document.getElementById('view-dashboard').classList.add('active');
        document.getElementById('stickyNav').classList.remove('visible');
    } else {
        document.getElementById('view-' + seccionId).classList.add('active');
        document.getElementById('stickyNav').classList.add('visible');
    }
    window.scrollTo(0,0);
}

function irAlDashboard() { cambiarSeccion('dashboard'); }

function inicializarSeccionesUI() {
    document.getElementById('fechaEmision').value = new Date().toLocaleDateString();
    
    Object.keys(CATEGORIAS_MAP).forEach(cat => {
        const containerId = 'contenedor' + cat.charAt(0).toUpperCase() + cat.slice(1);
        const elContenedor = document.getElementById(containerId);
        if(!elContenedor) return;
        
        let html = "";
        CATEGORIAS_MAP[cat].forEach(id => {
            if(cat === 'extras' && id === 'dinamicos') {
                html += renderizarItemsDinamicosHTML();
            } else {
                html += renderizarItemCardUI(id);
            }
        });
        elContenedor.innerHTML = html;
    });
    loadBranding(); 
    obtenerSiguienteProforma();
}

function renderizarItemCardUI(id) {
    if(id === 'digital_las' || id === 'flyers' || id === 'offset' || id === 'tarjetas' || id === 'sintra' || id === 'mdf') {
        return `<div class="card" id="card_${id}" onclick="smartToggle(event, '${id}')">
            <div class="switch-container"><span><b>${DIC_NOMBRES[id]}</b></span><input class="tgl" type="checkbox" id="chk_${id}" onclick="event.stopPropagation(); toggleCard('${id}')"><label class="tgl-btn" for="chk_${id}"></label></div>
            <div id="content_${id}" style="display:none;"><div id="filas_${id}"></div><button class="btn-add-row" onclick="addFilaSubOpcion('${id}')">+ Fila</button><div class="cost-tag" id="tag_${id}">$0.00</div></div></div>`;
    } else if(id === 'letras') {
        return `<div class="card" id="card_letras" onclick="smartToggle(event, 'letras')">
            <div class="switch-container"><strong>Letras 3D</strong><input class="tgl" type="checkbox" id="chk_letras" onclick="event.stopPropagation(); toggleCard('letras')"><label class="tgl-btn" for="chk_letras"></label></div>
            <div id="content_letras" style="display:none;">
                <select id="mat_letras" onchange="calcular()"><option value="acrilico_acrilico">Acrílico/Acrílico</option><option value="acrilico_aluminio">Acrílico/Aluminio</option><option value="tol">Tol</option><option value="acero">Acero</option></select>
                <div style="display:flex; gap:12px; margin:12px 0; align-items:center;">
                    <input type="checkbox" id="chk_ilumina" checked onchange="calcular()" style="width:22px; height:22px; accent-color:var(--accent);">
                    <span style="font-weight:bold; font-size:13px;">Con LED</span>
                </div>
                <div id="filas_letras"></div><button class="btn-add-row" onclick="addFilaMedida('letras')">+ Fila (cm)</button><div class="cost-tag" id="tag_letras">$0.00</div>
            </div></div>`;
    } else if(id === 'neon') {
        return `<div class="card" id="card_neon" onclick="smartToggle(event, 'neon')">
            <div class="switch-container"><strong>Rótulo Neón LED</strong><input class="tgl" type="checkbox" id="chk_neon" onclick="event.stopPropagation(); toggleCard('neon')"><label class="tgl-btn" for="chk_neon"></label></div>
            <div id="content_neon" style="display:none;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;"><span style="font-size:11px;">Fuente 12v</span><input type="number" id="cant_fuente_12v" value="0" min="0" oninput="calcular()" style="width:60px; height:30px;"></div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;"><span style="font-size:11px;">Tira LED (m)</span><input type="number" id="cant_tira_led" value="0" min="0" oninput="calcular()" style="width:60px; height:30px;"></div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;"><span style="font-size:11px;">Punto de Conexión</span><input type="number" id="cant_punto_neon" value="0" min="0" oninput="calcular()" style="width:60px; height:30px;"></div>
                <div class="cost-tag" id="tag_neon">$0.00</div>
            </div></div>`;
      } else if(id === 'branding') {
    return `<div class="card" id="card_branding" onclick="smartToggle(event, 'branding')">
        <div class="switch-container"><strong>Branding (m²)</strong><input class="tgl" type="checkbox" id="chk_branding" onclick="event.stopPropagation(); toggleCard('branding')"><label class="tgl-btn" for="chk_branding"></label></div>
        <div id="content_branding" style="display:none;">
            <div style="display:flex; gap:12px; margin:12px 0 5px 0; align-items:center;">
                <input type="checkbox" id="chk_hilo_branding" onchange="document.getElementById('caja_hilo').style.display = this.checked ? 'flex' : 'none'; calcular();" style="width:22px; height:22px; accent-color:var(--accent);">
                <span style="font-weight:bold; font-size:13px;">+ Usar Hilo de Corte</span>
            </div>
            <div id="caja_hilo" style="display:none; align-items:center; justify-content:space-between; margin-bottom:12px; background:#f1f5f9; padding:8px; border-radius:6px;">
                <span style="font-size:11px; font-weight:bold;">Metros lineales (Hilo):</span>
                <input type="number" id="cant_hilo_branding" value="1" min="0" oninput="calcular()" style="width:70px; height:30px; text-align:center;">
            </div>
            <div id="filas_branding"></div><button class="btn-add-row" onclick="addFilaMedida('branding')">+ Fila (m²)</button>
            <div class="cost-tag" id="tag_branding">$0.00</div>
        </div></div>`;
    } else if(id === 'instala') {
        return `<div class="card" id="card_instala" onclick="smartToggle(event, 'instala')">
            <div class="switch-container"><strong>Instalación</strong><input class="tgl" type="checkbox" id="chk_instala" onclick="event.stopPropagation(); toggleCard('instala')"><label class="tgl-btn" for="chk_instala"></label></div>
            <div id="content_instala" style="display:none;">
                <div class="row-compact"><div class="input-group"><label>Piso</label><select id="p_instala" onchange="calcular()"><option value="p1">P1</option><option value="p2">P2</option><option value="p3">P3</option><option value="p4">P4+</option></select></div><div class="input-group"><label>Viáticos $</label><input type="number" id="v_instala" oninput="calcular()"></div></div>
                <div class="cost-tag" id="tag_instala">$0.00</div>
            </div></div>`;
    } else if(['lona', 'adh', 'micro', 'pana', 'lam', 'plotter', 'laser_m2', 'acrilico_m2', 'caja', 'bastidor', 'panelado', 'tensado', 'alu_est', 'valla_postes', 'alu', 'ranurado', 'arenado', 'cartoncillo', 'lona_respaldo', 'acri_3', 'acri_2'].includes(id)) {
        return `<div class="card" id="card_${id}" onclick="smartToggle(event, '${id}')">
            <div class="switch-container"><span><b>${DIC_NOMBRES[id]}</b></span><input class="tgl" type="checkbox" id="chk_${id}" onclick="event.stopPropagation(); toggleCard('${id}')"><label class="tgl-btn" for="chk_${id}"></label></div>
            <div id="content_${id}" style="display:none;"><div id="filas_${id}"></div><button class="btn-add-row" onclick="addFilaMedida('${id}')">+ Fila (m²)</button><div class="cost-tag" id="tag_${id}">$0.00</div></div></div>`;
    } else {
        let labelUnidad = id === 'canto_duro' || id === 'hilo_corte' ? 'cm/lin' : (id === 'laser_min' ? 'min' : 'u');
        return `<div class="card" id="card_${id}" onclick="smartToggle(event, '${id}')">
            <div class="switch-container"><span><b>${DIC_NOMBRES[id]}</b></span><input class="tgl" type="checkbox" id="chk_${id}" onclick="event.stopPropagation(); toggleCard('${id}')"><label class="tgl-btn" for="chk_${id}"></label></div>
            <div id="content_${id}" style="display:none;">
                <div class="row-compact"><div class="input-group"><label>Cantidad</label><input type="number" id="cant_${id}" value="1" min="1" oninput="calcular()"><span class="unit-label">${labelUnidad}</span></div></div>
                <div class="cost-tag" id="tag_${id}">$0.00</div>
            </div></div>`;
    }
}

function renderizarItemsDinamicosHTML() {
    let htmlDinamico = "";
    productosExtra.forEach(ext => {
        htmlDinamico += `<div class="card" id="card_dyn_${ext.id}" onclick="smartToggleDyn(event, '${ext.id}')">
            <div class="switch-container"><span><b>${ext.nombre.toUpperCase()} (${ext.sistema})</b></span><input class="tgl" type="checkbox" id="chk_dyn_${ext.id}" onclick="event.stopPropagation(); toggleCardDyn('${ext.id}')"><label class="tgl-btn" for="chk_dyn_${ext.id}"></label></div>
            <div id="content_dyn_${ext.id}" style="display:none;">
                <div class="row-compact">
                    ${ext.sistema === 'm2' ? `<div class="input-group"><label>An</label><input type="number" class="dyn-anc" oninput="calcular()"><span class="unit-label">m</span></div><div class="input-group"><label>Al</label><input type="number" class="dyn-alt" oninput="calcular()"><span class="unit-label">m</span></div>` : ''}
                    <div class="input-group" style="flex:0.8;"><label>Cant</label><input type="number" class="dyn-cant" value="1" oninput="calcular()"><span class="unit-label">u</span></div>
                </div>
                <button onclick="eliminarItemPersonalizado('${ext.id}')" style="background:#e53e3e; color:white; border:none; padding:6px; border-radius:4px; font-size:9px; font-weight:bold; cursor:pointer; margin-top:4px;">ELIMINAR ÍTEM</button>
                <div class="cost-tag" id="tag_dyn_${ext.id}">$0.00</div>
            </div></div>`;
    });
    return htmlDinamico;
}

function addFilaMedida(id) {
    const contenedor = document.getElementById('filas_' + id); if(!contenedor) return;
    const div = document.createElement('div'); div.className = 'row-compact';
    div.innerHTML = `<div class="input-group"><label>An</label><input type="number" class="anc-val" oninput="calcular()"><span class="unit-label">m</span></div><div class="input-group"><label>Al</label><input type="number" class="alt-val" oninput="calcular()"><span class="unit-label">m</span></div><div class="input-group" style="flex:0.6;"><label>Cant</label><input type="number" class="cant-val" value="1" oninput="calcular()"><span class="unit-label">u</span></div><div class="row-total-label"></div><button onclick="this.parentElement.remove(); calcular();" style="border:none; background:none; color:red; font-size:18px; cursor:pointer;">&times;</button>`;
    contenedor.appendChild(div); calcular();
}

function addFilaSubOpcion(id) {
    const contenedor = document.getElementById('filas_' + id); if(!contenedor) return;
    const div = document.createElement('div'); div.className = 'row-compact';
    if(id === 'sintra' || id === 'mdf') {
        let op = id === 'sintra' ? '<option value="sintra_3">3mm</option><option value="sintra_6">6mm</option><option value="sintra_10">10mm</option>' : '<option value="mdf_15b">1.5 Blanco</option><option value="mdf_3">3mm</option><option value="mdf_59">5.9mm</option><option value="mdf_10">10mm</option>';
        div.innerHTML = `<div class="input-group"><label>Esp.</label><select class="tipo-val" onchange="calcular()">${op}</select></div><div class="input-group"><label>An</label><input type="number" class="anc-val" oninput="calcular()"><span class="unit-label">m</span></div><div class="input-group"><label>Al</label><input type="number" class="alt-val" oninput="calcular()"><span class="unit-label">m</span></div><div class="input-group" style="flex:0.5;"><label>Cant</label><input type="number" class="cant-val" value="1" oninput="calcular()"><span class="unit-label">u</span></div><div class="row-total-label"></div><button onclick="this.parentElement.remove(); calcular();" style="border:none; background:none; color:red; font-size:18px; cursor:pointer;">&times;</button>`;
    } else {
        let op = id === 'digital_las' ? '<option value="a3">A3</option><option value="a4">A4</option><option value="sa3">Super A3</option>' : (id === 'flyers' ? '<option value="a6">A6</option><option value="a5">A5</option><option value="a4">A4</option>' : (id === 'offset' ? '<option value="a3">A3</option><option value="3550">35x50</option><option value="a4">A4</option><option value="a5">A5</option><option value="a6">A6</option>' : '<option value="estandar">Estándar</option><option value="mate">Mate</option><option value="uv">UV Selectivo</option>'));
        div.innerHTML = `<div class="input-group"><label>Tipo</label><select class="tipo-val" onchange="calcular()">${op}</select></div><div class="input-group" style="flex:0.8;"><label>Cant</label><input type="number" class="cant-val" value="1" oninput="calcular()"><span class="unit-label">u</span></div><div class="row-total-label"></div><button onclick="this.parentElement.remove(); calcular();" style="border:none; background:none; color:red; font-size:18px; cursor:pointer;">&times;</button>`;
    }
    contenedor.appendChild(div); calcular();
}

function calcular() {
    const pK = document.getElementById('tipoCliente').value; 
    if(!pK) return;
    
    let subTotalGeneral = 0;
    
    estadoCotizacion = {
        cliente: {
            nombre: document.getElementById('nombreCliente').value || "S/N",
            ruc: document.getElementById('rucCliente').value || "S/N",
            fecha: document.getElementById('fechaEmision').value || "",
            tarifa: pK
        },
        items: [],
        totales: { subtotal: 0, iva: 0, total: 0, abono: 0, saldo: 0, ajuste: 0 }
    };

    Object.keys(CATEGORIAS_MAP).forEach(cat => {
        let catSub = 0;
        
        CATEGORIAS_MAP[cat].forEach(id => {
            if(cat === 'extras' && id === 'dinamicos') {
                productosExtra.forEach(ext => {
                    if(document.getElementById('chk_dyn_'+ext.id)?.checked) {
                        const card = document.getElementById('content_dyn_'+ext.id);
                        const cant = parseFloat(card.querySelector('.dyn-cant')?.value) || 1;
                        let sub = 0;
                        const precioV = ext[pK] || ext.pub;
                        let detalleFila = { cant: cant };
                        
                        if(ext.sistema === 'm2') {
                            const an = parseFloat(card.querySelector('.dyn-anc')?.value) || 0;
                            const al = parseFloat(card.querySelector('.dyn-alt')?.value) || 0;
                            sub = an * al * cant * precioV;
                            detalleFila.ancho = an;
                            detalleFila.alto = al;
                        } else {
                            sub = cant * precioV;
                        }
                        document.getElementById('tag_dyn_'+ext.id).innerText = "$" + sub.toFixed(2);
                        catSub += sub;
                        
                        estadoCotizacion.items.push({
                            categoria: cat,
                            id: 'dyn_' + ext.id,
                            nombre: ext.nombre.toUpperCase() + ' (' + ext.sistema + ')',
                            subtotal: sub,
                            detalles: [detalleFila]
                        });
                    }
                });
            } else if(document.getElementById('chk_'+id)?.checked) {
                let tI = 0;
                let itemDetalles = [];
                const nombreItem = DIC_NOMBRES[id] || id;
                
                if(['lona', 'adh', 'micro', 'pana', 'lam', 'plotter', 'laser_m2', 'acrilico_m2', 'caja', 'bastidor', 'panelado', 'tensado', 'alu_est', 'valla_postes', 'alu', 'ranurado', 'arenado', 'cartoncillo', 'lona_respaldo', 'acri_3', 'acri_2'].includes(id)) {
                    const cont = document.getElementById('filas_'+id);
                    if(cont) {
                        cont.querySelectorAll('.row-compact').forEach(f => {
                            const an = parseFloat(f.querySelector('.anc-val')?.value)||0;
                            const al = parseFloat(f.querySelector('.alt-val')?.value)||0;
                            const cant = parseFloat(f.querySelector('.cant-val')?.value)||1;
                            const l = an * al * cant * (preciosBase[id]?preciosBase[id][pK]:0);
                            f.querySelector('.row-total-label').innerText = l>0?"$"+l.toFixed(2):""; 
                            tI += l;
                            itemDetalles.push({ ancho: an, alto: al, cant: cant, filaTotal: l });
                        });
                    }
                    document.getElementById('tag_'+id).innerText = "$"+tI.toFixed(2);
                } else if(id === 'sintra' || id === 'mdf') {
                    const cont = document.getElementById('filas_'+id);
                    if(cont) {
                        cont.querySelectorAll('.row-compact').forEach(f => {
                            const tipo = f.querySelector('.tipo-val')?.value;
                            const an = parseFloat(f.querySelector('.anc-val')?.value)||0;
                            const al = parseFloat(f.querySelector('.alt-val')?.value)||0;
                            const cant = parseFloat(f.querySelector('.cant-val')?.value)||1;
                            const l = an * al * cant * (preciosBase[tipo]?preciosBase[tipo][pK]:0);
                            f.querySelector('.row-total-label').innerText = l>0?"$"+l.toFixed(2):""; 
                            tI += l;
                            itemDetalles.push({ tipo: tipo, ancho: an, alto: al, cant: cant, filaTotal: l });
                        });
                    }
                    document.getElementById('tag_'+id).innerText = "$"+tI.toFixed(2);
                } else if(id === 'digital_las' || id === 'flyers' || id === 'offset' || id === 'tarjetas') {
                    const cont = document.getElementById('filas_'+id);
                    if(cont) {
                        cont.querySelectorAll('.row-compact').forEach(f => {
                            const tipo = f.querySelector('.tipo-val')?.value;
                            const cant = parseFloat(f.querySelector('.cant-val')?.value)||0;
                            let prefix = id === 'digital_las' ? 'd_' : (id === 'flyers' ? 'f_' : (id === 'offset' ? 'o_' : 't_'));
                            const clave = prefix + tipo;
                            const l = (preciosBase[clave]?preciosBase[clave][pK]:15)*cant;
                            f.querySelector('.row-total-label').innerText = l>0?"$"+l.toFixed(2):""; 
                            tI += l;
                            itemDetalles.push({ tipo: tipo, cant: cant, filaTotal: l });
                        });
                    }
                    document.getElementById('tag_'+id).innerText = "$"+tI.toFixed(2);
                } else if(id === 'letras') {
                    const mat = document.getElementById('mat_letras').value;
                    const ledChecked = document.getElementById('chk_ilumina').checked;
                    const descLED = ledChecked ? 0 : preciosBase.l_descuento_led[pK];
                    const pFinal = preciosBase['l_'+mat][pK] - descLED;
                    const cont = document.getElementById('filas_letras');
                    if(cont) {
                        cont.querySelectorAll('.row-compact').forEach(f => {
                            const al = parseFloat(f.querySelector('.alt-val')?.value)||0;
                            const cant = parseFloat(f.querySelector('.cant-val')?.value||1);
                            const l = al * cant * pFinal;
                            f.querySelector('.row-total-label').innerText = l>0?"$"+l.toFixed(2):""; 
                            tI += l;
                            itemDetalles.push({ material: mat, led: ledChecked, alto: al, cant: cant, filaTotal: l });
                        });
                    }
                    document.getElementById('tag_letras').innerText = "$"+tI.toFixed(2);
                } else if(id === 'neon') {
                    const f12 = parseFloat(document.getElementById('cant_fuente_12v').value)||0;
                    const tled = parseFloat(document.getElementById('cant_tira_led').value)||0;
                    const pneo = parseFloat(document.getElementById('cant_punto_neon').value)||0;
                    tI = (f12 * preciosBase.fuente_12v[pK]) + (tled * preciosBase.tira_led[pK]) + (pneo * preciosBase.punto_neon[pK]);
                    document.getElementById('tag_neon').innerText = "$"+tI.toFixed(2);
                    itemDetalles.push({ fuente_12v: f12, tira_led: tled, punto_neon: pneo });
                } else if(id === 'branding') {
                    const precioBranding = preciosBase.branding ? preciosBase.branding[pK] : (pK==='pub'?15:20);
                    const usarHilo = document.getElementById('chk_hilo_branding')?.checked;
                    const metrosHilo = parseFloat(document.getElementById('cant_hilo_branding')?.value) || 0;
                    const costoHilo = usarHilo ? (metrosHilo * 100 * preciosBase.hilo_corte[pK]) : 0;
                    const cont = document.getElementById('filas_branding');
                    let m2Costo = 0;
                    if(cont) {
                        cont.querySelectorAll('.row-compact').forEach(f => {
                            const an = parseFloat(f.querySelector('.anc-val')?.value)||0;
                            const al = parseFloat(f.querySelector('.alt-val')?.value)||0;
                            const cant = parseFloat(f.querySelector('.cant-val')?.value)||1;
                            const l = an * al * cant * precioBranding;
                            f.querySelector('.row-total-label').innerText = l > 0 ? "$" + l.toFixed(2) : ""; 
                            m2Costo += l;
                            itemDetalles.push({ ancho: an, alto: al, cant: cant, filaTotal: l });
                        });
                    }
                    tI = m2Costo + costoHilo;
                    document.getElementById('tag_branding').innerText = "$" + tI.toFixed(2);
                    if(usarHilo) {
                         itemDetalles.push({ hilo_corte_metros: metrosHilo, costo_hilo: costoHilo });
                    }
                } else if(id === 'instala') {
                    const piso = document.getElementById('p_instala').value;
                    const viaticos = parseFloat(document.getElementById('v_instala').value)||0;
                    tI = preciosBase[piso][pK] + viaticos;
                    document.getElementById('tag_instala').innerText = "$"+tI.toFixed(2);
                    itemDetalles.push({ piso: piso, viaticos: viaticos });
                } else {
                    const cant = parseFloat(document.getElementById('cant_'+id)?.value)||1;
                    tI = cant * (preciosBase[id]?preciosBase[id][pK]:0);
                    document.getElementById('tag_'+id).innerText = "$"+tI.toFixed(2);
                    itemDetalles.push({ cant: cant });
                }
                
                catSub += tI;
                
                estadoCotizacion.items.push({
                    categoria: cat,
                    id: id,
                    nombre: nombreItem,
                    subtotal: tI,
                    detalles: itemDetalles
                });
            }
        });

        const dashTag = document.getElementById('dash-total-' + cat);
        if(dashTag) dashTag.innerText = "$" + catSub.toFixed(2);
        subTotalGeneral += catSub;
    });

    const aj = parseFloat(document.getElementById('adj_global').value) || 0;
    const subAj = subTotalGeneral * (1 + (aj/100));
    const ivaVal = subAj * 0.15;
    const totalCalc = subAj * 1.15;
    const abono = parseFloat(document.getElementById('abono_pago').value) || 0;
    const saldo = totalCalc - abono;

    document.getElementById('subtotal').innerText = subTotalGeneral.toFixed(2);
    document.getElementById('iva').innerText = ivaVal.toFixed(2);
    document.getElementById('total').innerText = totalCalc.toFixed(2);
    document.getElementById('saldo_final').innerText = saldo.toFixed(2);
    
    const sDisp = document.getElementById('saldo_display');
    if (saldo <= 0.01) sDisp.style.color = "var(--accent)"; 
    else if (saldo < (totalCalc * 0.5)) sDisp.style.color = "var(--warning)"; 
    else sDisp.style.color = "var(--danger)";
    
    estadoCotizacion.totales = {
        subtotal: subTotalGeneral,
        ajuste_porcentaje: aj,
        subtotal_con_ajuste: subAj,
        iva: ivaVal,
        total: totalCalc,
        abono: abono,
        saldo: saldo
    };
}

function toggleCard(id) { 
    if(!document.getElementById('chk_'+id)) return;
    const ac = document.getElementById('chk_'+id).checked; 
    document.getElementById('card_'+id).classList.toggle('card-active', ac);
    document.getElementById('content_'+id).style.display = ac ? 'block' : 'none';
    if(ac && ['lona', 'adh', 'micro', 'pana', 'lam', 'plotter', 'laser_m2', 'acrilico_m2', 'caja', 'bastidor', 'panelado', 'tensado', 'alu_est', 'valla_postes', 'branding', 'alu', 'ranurado', 'arenado', 'cartoncillo', 'lona_respaldo', 'acri_3', 'acri_2', 'sintra', 'mdf', 'letras', 'digital_las', 'flyers', 'offset', 'tarjetas'].includes(id)) {
        if(document.getElementById('filas_'+id) && document.getElementById('filas_'+id).children.length === 0) {
            if(['sintra', 'mdf', 'digital_las', 'flyers', 'offset', 'tarjetas'].includes(id)) {
                addFilaSubOpcion(id);
            } else {
                addFilaMedida(id);
            }
        }
    }
    calcular();
}

function toggleCardDyn(id) {
    const ac = document.getElementById('chk_dyn_'+id).checked;
    document.getElementById('card_dyn_'+id).classList.toggle('card-active', ac);
    document.getElementById('content_dyn_'+id).style.display = ac ? 'block' : 'none';
    calcular();
}

function smartToggle(e, id) { 
    if(!["INPUT", "SELECT", "BUTTON", "LABEL", "OPTION"].includes(e.target.tagName)) { 
        const c = document.getElementById('chk_'+id); 
        c.checked = !c.checked; 
        toggleCard(id); 
    } 
}

function smartToggleDyn(e, id) {
    if(!["INPUT", "SELECT", "BUTTON", "LABEL", "OPTION"].includes(e.target.tagName)) { 
        const c = document.getElementById('chk_dyn_'+id); 
        c.checked = !c.checked; 
        toggleCardDyn(id); 
    }
}

function agregarItemPersonalizado() {
    const nombre = document.getElementById('nuevoItemNombre').value.trim();
    const sistema = document.getElementById('nuevoItemSistema').value;
    const costo = parseFloat(document.getElementById('nuevoItemCosto').value) || 0;
    if(!nombre) return showToast("⚠️ Escribe un nombre para el ítem");
    
    const id = 'dyn_' + Date.now();
    productosExtra.push({ id, nombre, sistema, pub: costo, fin: costo });
    localStorage.setItem('viva_productos_extra_v8.7', JSON.stringify(productosExtra));
    
    document.getElementById('nuevoItemNombre').value = "";
    document.getElementById('nuevoItemCosto').value = "";
    inicializarSeccionesUI();
    showToast("✅ Ítem agregado con éxito");
}

function eliminarItemPersonalizado(id) {
    productosExtra = productosExtra.filter(x => x.id !== id);
    localStorage.setItem('viva_productos_extra_v8.7', JSON.stringify(productosExtra));
    inicializarSeccionesUI();
    calcular();
    showToast("🗑️ Ítem eliminado");
}

function desbloquearApp() { 
    const val = document.getElementById('tipoCliente').value;
    const app = document.getElementById('mainApp');
    if(val) { app.style.opacity = "1"; app.style.pointerEvents = "auto"; } 
    else { app.style.opacity = "0.4"; app.style.pointerEvents = "none"; }
    calcular(); 
}

function openConfig() { history.pushState({modal: 'config'}, ""); document.getElementById('sidePanel').classList.add('open'); document.getElementById('overlay').style.display='block'; renderAjustes(); }
function abrirEmpresa() { history.pushState({modal: 'empresa'}, ""); document.getElementById('subModal').style.display='block'; }
function closeModals() { 
    document.getElementById('sidePanel').classList.remove('open'); 
    document.getElementById('subModal').style.display='none'; 
    document.getElementById('overlay').style.display='none'; 
}

function saveEmpresa() { 
    localStorage.setItem('viva_emp_txt', document.getElementById('txtEmpresa').value); 
    localStorage.setItem('viva_firma_nom', document.getElementById('firmaNombre').value); 
    localStorage.setItem('viva_firma_car', document.getElementById('firmaCargo').value); 
    showToast("Guardado"); closeModals(); 
}

function loadBranding() { 
    const l = localStorage.getItem('viva_logo'); 
    const logoContainer = document.getElementById('display-logo');
    if(l) logoContainer.innerHTML = `<img src="${l}" id="logo-preview">`;
    else logoContainer.innerHTML = `<b>viva</b> estudio`;
    document.getElementById('txtEmpresa').value = localStorage.getItem('viva_emp_txt') || "<b>DIR.:</b> AV.ATAHUALPA Y GARCÍA MOGROVEJO<br><b>TELF.:</b> 0987084163\nAMBATO - ECUADOR"; 
    document.getElementById('firmaNombre').value = localStorage.getItem('viva_firma_nom') || "DANIELA VILLACRES"; 
    document.getElementById('firmaCargo').value = localStorage.getItem('viva_firma_car') || "GERENTE"; 
}

function uploadLogo() { 
    const f = document.getElementById('inputLogo').files[0], r = new FileReader(); 
    r.onloadend = () => { localStorage.setItem('viva_logo', r.result); loadBranding(); obtenerSiguienteProforma(); showToast("Logo actualizado"); }; 
    if(f) r.readAsDataURL(f); 
}

function renderAjustes() { 
    const b = document.getElementById('cuerpoPrecios'); b.innerHTML = "<strong>Precios Base:</strong><br><br>"; 
    Object.keys(preciosBase).forEach(id => { 
        let nom = DIC_NOMBRES[id] || id.toUpperCase(); 
        b.innerHTML += `<div style="display:flex; align-items:center; gap:5px; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px;"><span style="flex:1; font-size:10px;">${nom}</span><div style="display:flex; gap:2px;"><input type="number" id="adj_pub_${id}" value="${preciosBase[id].pub}" style="width:48px; height:26px; font-size:11px;"><input type="number" id="adj_fin_${id}" value="${preciosBase[id].fin}" style="width:48px; height:26px; font-size:11px;"></div></div>`; 
    });
}

function savePrecios() { 
    Object.keys(preciosBase).forEach(id => { 
        if(document.getElementById("adj_pub_"+id)){ 
            preciosBase[id].pub = parseFloat(document.getElementById("adj_pub_"+id).value); 
            preciosBase[id].fin = parseFloat(document.getElementById("adj_fin_"+id).value); 
        } 
    }); 
    localStorage.setItem('viva_precios_v8.7', JSON.stringify(preciosBase)); 
    showToast("Precios actualizados"); 
}

function exportarDatos() { 
    const data = { precios: preciosBase, extras: productosExtra, config: { emp: localStorage.getItem('viva_emp_txt'), nom: localStorage.getItem('viva_firma_nom'), car: localStorage.getItem('viva_firma_car'), logo: localStorage.getItem('viva_logo') } }; 
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'}); 
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `VIVA_RESPALDO.json`; a.click(); 
}

function importarDatos(input) { 
    const reader = new FileReader(); 
    reader.onload = () => { 
        const d = JSON.parse(reader.result); 
        preciosBase = d.precios; 
        productosExtra = d.extras || []; 
        localStorage.setItem('viva_logo', d.config.logo); 
        localStorage.setItem('viva_emp_txt', d.config.emp); 
        localStorage.setItem('viva_firma_nom', d.config.nom); 
        localStorage.setItem('viva_firma_car', d.config.car); 
        localStorage.setItem('viva_precios_v8.7', JSON.stringify(preciosBase)); 
        localStorage.setItem('viva_productos_extra_v8.7', JSON.stringify(productosExtra));
        location.reload(); 
    }; 
    reader.readAsText(input.files[0]); 
}

function registrarYGenerar() {
    const cliente = (document.getElementById('nombreCliente').value || "CLIENTE").toUpperCase();
    const ruc = document.getElementById('rucCliente').value || "---";
    const fecha = document.getElementById('fechaEmision').value;
    const logo = localStorage.getItem('viva_logo') || "";
    const infoEmpresa = (localStorage.getItem('viva_emp_txt') || "").replace(/\n/g, '<br>');
    const firmaN = localStorage.getItem('viva_firma_nom') || "DANIELA VILLACRES";
    const firmaC = localStorage.getItem('viva_firma_car') || "GERENTE";
    
    let filasHTML = "";
    const allIds = ['lona', 'adh', 'micro', 'pana', 'lam', 'digital_las', 'flyers', 'offset', 'tarjetas', 'carpeta', 'troquel', 'plotter', 'laser_m2', 'acrilico_m2', 'laser_min', 'laminado_s', 'caja', 'bastidor', 'panelado', 'tensado', 'alu_est', 'valla_postes', 'branding', 'letras', 'neon', 'alu', 'sintra', 'mdf', 'ranurado', 'arenado', 'cartoncillo', 'lona_respaldo', 'barilla', 'acri_3', 'acri_2', 'canto_duro', 'mano_obra', 'doble_fast', 'extras_gen', 'hilo_corte', 'timer', 'instala'];
    
    allIds.forEach(id => {
        if(document.getElementById('chk_'+id)?.checked) {
            const nombreProd = DIC_NOMBRES[id] || id;
            let totalFila = document.getElementById('tag_'+id)?.innerText || "$0.00";
            filasHTML += `<tr><td style="text-align:center">1</td><td><strong style="color:#000">${nombreProd.toUpperCase()}</strong></td><td style="text-align:right">${totalFila}</td></tr>`;
        }
    });

    productosExtra.forEach(ext => {
        if(document.getElementById('chk_dyn_'+ext.id)?.checked) {
            let totalFila = document.getElementById('tag_dyn_'+ext.id)?.innerText || "$0.00";
            filasHTML += `<tr><td style="text-align:center">1</td><td><strong style="color:#000">${ext.nombre.toUpperCase()} (${ext.sistema})</strong></td><td style="text-align:right">${totalFila}</td></tr>`;
        }
    });

    const datosVenta = {
        proforma: numeroProformaActual,
        cliente: cliente,
        total: document.getElementById('total').innerText
    };

    fetch(URL_NUBE, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosVenta)
    }).then(() => {
        showToast("✅ N° " + numeroProformaActual + " Registrado");
        obtenerSiguienteProforma();
    });

    const v = window.open("", "_blank");
    v.document.write(`
    <html>
    <head>
        <title>Proforma ${numeroProformaActual}</title>
        <style>
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; color: #333; }
            .black-header { background: #000; color: #fff; padding: 10px 40px; display: flex; justify-content: space-between; align-items: center; }
            .logo-img { max-height: 70px; }
            .company-info { text-align: right; font-size: 8.5pt; line-height: 1.5; color: #bbb; }
            .main-content { padding: 20px 40px; }
            .title-area { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .title-area h1 { margin: 0; font-size: 32pt; color: #f0f0f0; letter-spacing: 8px; text-transform: uppercase; line-height: 1; }
            .proforma-num { font-size: 14pt; font-weight: bold; color: #333; text-align: right; }
            .proforma-num span { color: #f39200; font-size: 16pt; }
            .cli-box { margin-top: 15px; display: flex; justify-content: space-between; background: #f8fafb; padding: 8px; border-radius: 10px; border: 1px solid #edf2f7; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            th { background: #f1f5f9; color: #475569; padding: 12px; font-size: 9pt; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            td { padding: 6px; border-bottom: 1px solid #f1f5f9; font-size: 10pt; line-height: 1.1;}
            .totals-table { width: 260px; margin-left: auto; margin-top: 20px; }
            .totals-table td { border: none; padding: 2px; line-height: 1.2; }
            .total-row { font-size: 13pt; font-weight: bold; color: #000; border-top: 2px solid #000 !important; }
            .footer { margin-top: 80px; display: flex; justify-content: space-around; text-align: center; }
            .signature { border-top: 1px solid #ccc; width: 220px; padding-top: 10px; font-size: 9pt; color: #666; }
        </style>
    </head>
    <body>
        <div class="black-header">
            <div>${logo ? `<img src="${logo}" class="logo-img">` : '<h1 style="margin:0; color:#fff;">VIVA ESTUDIO</h1>'}</div>
            <div class="company-info">${infoEmpresa}</div>
        </div>
        <div class="main-content">
            <div class="title-area"><h1>Proforma</h1><div class="proforma-num">NÚMERO: <span>${numeroProformaActual}</span></div></div>
            <div class="cli-box"><div><div style="font-size:8pt; color:#718096; font-weight:bold;">DATOS DEL CLIENTE</div><div style="margin-top:4px;"><strong>NOMBRE:</strong> ${cliente}</div><div><strong>RUC/CI:</strong> ${ruc}</div></div><div style="text-align:right"><div style="font-size:8pt; color:#718096; font-weight:bold;">EMISIÓN</div><div style="margin-top:4px;">${fecha}</div></div></div>
            <table><thead><tr><th width="10%">CANT.</th><th width="70%" style="text-align:left">DESCRIPCIÓN DE PRODUCTO / SERVICIO</th><th width="20%" style="text-align:right">TOTAL</th></tr></thead><tbody>${filasHTML}</tbody></table>
            <table class="totals-table">
                <tr><td>SUBTOTAL:</td><td style="text-align:right">$${document.getElementById('subtotal').innerText}</td></tr>
                <tr><td>IVA (15%):</td><td style="text-align:right">$${document.getElementById('iva').innerText}</td></tr>
                <tr class="total-row"><td>TOTAL:</td><td style="text-align:right">$${document.getElementById('total').innerText}</td></tr>
                <tr><td style="color:#f39200">ABONO:</td><td style="text-align:right; color:#f39200">-$${parseFloat(document.getElementById('abono_pago').value).toFixed(2)}</td></tr>
                <tr style="font-weight:bold; font-size:12pt; background:#f1f5f9"><td>SALDO:</td><td style="text-align:right">$${document.getElementById('saldo_final').innerText}</td></tr>
            </table>
            <div class="footer"><div class="signature"><b>${firmaN}</b><br>${firmaC}<br>FIRMA AUTORIZADA</div><div class="signature"><br>RECIBÍ CONFORME (CLIENTE)</div></div>
        </div>
        <script>setTimeout(() => { window.print(); }, 500);<\/script>
    </body>
    </html>`);
}

function aplicarFormato(tipo) {
    const area = document.getElementById('txtEmpresa');
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const texto = area.value;
    const seleccionado = texto.substring(start, end);
    if (tipo === 'b') area.value = texto.substring(0, start) + "<b>" + seleccionado + "</b>" + texto.substring(end);
    else if (tipo === 'br') area.value = texto.substring(0, start) + "<br>" + seleccionado + texto.substring(end);
    area.focus();
}

function nuevaProforma() {
    if(confirm("¿Deseas limpiar todo para una nueva proforma?")) {
        document.getElementById('nombreCliente').value = "";
        document.getElementById('rucCliente').value = "";
        document.getElementById('abono_pago').value = "0";
        document.getElementById('adj_global').value = "0";
        document.getElementById('tipoCliente').value = "";
        desbloquearApp();
        
        document.querySelectorAll('.tgl').forEach(chk => chk.checked = false);
        document.querySelectorAll('.section-view').forEach(sec => {
            if(sec.id !== 'view-dashboard') sec.classList.remove('active');
        });
        document.getElementById('view-dashboard').classList.add('active');
        document.getElementById('stickyNav').classList.remove('visible');
        
        inicializarSeccionesUI();
        showToast("Formulario Reiniciado");
        window.scrollTo(0,0);
    }
}

async function despacharOrden() {
    calcular(); // Fuerza un cálculo final antes de enviar

    if (!estadoCotizacion || !estadoCotizacion.totales || estadoCotizacion.totales.subtotal === 0) {
        showToast("⚠️️ No hay datos calculados para enviar.");
        return;
    }

    const ordenFinal = {
        proforma_ref: numeroProformaActual || "S/N",
        fecha_ingreso: new Date().toISOString(),
        estado_flujo: "por_asignar",
        prioridad: "normal",
        datos_cotizacion: estadoCotizacion
    };

    const btnAsignar = document.getElementById('btnAprobar');
    const textoOriginal = btnAsignar.innerHTML;
    btnAsignar.innerHTML = "<b>ENVIANDO...</b>";
    btnAsignar.disabled = true;

    try {
        const urlFirebase = "https://viva-operaciones-default-rtdb.firebaseio.com/ordenes.json";
        
        const respuesta = await fetch(urlFirebase, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(ordenFinal)
        });

        if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
        
        showToast("✅ ¡Orden enviada a Viva Monitor!");
    } catch (error) {
        console.error("Fallo al despachar:", error);
        showToast("❌ Hubo un problema de conexión al enviar la orden.");
    } finally {
        btnAsignar.innerHTML = textoOriginal;
        btnAsignar.disabled = false;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    inicializarSeccionesUI();
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.classList.add('splash-hidden');
        }
    }, 1200);
});