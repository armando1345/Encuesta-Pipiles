/* ==========================================================================
   LÓGICA DE CONTROL: ENCUESTA INTERACTIVA DE JAMAICA PIPILES
   ========================================================================== */

// URL del Web App de Google Apps Script (el usuario debe reemplazar esta URL con la suya)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_XXXXXXXX_REPLACE_ME_XXXXXXXX/exec";

// Lista ordenada de los IDs de todos los pasos del flujo
const STEPS = [
    "step-0",          // Bienvenida
    "quiz-container",  // Contenedor principal de preguntas (no es un paso en sí, pero activa el form)
    "step-multimedia", // Videos e Imágenes
    "step-1",          // Pregunta 1
    "step-1b",         // Pregunta 1b (Bifurcación si P1 = Nunca)
    "step-2",          // Pregunta 2
    "step-3",          // Pregunta 3
    "step-4",          // Pregunta 4 (Matriz Likert)
    "step-5",          // Pregunta 5
    "step-6",          // Pregunta 6
    "step-7",          // Pregunta 7
    "step-8",          // Pregunta 8
    "step-9",          // Pregunta 9
    "step-10",         // Pregunta 10
    "step-10b",        // Pregunta 10b (Bifurcación si P10 = Menos de $2)
    "step-loading",    // Pantalla de carga
    "step-success",    // Pantalla de éxito
    "step-error"       // Pantalla de error
];

let currentStepIndex = 0; // Inicia en Bienvenida (step-0)
// Historial para navegación precisa con bifurcaciones
let navigationHistory = [];

document.addEventListener("DOMContentLoaded", () => {
    initStepUI();
    setupConditionalInputs();
    setupCheckboxLimits();
});

/**
 * Inicializa la UI en el paso inicial
 */
function initStepUI() {
    showStep(currentStepIndex);
}

/**
 * Muestra el paso correspondiente por su índice
 * @param {number} index Índice del paso a mostrar
 */
function showStep(index) {
    const currentStepId = STEPS[index];

    // Ocultar la pantalla de bienvenida si no estamos en ella
    const introEl = document.getElementById("step-0");
    const formContainer = document.getElementById("quiz-container");

    if (currentStepId === "step-0") {
        introEl.style.display = "grid";
        formContainer.style.display = "none";
    } else {
        introEl.style.display = "none";
        formContainer.style.display = "block";
        
        // Ocultar todos los fieldsets del form
        const fieldsets = formContainer.querySelectorAll("fieldset");
        fieldsets.forEach(fs => {
            fs.classList.remove("is-active");
            fs.style.display = "none";
        });

        // Mostrar el paso actual (fieldset)
        const currentStepEl = document.getElementById(currentStepId);
        if (currentStepEl) {
            currentStepEl.style.display = "grid";
            // Pequeño retraso para que la animación CSS aplique correctamente
            setTimeout(() => {
                currentStepEl.classList.add("is-active");
            }, 10);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    updateProgressBar(currentStepId);
}

/**
 * Actualiza la barra de progreso en base al paso actual de preguntas
 * @param {string} stepId ID del paso actual
 */
function updateProgressBar(stepId) {
    const progressContainer = document.querySelector(".quiz-progress");
    const progressBar = document.getElementById("progress-bar");
    const currentStepNumSpan = document.getElementById("current-step-num");
    const totalStepsNumSpan = document.getElementById("total-steps-num");

    // Mapeo del ID de paso a su número visual para la encuesta
    const stepNumbers = {
        "step-0": 0,
        "step-multimedia": 1,
        "step-1": 2,
        "step-1b": 2, // Se mantiene como paso 2 ya que es una subpregunta
        "step-2": 3,
        "step-3": 4,
        "step-4": 5,
        "step-5": 6,
        "step-6": 7,
        "step-7": 8,
        "step-8": 9,
        "step-9": 10,
        "step-10": 11,
        "step-10b": 11 // Se mantiene como paso 11
    };

    const visualStep = stepNumbers[stepId] !== undefined ? stepNumbers[stepId] : 12;
    const totalVisualSteps = 12; // Bienvenida (0) + Multimedia (1) + 10 Preguntas (2-11)

    // Ocultar barra de progreso en pantallas finales o iniciales
    if (stepId === "step-0" || stepId === "step-loading" || stepId === "step-success" || stepId === "step-error") {
        if (progressContainer) progressContainer.style.display = "none";
    } else {
        if (progressContainer) progressContainer.style.display = "grid";
    }

    if (currentStepNumSpan && totalStepsNumSpan && progressBar) {
        currentStepNumSpan.textContent = visualStep;
        totalStepsNumSpan.textContent = totalVisualSteps;
        const progressPercentage = (visualStep / totalVisualSteps) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }
}

/**
 * Navega al paso siguiente evaluando la lógica condicional y validando la entrada
 */
function nextStep() {
    const currentStepId = STEPS[currentStepIndex];

    // 1. Validar si la pregunta del paso actual fue contestada
    if (!validateStepInput(currentStepId)) {
        showValidationWarning();
        return;
    }

    // Ocultar mensaje de error si existía
    const errorEl = document.getElementById("quizStepError");
    if(errorEl) errorEl.style.display = "none";

    // Guardar el paso actual en el historial antes de saltar
    navigationHistory.push(currentStepIndex);

    // 2. Evaluar paso 0 a multimedia
    if (currentStepId === "step-0") {
        currentStepIndex = STEPS.indexOf("step-multimedia");
        showStep(currentStepIndex);
        return;
    }

    // 3. Evaluar bifurcación en Pregunta 1 (step-1)
    if (currentStepId === "step-1") {
        const checkedP1 = document.querySelector('input[name="p1_frecuencia"]:checked');
        if (checkedP1 && checkedP1.value.includes("Nunca")) {
            currentStepIndex = STEPS.indexOf("step-1b"); // Ir a 1b
        } else {
            currentStepIndex = STEPS.indexOf("step-2");  // Saltar 1b, ir a P2
        }
        showStep(currentStepIndex);
        return;
    }

    // 4. Evaluar bifurcación en Pregunta 10 (step-10)
    if (currentStepId === "step-10") {
        const checkedP10 = document.querySelector('input[name="p10_precio_estimado"]:checked');
        if (checkedP10 && checkedP10.value.includes("Menos de $2.00")) {
            currentStepIndex = STEPS.indexOf("step-10b"); // Ir a 10b
        } else {
            submitSurvey();
            return;
        }
        showStep(currentStepIndex);
        return;
    }

    // 5. Flujo normal secuencial
    if (currentStepIndex < STEPS.length - 1) {
        currentStepIndex++;
        // Saltar el índice "quiz-container" si cae allí (no debería pasar por el flow anterior, pero porsiacaso)
        if(STEPS[currentStepIndex] === "quiz-container") currentStepIndex++;
        
        showStep(currentStepIndex);
    }
}

/**
 * Navega al paso anterior en base al historial recorrido
 */
function prevStep() {
    if (navigationHistory.length > 0) {
        currentStepIndex = navigationHistory.pop();
        showStep(currentStepIndex);
        
        const errorEl = document.getElementById("quizStepError");
        if(errorEl) errorEl.style.display = "none";
    }
}

/**
 * Valida si se ha ingresado/seleccionado una respuesta válida en el paso actual
 * @param {string} stepId ID del paso actual
 * @returns {boolean} True si es válido
 */
function validateStepInput(stepId) {
    if (stepId === "step-0" || stepId === "step-multimedia" || stepId === "step-loading" || stepId === "step-success" || stepId === "step-error") {
        return true;
    }

    const container = document.getElementById(stepId);
    if (!container) return true;

    // Caso de preguntas de opción única (Radio buttons)
    const radios = container.querySelectorAll('input[type="radio"]');
    if (radios.length > 0) {
        const isLikert = stepId === "step-4";
        if (isLikert) {
            const groups = ["p4_1_autentica", "p4_2_moderna", "p4_3_premium", "p4_4_empaque", "p4_5_calorias", "p4_6_confianza"];
            return groups.every(groupName => {
                return document.querySelector(`input[name="${groupName}"]:checked`) !== null;
            });
        } else {
            const name = radios[0].name;
            const checkedRadio = document.querySelector(`input[name="${name}"]:checked`);
            if (checkedRadio) {
                if (checkedRadio.id.includes("otro") || checkedRadio.value === "Otro") {
                    const textInput = container.querySelector('input[type="text"]');
                    return textInput && textInput.value.trim() !== "";
                }
                return true;
            }
            return false;
        }
    }

    // Caso de preguntas de selección múltiple (Checkboxes)
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        if (checkedCount === 0) return false;

        const otroCheck = container.querySelector('input[id*="otro"]');
        if (otroCheck && otroCheck.checked) {
            const textInput = container.querySelector('input[type="text"]');
            return textInput && textInput.value.trim() !== "";
        }
        return true;
    }

    // Caso de entrada de texto
    const textInput = container.querySelector('input[type="text"]');
    if (textInput) {
        return textInput.value.trim() !== "";
    }

    return true;
}

/**
 * Muestra una advertencia visual si el usuario intenta continuar sin responder
 */
function showValidationWarning() {
    const errorEl = document.getElementById("quizStepError");
    if(errorEl) {
        errorEl.textContent = "Por favor, selecciona una opción para continuar.";
        errorEl.style.display = "block";
    }
}

/**
 * Configura la lógica para habilitar/deshabilitar los campos de texto inline ("Otro")
 */
function setupConditionalInputs() {
    const configConditional = (radioOrCheckId, conditionalDivId, inputId) => {
        const trigger = document.getElementById(radioOrCheckId);
        const conditionalDiv = document.getElementById(conditionalDivId);
        const input = document.getElementById(inputId);
        
        if(trigger && conditionalDiv && input) {
            // Event delegation on the parent container or directly
            const parentForm = trigger.closest('fieldset');
            const allInputs = parentForm.querySelectorAll(`input[name="${trigger.name}"]`);
            
            allInputs.forEach(i => {
                i.addEventListener("change", () => {
                    if (trigger.checked) {
                        conditionalDiv.style.display = "block";
                        input.focus();
                    } else {
                        conditionalDiv.style.display = "none";
                        input.value = "";
                    }
                });
            });
        }
    };

    configConditional("p1b-otro-radio", "p1b-conditional", "p1b_razon_no_consumo_otro");
    configConditional("p3-otro-check", "p3-conditional", "p3_palabras_otro");
    configConditional("p6-otro-check", "p6-conditional", "p6_razon_compra_otro");
    configConditional("p7-otro-radio", "p7-conditional", "p7_duda_freno_otro");
}

/**
 * Configura la limitación de marcar un máximo de 3 checkboxes en las preguntas indicadas
 */
function setupCheckboxLimits() {
    const configureLimit = (containerId, limitNumber) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                // Caso excluyente ("Ninguna")
                const noOptionsCheck = container.querySelector('input[id*="ninguno"], input[id*="no-compraria"]');
                if (noOptionsCheck && cb === noOptionsCheck && cb.checked) {
                    checkboxes.forEach(otherCb => {
                        if (otherCb !== cb) {
                            otherCb.checked = false;
                            otherCb.setAttribute("disabled", "true");
                            otherCb.closest('.quiz-option').style.opacity = '0.5';
                        }
                    });
                    // Trigger change para que se oculten los "Otros" si estaban activos
                    const event = new Event('change');
                    container.dispatchEvent(event);
                    return;
                }

                if (noOptionsCheck && cb === noOptionsCheck && !cb.checked) {
                    checkboxes.forEach(otherCb => {
                        otherCb.removeAttribute("disabled");
                        otherCb.closest('.quiz-option').style.opacity = '1';
                    });
                    return;
                }

                const checkedCount = Array.from(checkboxes).filter(c => c.checked).length;
                if (checkedCount >= limitNumber) {
                    checkboxes.forEach(otherCb => {
                        if (!otherCb.checked) {
                            otherCb.setAttribute("disabled", "true");
                            otherCb.closest('.quiz-option').style.opacity = '0.5';
                        }
                    });
                } else {
                    checkboxes.forEach(otherCb => {
                        if (noOptionsCheck && !noOptionsCheck.checked && otherCb !== noOptionsCheck) {
                            otherCb.removeAttribute("disabled");
                            otherCb.closest('.quiz-option').style.opacity = '1';
                        }
                    });
                }
            });
        });
    };

    configureLimit("p2-checkboxes", 3);
    configureLimit("p3-checkboxes", 3);
    configureLimit("p6-checkboxes", 3);
}

/**
 * Controla el cambio de pestañas de Multimedia (Videos / Imágenes)
 */
function switchTab(tabName) {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => btn.classList.remove("active"));
    tabContents.forEach(content => content.classList.remove("active"));

    if (tabName === "videos") {
        tabButtons[0].classList.add("active");
        document.getElementById("tab-content-videos").classList.add("active");
    } else {
        tabButtons[1].classList.add("active");
        document.getElementById("tab-content-images").classList.add("active");
    }
}

/**
 * Recopila los datos del formulario de la encuesta
 */
function gatherSurveyData() {
    const data = {};

    const p1 = document.querySelector('input[name="p1_frecuencia"]:checked');
    data.p1_frecuencia = p1 ? p1.value : "";

    const p1b = document.querySelector('input[name="p1b_razon_no_consumo"]:checked');
    if (p1b) {
        if (p1b.value === "Otro") {
            data.p1b_razon_no_consumo = `Otro: ${document.getElementById("p1b_razon_no_consumo_otro").value}`;
        } else {
            data.p1b_razon_no_consumo = p1b.value;
        }
    } else {
        data.p1b_razon_no_consumo = "N/A";
    }

    const p2Checks = document.querySelectorAll('input[name="p2_momento"]:checked');
    data.p2_momento = Array.from(p2Checks).map(cb => cb.value).join(", ");

    const p3Checks = document.querySelectorAll('input[name="p3_palabras"]:checked');
    data.p3_palabras = Array.from(p3Checks).map(cb => {
        if (cb.value === "Otro") {
            return `Otro: ${document.getElementById("p3_palabras_otro").value}`;
        }
        return cb.value;
    }).join(", ");

    const p4_1 = document.querySelector('input[name="p4_1_autentica"]:checked');
    const p4_2 = document.querySelector('input[name="p4_2_moderna"]:checked');
    const p4_3 = document.querySelector('input[name="p4_3_premium"]:checked');
    const p4_4 = document.querySelector('input[name="p4_4_empaque"]:checked');
    const p4_5 = document.querySelector('input[name="p4_5_calorias"]:checked');
    const p4_6 = document.querySelector('input[name="p4_6_confianza"]:checked');

    data.p4_1_autentica = p4_1 ? p4_1.value : "";
    data.p4_2_moderna = p4_2 ? p4_2.value : "";
    data.p4_3_premium = p4_3 ? p4_3.value : "";
    data.p4_4_empaque = p4_4 ? p4_4.value : "";
    data.p4_5_calorias = p4_5 ? p4_5.value : "";
    data.p4_6_confianza = p4_6 ? p4_6.value : "";

    const p5 = document.querySelector('input[name="p5_comparacion_sabor"]:checked');
    data.p5_comparacion_sabor = p5 ? p5.value : "";

    const p6Checks = document.querySelectorAll('input[name="p6_razon_compra"]:checked');
    data.p6_razon_compra = Array.from(p6Checks).map(cb => {
        if (cb.value === "Otro") {
            return `Otro: ${document.getElementById("p6_razon_compra_otro").value}`;
        }
        return cb.value;
    }).join(", ");

    const p7 = document.querySelector('input[name="p7_duda_freno"]:checked');
    if (p7) {
        if (p7.value === "Otro") {
            data.p7_duda_freno = `Otro: ${document.getElementById("p7_duda_freno_otro").value}`;
        } else {
            data.p7_duda_freno = p7.value;
        }
    } else {
        data.p7_duda_freno = "";
    }

    const p8 = document.querySelector('input[name="p8_probabilidad_compra"]:checked');
    data.p8_probabilidad_compra = p8 ? p8.value : "";

    const p9 = document.querySelector('input[name="p9_vasos_mes"]:checked');
    data.p9_vasos_mes = p9 ? p9.value : "";

    const p10 = document.querySelector('input[name="p10_precio_estimado"]:checked');
    data.p10_precio_estimado = p10 ? p10.value : "";

    const p10b = document.getElementById("p10b_precio_exacto");
    data.p10b_precio_exacto = (p10 && p10.value.includes("Menos de $2.00") && p10b) ? p10b.value : "N/A";

    data.timestamp = new Date().toLocaleString("es-ES");

    return data;
}

/**
 * Envía la encuesta al endpoint de Google Apps Script
 */
function submitSurvey() {
    currentStepIndex = STEPS.indexOf("step-loading");
    showStep(currentStepIndex);

    const surveyData = gatherSurveyData();

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(surveyData)
    })
    .then(() => {
        currentStepIndex = STEPS.indexOf("step-success");
        showStep(currentStepIndex);
    })
    .catch(error => {
        console.error("Error al enviar la encuesta:", error);
        currentStepIndex = STEPS.indexOf("step-error");
        showStep(currentStepIndex);
    });
}
