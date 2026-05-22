/* ==========================================================================
   CÓDIGO DE GOOGLE APPS SCRIPT: LIMPIEZA Y PROCESAMIENTO DE DATOS
   ==========================================================================
   Este script permite limpiar y normalizar las respuestas recopiladas en la 
   hoja de respuestas de Jamaica Pipiles.
   
   Genera:
   1. Una copia de seguridad llamada 'raw_data' de los datos originales.
   2. Una hoja procesada 'clean_data' con columnas consistentes, variables 
      dummy/binarias para selección múltiple, números validados y control de calidad.
   3. Una hoja 'data_dictionary' que documenta cada variable limpia.
   
   Instrucciones de uso al final del archivo.
*/

// Nombre de las hojas
var SHEET_RAW = "raw_data";
var SHEET_CLEAN = "clean_data";
var SHEET_DICT = "data_dictionary";

/**
 * Crea un menú personalizado en la hoja de cálculo al abrirla.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Pipiles: Limpieza')
    .addItem('Limpiar y Normalizar Datos', 'cleanAndNormalizeData')
    .addToUi();
}

/**
 * Función principal que ejecuta el flujo de limpieza y normalización.
 */
function cleanAndNormalizeData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Identificar la hoja de origen
  var sourceSheet = findSourceSheet(ss);
  if (!sourceSheet) {
    SpreadsheetApp.getUi().alert("Error: No se encontró ninguna hoja con respuestas válidas (debe contener la columna 'Marca de Tiempo').");
    return;
  }
  
  // 2. Asegurar que exista 'raw_data' como copia de seguridad
  var rawSheet = ss.getSheetByName(SHEET_RAW);
  if (!rawSheet) {
    // Si la hoja de origen no se llama raw_data, renombrarla o duplicarla
    if (sourceSheet.getName() !== SHEET_RAW) {
      // Duplicamos para mantener la original intacta y nombramos a la copia como 'raw_data'
      rawSheet = sourceSheet.copyTo(ss);
      rawSheet.setName(SHEET_RAW);
      // Mover la hoja de copia al inicio
      ss.setActiveSheet(rawSheet);
      ss.moveActiveSheet(1);
    } else {
      rawSheet = sourceSheet;
    }
  } else {
    // Si ya existe 'raw_data', la actualizamos con los datos más recientes del formulario
    // si el formulario está vinculado a otra hoja original.
    if (sourceSheet.getName() !== SHEET_RAW) {
      rawSheet.clear();
      var sourceRange = sourceSheet.getDataRange();
      sourceRange.copyTo(rawSheet.getRange(1, 1));
    }
  }
  
  // 3. Obtener los datos de raw_data
  var rawData = rawSheet.getDataRange().getValues();
  if (rawData.length <= 1) {
    SpreadsheetApp.getUi().alert("La hoja de datos originales está vacía o solo contiene encabezados.");
    return;
  }
  
  var rawHeaders = rawData[0];
  var rawRows = rawData.slice(1);
  
  // Mapear los índices de los encabezados originales para evitar fallos si cambia el orden
  var headerIndices = mapHeaders(rawHeaders);
  
  // Definir las columnas de salida limpias
  var cleanHeaders = [
    "timestamp",
    "frecuencia_consumo",
    "razon_no_consumo",
    "razon_no_consumo_texto_abierto",
    
    // P2. Momentos (Binarias)
    "momento_almuerzo",
    "momento_cena",
    "momento_pupuseria_tipico",
    "momento_salida_familiar",
    "momento_para_llevar",
    "momento_en_casa",
    "momento_ninguno",
    
    // P3. Palabras Descriptoras (Binarias)
    "desc_autentica",
    "desc_tradicional",
    "desc_moderna",
    "desc_premium",
    "desc_refrescante",
    "desc_saludable",
    "desc_natural",
    "desc_artificial",
    "desc_cara",
    "desc_bonita",
    "desc_comun",
    "desc_confusa",
    "desc_antojable",
    "desc_otro",
    "desc_otro_texto",
    
    // P4. Escala Likert (Enteros 1-5)
    "likert_autentica",
    "likert_moderna",
    "likert_premium",
    "likert_empaque",
    "likert_calorias",
    "likert_confianza",
    
    // P5. Comparación sabor
    "comparacion_sabor",
    
    // P6. Razón compra (Binarias)
    "razon_compra_jamaica",
    "razon_compra_bajo_calorias",
    "razon_compra_empaque",
    "razon_compra_marca",
    "razon_compra_higienica",
    "razon_compra_diferente",
    "razon_compra_no_compraria",
    "razon_compra_otro",
    "razon_compra_otro_texto",
    
    // P7. Duda/Freno
    "freno_compra",
    "freno_compra_texto_abierto",
    "freno_sabor_tradicional",
    "freno_sabor_artificial",
    "freno_demasiado_cara",
    "freno_no_creer_calorias",
    "freno_ninguna_duda",
    "freno_otro",
    
    // P8. Probabilidad
    "probabilidad_compra",
    
    // P9. Vasos
    "vasos_mes",
    "vasos_mes_original",
    
    // P10. Precios
    "precio_estimado",
    "precio_exacto",
    "precio_exacto_original",
    
    // Columnas de control
    "respuesta_valida",
    "observaciones_limpieza"
  ];
  
  var cleanRows = [];
  
  // 4. Procesar y limpiar cada fila
  for (var i = 0; i < rawRows.length; i++) {
    var rawRow = rawRows[i];
    var cleanRow = processRow(rawRow, headerIndices, cleanHeaders);
    cleanRows.push(cleanRow);
  }
  
  // 5. Escribir datos limpios en la hoja 'clean_data'
  var cleanSheet = ss.getSheetByName(SHEET_CLEAN);
  if (!cleanSheet) {
    cleanSheet = ss.insertSheet(SHEET_CLEAN);
  } else {
    cleanSheet.clear();
  }
  
  // Insertar encabezados y filas
  cleanSheet.appendRow(cleanHeaders);
  if (cleanRows.length > 0) {
    cleanSheet.getRange(2, 1, cleanRows.length, cleanHeaders.length).setValues(cleanRows);
  }
  
  // Dar formato básico a la hoja limpia
  formatCleanSheet(cleanSheet, cleanHeaders.length);
  
  // 6. Generar el diccionario de datos
  generateDataDictionary(ss);
  
  SpreadsheetApp.getUi().alert("Procesamiento completado con éxito.\nSe han creado/actualizado las hojas '" + SHEET_CLEAN + "' y '" + SHEET_DICT + "'.");
}

/**
 * Busca qué hoja contiene los datos crudos del formulario.
 */
function findSourceSheet(ss) {
  // Primero buscar 'raw_data'
  var raw = ss.getSheetByName(SHEET_RAW);
  if (raw) return raw;
  
  // Si no, buscar la primera hoja que contenga "Marca de Tiempo" en la primera fila
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var firstRow = sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn(), 5)).getValues()[0];
    if (firstRow.indexOf("Marca de Tiempo") !== -1 || firstRow.indexOf("Timestamp") !== -1) {
      return sheet;
    }
  }
  
  // Si no encuentra nada, devuelve la primera hoja activa
  return sheets[0];
}

/**
 * Mapea los nombres de las columnas originales a sus respectivos índices.
 */
function mapHeaders(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i].toString().trim();
    if (h.indexOf("Marca de Tiempo") !== -1 || h.indexOf("Timestamp") !== -1) map.timestamp = i;
    else if (h.indexOf("P1. Frecuencia Consumo") !== -1) map.p1 = i;
    else if (h.indexOf("P1b. Razón No Consumo") !== -1) map.p1b = i;
    else if (h.indexOf("P2. Momentos de Consumo") !== -1) map.p2 = i;
    else if (h.indexOf("P3. Palabras Descriptoras") !== -1) map.p3 = i;
    else if (h.indexOf("P4_1. Auténtica") !== -1) map.p4_1 = i;
    else if (h.indexOf("P4_2. Moderna") !== -1) map.p4_2 = i;
    else if (h.indexOf("P4_3. Premium") !== -1) map.p4_3 = i;
    else if (h.indexOf("P4_4. Empaque") !== -1) map.p4_4 = i;
    else if (h.indexOf("P4_5. Calorías") !== -1) map.p4_5 = i;
    else if (h.indexOf("P4_6. Confianza") !== -1) map.p4_6 = i;
    else if (h.indexOf("P5. Comparación Sabor") !== -1) map.p5 = i;
    else if (h.indexOf("P6. Razón Compra") !== -1) map.p6 = i;
    else if (h.indexOf("P7. Duda/Freno Compra") !== -1) map.p7 = i;
    else if (h.indexOf("P8. Probabilidad Compra") !== -1) map.p8 = i;
    else if (h.indexOf("P9. Vasos al Mes") !== -1) map.p9 = i;
    else if (h.indexOf("P10. Precio Estimado") !== -1) map.p10 = i;
    else if (h.indexOf("P10b. Precio Exacto") !== -1) map.p10b = i;
  }
  return map;
}

/**
 * Limpia y normaliza una sola fila de datos.
 */
function processRow(rawRow, map, cleanHeaders) {
  var rowData = {};
  var obs = [];
  var valida = 1;
  
  // Helper para leer celdas de forma segura
  var getCell = function(idx) {
    if (idx === undefined || idx >= rawRow.length) return "";
    return rawRow[idx] === null ? "" : rawRow[idx].toString().trim();
  };
  
  // 1. Timestamp
  rowData.timestamp = getCell(map.timestamp);
  
  // 2. P1 Frecuencia
  var p1 = getCell(map.p1);
  rowData.frecuencia_consumo = p1;
  if (!p1) {
    valida = 0;
    obs.push("Falta frecuencia de consumo (P1)");
  }
  
  // 3. P1b Razón No Consumo
  var p1b = getCell(map.p1b);
  if (p1.indexOf("Nunca") !== -1) {
    if (!p1b) {
      obs.push("Falta razón de no consumo (P1b)");
      valida = 0;
    }
    if (p1b.indexOf("Otro:") !== -1 || p1b.toLowerCase().indexOf("otro") !== -1) {
      rowData.razon_no_consumo = "Otro";
      rowData.razon_no_consumo_texto_abierto = p1b.replace(/^Otro:\s*/i, "");
    } else {
      rowData.razon_no_consumo = p1b;
      rowData.razon_no_consumo_texto_abierto = "";
    }
  } else {
    rowData.razon_no_consumo = "N/A";
    rowData.razon_no_consumo_texto_abierto = "";
  }
  
  // 4. P2 Momentos de Consumo (Selección Múltiple)
  var p2 = getCell(map.p2);
  rowData.momento_almuerzo = p2.toLowerCase().indexOf("almuerzo") !== -1 ? 1 : 0;
  rowData.momento_cena = p2.toLowerCase().indexOf("cena") !== -1 ? 1 : 0;
  rowData.momento_pupuseria_tipico = (p2.toLowerCase().indexOf("pupuser") !== -1 || p2.toLowerCase().indexOf("típico") !== -1) ? 1 : 0;
  rowData.momento_salida_familiar = p2.toLowerCase().indexOf("familiar") !== -1 ? 1 : 0;
  rowData.momento_para_llevar = p2.toLowerCase().indexOf("llevar") !== -1 ? 1 : 0;
  rowData.momento_en_casa = p2.toLowerCase().indexOf("casa") !== -1 ? 1 : 0;
  rowData.momento_ninguno = p2.toLowerCase().indexOf("ningún") !== -1 ? 1 : 0;
  
  if (p1.indexOf("Nunca") === -1 && !p2) {
    obs.push("Momentos de consumo vacíos (P2)");
  }

  // 5. P3 Palabras Descriptoras (Selección Múltiple)
  var p3 = getCell(map.p3);
  rowData.desc_autentica = p3.indexOf("Auténtica") !== -1 ? 1 : 0;
  rowData.desc_tradicional = p3.indexOf("Tradicional") !== -1 ? 1 : 0;
  rowData.desc_moderna = p3.indexOf("Moderna") !== -1 ? 1 : 0;
  rowData.desc_premium = p3.indexOf("Premium") !== -1 ? 1 : 0;
  rowData.desc_refrescante = p3.indexOf("Refrescante") !== -1 ? 1 : 0;
  rowData.desc_saludable = p3.indexOf("Saludable") !== -1 ? 1 : 0;
  rowData.desc_natural = p3.indexOf("Natural") !== -1 ? 1 : 0;
  rowData.desc_artificial = p3.indexOf("Artificial") !== -1 ? 1 : 0;
  rowData.desc_cara = p3.indexOf("Cara") !== -1 ? 1 : 0;
  rowData.desc_bonita = p3.indexOf("Bonita") !== -1 ? 1 : 0;
  rowData.desc_comun = p3.indexOf("Común") !== -1 ? 1 : 0;
  rowData.desc_confusa = p3.indexOf("Confusa") !== -1 ? 1 : 0;
  rowData.desc_antojable = p3.indexOf("Antojable") !== -1 ? 1 : 0;
  
  // Buscar "Otro"
  var p3OtroIndex = p3.indexOf("Otro:");
  if (p3OtroIndex !== -1 || p3.indexOf("Otro") !== -1) {
    rowData.desc_otro = 1;
    var match = p3.match(/Otro:\s*([^,]+)/);
    rowData.desc_otro_texto = match ? match[1].trim() : "";
  } else {
    rowData.desc_otro = 0;
    rowData.desc_otro_texto = "";
  }

  // 6. Likert Scales (P4_1 a P4_6)
  var cleanLikert = function(val, name) {
    if (!val) {
      if (p1.indexOf("Nunca") === -1) {
        obs.push("Likert " + name + " vacío");
        valida = 0;
      }
      return "";
    }
    var num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 5) {
      obs.push("Likert " + name + " fuera de rango: " + val);
      valida = 0;
      return "";
    }
    return num;
  };
  
  rowData.likert_autentica = cleanLikert(getCell(map.p4_1), "auténtica");
  rowData.likert_moderna = cleanLikert(getCell(map.p4_2), "moderna");
  rowData.likert_premium = cleanLikert(getCell(map.p4_3), "premium");
  rowData.likert_empaque = cleanLikert(getCell(map.p4_4), "empaque");
  rowData.likert_calorias = cleanLikert(getCell(map.p4_5), "calorías");
  rowData.likert_confianza = cleanLikert(getCell(map.p4_6), "confianza");
  
  // 7. P5 Comparación Sabor
  rowData.comparacion_sabor = getCell(map.p5);
  if (p1.indexOf("Nunca") === -1 && !rowData.comparacion_sabor) {
    obs.push("Falta comparación sabor (P5)");
  }
  
  // 8. P6 Razón Compra (Selección Múltiple)
  var p6 = getCell(map.p6);
  rowData.razon_compra_jamaica = p6.toLowerCase().indexOf("gusta la jamaica") !== -1 ? 1 : 0;
  rowData.razon_compra_bajo_calorias = p6.toLowerCase().indexOf("calorías") !== -1 ? 1 : 0;
  rowData.razon_compra_empaque = p6.toLowerCase().indexOf("empaque") !== -1 ? 1 : 0;
  rowData.razon_compra_marca = p6.toLowerCase().indexOf("marca") !== -1 ? 1 : 0;
  rowData.razon_compra_higienica = p6.toLowerCase().indexOf("higiénica") !== -1 ? 1 : 0;
  rowData.razon_compra_diferente = p6.toLowerCase().indexOf("diferente") !== -1 ? 1 : 0;
  rowData.razon_compra_no_compraria = p6.toLowerCase().indexOf("no compraría") !== -1 ? 1 : 0;
  
  if (p6.indexOf("Otro:") !== -1 || p6.toLowerCase().indexOf("otro") !== -1) {
    rowData.razon_compra_otro = 1;
    var matchP6 = p6.match(/Otro:\s*([^,]+)/);
    rowData.razon_compra_otro_texto = matchP6 ? matchP6[1].trim() : "";
  } else {
    rowData.razon_compra_otro = 0;
    rowData.razon_compra_otro_texto = "";
  }
  
  // 9. P7 Duda/Freno Compra (Single Choice)
  var p7 = getCell(map.p7);
  if (p7.indexOf("Otro:") !== -1) {
    rowData.freno_compra = "Otro";
    rowData.freno_compra_texto_abierto = p7.replace(/^Otro:\s*/i, "");
  } else {
    rowData.freno_compra = p7;
    rowData.freno_compra_texto_abierto = "";
  }
  
  // Dummy columns for P7
  rowData.freno_sabor_tradicional = p7.toLowerCase().indexOf("tradicional") !== -1 ? 1 : 0;
  rowData.freno_sabor_artificial = p7.toLowerCase().indexOf("artificial") !== -1 ? 1 : 0;
  rowData.freno_demasiado_cara = p7.toLowerCase().indexOf("cara") !== -1 ? 1 : 0;
  rowData.freno_no_creer_calorias = p7.toLowerCase().indexOf("crea") !== -1 ? 1 : 0;
  rowData.freno_ninguna_duda = (p7.toLowerCase().indexOf("ninguna") !== -1 || p7.toLowerCase().indexOf("no tendría") !== -1) ? 1 : 0;
  rowData.freno_otro = p7.indexOf("Otro:") !== -1 ? 1 : 0;

  // 10. P8 Probabilidad Compra
  rowData.probabilidad_compra = getCell(map.p8);
  if (p1.indexOf("Nunca") === -1 && !rowData.probabilidad_compra) {
    obs.push("Falta probabilidad de compra (P8)");
    valida = 0;
  }
  
  // 11. P9 Vasos al mes
  var p9 = getCell(map.p9);
  rowData.vasos_mes_original = p9;
  if (!p9) {
    rowData.vasos_mes = "";
    if (p1.indexOf("Nunca") === -1) {
      obs.push("Falta vasos al mes (P9)");
      valida = 0;
    }
  } else {
    // Mapear opciones de texto a números
    if (p9.indexOf("0") !== -1) rowData.vasos_mes = 0;
    else if (p9.indexOf("1") !== -1) rowData.vasos_mes = 1;
    else if (p9.indexOf("2") !== -1) rowData.vasos_mes = 2;
    else if (p9.indexOf("3 a 4") !== -1) rowData.vasos_mes = 3.5;
    else if (p9.indexOf("5 a 8") !== -1) rowData.vasos_mes = 6.5;
    else if (p9.indexOf("Más de 8") !== -1) rowData.vasos_mes = 10;
    else {
      var extractedNum = parseInt(p9.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(extractedNum)) {
        rowData.vasos_mes = extractedNum;
      } else {
        rowData.vasos_mes = "";
        obs.push("vasos al mes no interpretable: " + p9);
      }
    }
  }
  
  // 12. P10 Precio Estimado
  var p10 = getCell(map.p10);
  rowData.precio_estimado = p10;
  
  // 13. P10b Precio Exacto
  var p10b = getCell(map.p10b);
  rowData.precio_exacto_original = p10b;
  if (!p10b || p10b === "N/A" || p10b === "na") {
    rowData.precio_exacto = "";
  } else {
    var cleanedPrice = p10b.replace(/\$/g, "").replace(/,/g, ".").replace(/\s/g, "");
    var priceNum = parseFloat(cleanedPrice);
    if (isNaN(priceNum)) {
      rowData.precio_exacto = "";
      obs.push("precio no interpretable: " + p10b);
    } else {
      rowData.precio_exacto = priceNum;
    }
  }
  
  // Si no se consume, ignorar campos vacíos y considerarlo respuesta válida
  if (p1.indexOf("Nunca") !== -1 && obs.indexOf("Falta razón de no consumo (P1b)") === -1) {
    valida = 1; 
  }
  
  rowData.respuesta_valida = valida;
  rowData.observaciones_limpieza = obs.join(" | ");
  
  // Construir el array final en el mismo orden que cleanHeaders
  var output = [];
  for (var k = 0; k < cleanHeaders.length; k++) {
    var header = cleanHeaders[k];
    output.push(rowData[header] !== undefined ? rowData[header] : "");
  }
  
  return output;
}

/**
 * Aplica estilos estilizados a la hoja 'clean_data' para que sea agradable visualmente.
 */
function formatCleanSheet(sheet, numCols) {
  sheet.setFrozenRows(1);
  
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#6D1B5E"); // Púrpura Jamaica Pipiles
  headerRange.setFontColor("#FFFFFF");
  headerRange.setHorizontalAlignment("center");
  
  for (var col = 1; col <= numCols; col++) {
    sheet.autoResizeColumn(col);
  }
  
  var dataRange = sheet.getDataRange();
  dataRange.setBorder(true, true, true, true, true, true, "#E0E0E0", SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Genera de forma dinámica el diccionario de datos.
 */
function generateDataDictionary(ss) {
  var dictSheet = ss.getSheetByName(SHEET_DICT);
  if (!dictSheet) {
    dictSheet = ss.insertSheet(SHEET_DICT);
  } else {
    dictSheet.clear();
  }
  
  var dictHeaders = [
    "Nombre de Columna (Limpio)",
    "Pregunta Original en Formulario",
    "Tipo de Variable",
    "Valores Posibles / Rango",
    "Descripción / Transformación Aplicada"
  ];
  
  var dictData = [
    ["timestamp", "Marca de Tiempo", "Fecha/Hora", "Cualquier marca de tiempo válida", "Fecha y hora en que se registró la encuesta."],
    ["frecuencia_consumo", "P1. ¿Con qué frecuencia consumes 'fresco' de jamaica?", "Categórica nominal", "6 a 7 veces por semana, Casi nunca, Nunca, etc.", "Frecuencia de consumo habitual de la bebida."],
    ["razon_no_consumo", "P1b. ¿Por qué no consumes 'fresco' de jamaica?", "Categórica nominal", "Me hace daño, No me gusta, Otro, N/A", "Razón principal por la que no consumen. N/A si consumen."],
    ["razon_no_consumo_texto_abierto", "P1b. Otro:", "Texto abierto", "Texto libre", "Explicación en texto si la opción de no consumo fue 'Otro'."],
    
    // P2
    ["momento_almuerzo", "P2. Momentos de consumo (Almuerzo)", "Binaria (0/1)", "0, 1", "1 si seleccionó consumir durante el almuerzo, 0 de lo contrario."],
    ["momento_cena", "P2. Momentos de consumo (Cena)", "Binaria (0/1)", "0, 1", "1 si seleccionó consumir durante la cena, 0 de lo contrario."],
    ["momento_pupuseria_tipico", "P2. Momentos de consumo (Pupusería/Típico)", "Binaria (0/1)", "0, 1", "1 si seleccionó consumir en pupusería o comida típica, 0 de lo contrario."],
    ["momento_salida_familiar", "P2. Momentos de consumo (Salida familiar)", "Binaria (0/1)", "0, 1", "1 si seleccionó consumir en salida familiar, 0 de lo contrario."],
    ["momento_para_llevar", "P2. Momentos de consumo (Bebida para llevar)", "Binaria (0/1)", "0, 1", "1 si seleccionó como bebida para llevar, 0 de lo contrario."],
    ["momento_en_casa", "P2. Momentos de consumo (En casa)", "Binaria (0/1)", "0, 1", "1 si seleccionó consumir en casa, 0 de lo contrario."],
    ["momento_ninguno", "P2. Momentos de consumo (Ninguno)", "Binaria (0/1)", "0, 1", "1 si seleccionó no imaginarse tomándolo, 0 de lo contrario."],
    
    // P3
    ["desc_autentica", "P3. Palabras descriptoras (Auténtica)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Auténtica', 0 de lo contrario."],
    ["desc_tradicional", "P3. Palabras descriptoras (Tradicional)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Tradicional', 0 de lo contrario."],
    ["desc_moderna", "P3. Palabras descriptoras (Moderna)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Moderna', 0 de lo contrario."],
    ["desc_premium", "P3. Palabras descriptoras (Premium)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Premium', 0 de lo contrario."],
    ["desc_refrescante", "P3. Palabras descriptoras (Refrescante)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Refrescante', 0 de lo contrario."],
    ["desc_saludable", "P3. Palabras descriptoras (Saludable)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Saludable', 0 de lo contrario."],
    ["desc_natural", "P3. Palabras descriptoras (Natural)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Natural', 0 de lo contrario."],
    ["desc_artificial", "P3. Palabras descriptoras (Artificial)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Artificial', 0 de lo contrario."],
    ["desc_cara", "P3. Palabras descriptoras (Cara)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Cara', 0 de lo contrario."],
    ["desc_bonita", "P3. Palabras descriptoras (Bonita)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Bonita', 0 de lo contrario."],
    ["desc_comun", "P3. Palabras descriptoras (Común)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Común', 0 de lo contrario."],
    ["desc_confusa", "P3. Palabras descriptoras (Confusa)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Confusa', 0 de lo contrario."],
    ["desc_antojable", "P3. Palabras descriptoras (Antojable)", "Binaria (0/1)", "0, 1", "1 si asocia con 'Antojable', 0 de lo contrario."],
    ["desc_otro", "P3. Palabras descriptoras (Otro)", "Binaria (0/1)", "0, 1", "1 si especificó un descriptor propio, 0 de lo contrario."],
    ["desc_otro_texto", "P3. Otro:", "Texto abierto", "Texto libre", "Descriptor personalizado escrito por el encuestado."],
    
    // P4
    ["likert_autentica", "P4_1. Auténtica (Likert)", "Numérica discreta (Likert)", "1 a 5 (Entero)", "Nivel de acuerdo con: 'Jamaica Pipiles se ve auténtica'."],
    ["likert_moderna", "P4_2. Moderna (Likert)", "Numérica discreta (Likert)", "1 a 5 (Entero)", "Nivel de acuerdo con: 'Se ve como versión moderna de bebida tradicional'."],
    ["likert_premium", "P4_3. Premium (Likert)", "Numérica discreta (Likert)", "1 a 5 (Entero)", "Nivel de acuerdo con: 'El producto se ve premium'."],
    ["likert_empaque", "P4_4. Empaque (Likert)", "Numérica discreta (Likert)", "1 a 5 (Entero)", "Nivel de acuerdo con: 'El empaque me parece atractivo'."],
    ["likert_calorias", "P4_5. Calorías (Likert)", "Numérica discreta (Likert)", "1 a 5 (Entero)", "Nivel de acuerdo con: 'Se entiende que es baja en calorías'."],
    ["likert_confianza", "P4_6. Confianza (Likert)", "Numérica discreta (Likert)", "1 a 5 (Entero)", "Nivel de acuerdo con: 'El producto me genera confianza'."],
    
    // P5
    ["comparacion_sabor", "P5. Comparación sabor", "Categórica ordinal", "Mucho mejor, Algo mejor, Igual, etc.", "Expectativa de sabor comparada con la tradicional."],
    
    // P6
    ["razon_compra_jamaica", "P6. Razón compra (Gusta la jamaica)", "Binaria (0/1)", "0, 1", "1 si compraría porque le gusta la jamaica, 0 de lo contrario."],
    ["razon_compra_bajo_calorias", "P6. Razón compra (Baja en calorías)", "Binaria (0/1)", "0, 1", "1 si compraría porque es baja en calorías, 0 de lo contrario."],
    ["razon_compra_empaque", "P6. Razón compra (Empaque atractivo)", "Binaria (0/1)", "0, 1", "1 si compraría por su empaque, 0 de lo contrario."],
    ["razon_compra_marca", "P6. Razón compra (Gusta la marca)", "Binaria (0/1)", "0, 1", "1 si compraría por apego a la marca, 0 de lo contrario."],
    ["razon_compra_higienica", "P6. Razón compra (Higiénica/Confiable)", "Binaria (0/1)", "0, 1", "1 si compraría porque se ve higiénica/confiable, 0 de lo contrario."],
    ["razon_compra_diferente", "P6. Razón compra (Diferente)", "Binaria (0/1)", "0, 1", "1 si compraría porque es diferente, 0 de lo contrario."],
    ["razon_compra_no_compraria", "P6. Razón compra (No compraría)", "Binaria (0/1)", "0, 1", "1 si indica que no compraría la marca, 0 de lo contrario."],
    ["razon_compra_otro", "P6. Razón compra (Otro)", "Binaria (0/1)", "0, 1", "1 si seleccionó otra razón, 0 de lo contrario."],
    ["razon_compra_otro_texto", "P6. Otro:", "Texto abierto", "Texto libre", "Razón de compra personalizada escrita por el encuestado."],
    
    // P7
    ["freno_compra", "P7. Duda/Freno", "Categórica nominal", "Sabor tradicional, Sabor artificial, Cara, etc.", "Principal duda o barrera antes de comprar."],
    ["freno_compra_texto_abierto", "P7. Otro:", "Texto abierto", "Texto libre", "Barrera personalizada escrita por el encuestado."],
    ["freno_sabor_tradicional", "P7. Duda/Freno (Sabor tradicional)", "Binaria (0/1)", "0, 1", "1 si su freno es que no sepa tradicional, 0 de lo contrario."],
    ["freno_sabor_artificial", "P7. Duda/Freno (Sabor artificial)", "Binaria (0/1)", "0, 1", "1 si su freno es el sabor artificial, 0 de lo contrario."],
    ["freno_demasiado_cara", "P7. Duda/Freno (Cara)", "Binaria (0/1)", "0, 1", "1 si su freno es que sea muy cara, 0 de lo contrario."],
    ["freno_no_creer_calorias", "P7. Duda/Freno (No creer calorías)", "Binaria (0/1)", "0, 1", "1 si su freno es escepticismo sobre calorías, 0 de lo contrario."],
    ["freno_ninguna_duda", "P7. Duda/Freno (Ninguna)", "Binaria (0/1)", "0, 1", "1 si no tiene ninguna barrera, 0 de lo contrario."],
    ["freno_otro", "P7. Duda/Freno (Otro)", "Binaria (0/1)", "0, 1", "1 si tiene un freno personalizado, 0 de lo contrario."],
    
    // P8, P9, P10
    ["probabilidad_compra", "P8. Probabilidad compra", "Categórica ordinal", "Definitivamente compraría, Tal vez..., etc.", "Nivel de intención de compra."],
    ["vasos_mes", "P9. Vasos al mes", "Numérica continua", "0, 1, 2, 3.5, 6.5, 10 (Decimal/Entero)", "Estimación numérica de vasos a consumir al mes (promedio del rango)."],
    ["vasos_mes_original", "P9. Vasos al mes (Original)", "Categórica ordinal", "Texto original del formulario", "Texto crudo de la cantidad de vasos."],
    ["precio_estimado", "P10. Precio estimado", "Categórica ordinal", "Menos de $2.00, $2.25, etc.", "Rango de precio que el usuario asume según la presentación."],
    ["precio_exacto", "P10b. Precio exacto", "Numérica continua", "Valor decimal (ej: 1.50)", "Precio numérico exacto estimado en dólares. Limpio y sin signos."],
    ["precio_exacto_original", "P10b. Precio exacto (Original)", "Texto abierto", "Texto crudo del formulario", "Texto crudo del precio ingresado."],
    
    // Control
    ["respuesta_valida", "Control", "Binaria (0/1)", "0, 1", "Indica con 1 si la encuesta tiene datos esenciales completos, o 0 si está incompleta/inválida."],
    ["observaciones_limpieza", "Control", "Texto abierto", "Mensajes de error/advertencia", "Registro de problemas detectados durante la limpieza de esta respuesta."]
  ];
  
  dictSheet.appendRow(dictHeaders);
  dictSheet.getRange(2, 1, dictData.length, dictHeaders.length).setValues(dictData);
  
  dictSheet.setFrozenRows(1);
  var headerRange = dictSheet.getRange(1, 1, 1, dictHeaders.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#5C6BC0"); // Azul Indigo
  headerRange.setFontColor("#FFFFFF");
  headerRange.setHorizontalAlignment("center");
  
  for (var col = 1; col <= dictHeaders.length; col++) {
    dictSheet.autoResizeColumn(col);
  }
  
  var dataRange = dictSheet.getDataRange();
  dataRange.setBorder(true, true, true, true, true, true, "#E0E0E0", SpreadsheetApp.BorderStyle.SOLID);
}
