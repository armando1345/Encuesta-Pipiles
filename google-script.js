/* ==========================================================================
   CÓDIGO DE GOOGLE APPS SCRIPT: BACKEND PARA JAMAICA PIPILES
   ==========================================================================
   Este script debe pegarse dentro del editor de secuencias de comandos 
   de un archivo de Google Sheets (Extensiones > Apps Script).
   
   Permite recibir las respuestas del formulario web y guardarlas en 
   la hoja de cálculo de forma automática.
*/

/**
 * Manejador para peticiones POST enviadas por el formulario web.
 */
function doPost(e) {
  try {
    // Obtener los datos JSON de la petición
    var data = JSON.parse(e.postData.contents);
    
    // Obtener la hoja de cálculo activa
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Si la hoja está vacía, crear los encabezados de columna
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Marca de Tiempo",
        "P1. Frecuencia Consumo",
        "P1b. Razón No Consumo",
        "P2. Momentos de Consumo",
        "P3. Palabras Descriptoras",
        "P4_1. Auténtica (Likert)",
        "P4_2. Moderna (Likert)",
        "P4_3. Premium (Likert)",
        "P4_4. Empaque (Likert)",
        "P4_5. Calorías (Likert)",
        "P4_6. Confianza (Likert)",
        "P5. Comparación Sabor",
        "P6. Razón Compra",
        "P7. Duda/Freno Compra",
        "P8. Probabilidad Compra",
        "P9. Vasos al Mes",
        "P10. Precio Estimado",
        "P10b. Precio Exacto"
      ];
      sheet.appendRow(headers);
      
      // Aplicar formato básico a los encabezados
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#6D1B5E"); // Púrpura Pipiles
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
    
    // Preparar la fila con las respuestas en el orden correspondiente
    var newRow = [
      data.timestamp || new Date().toLocaleString("es-ES"),
      data.p1_frecuencia || "",
      data.p1b_razon_no_consumo || "",
      data.p2_momento || "",
      data.p3_palabras || "",
      data.p4_1_autentica || "",
      data.p4_2_moderna || "",
      data.p4_3_premium || "",
      data.p4_4_empaque || "",
      data.p4_5_calorias || "",
      data.p4_6_confianza || "",
      data.p5_comparacion_sabor || "",
      data.p6_razon_compra || "",
      data.p7_duda_freno || "",
      data.p8_probabilidad_compra || "",
      data.p9_vasos_mes || "",
      data.p10_precio_estimado || "",
      data.p10b_precio_exacto || ""
    ];
    
    // Insertar la fila al final de la hoja
    sheet.appendRow(newRow);
    
    // Retornar éxito
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Respuestas guardadas correctamente" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*"); // Permitir CORS
      
  } catch (error) {
    // Retornar error
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*"); // Permitir CORS
  }
}

/**
 * Manejador para peticiones GET (opcional, para verificar que el script está activo)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", message: "El endpoint de la encuesta de Pipiles está en línea" }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}
