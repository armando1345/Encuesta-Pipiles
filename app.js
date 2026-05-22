/* ==========================================================================
   Logica de control: encuesta interactiva de Jamaica Pipiles
   ========================================================================== */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzzD1b1WoiC1pFZSklPBy1pxOTaWLi0Q5ntdMduvIUm0A6IdOgvWttck3ylRQZqlg/exec";

const STEPS = [
    "step-0",
    "quiz-container",
    "step-multimedia",
    "step-1",
    "step-1b",
    "step-2",
    "step-3",
    "step-4",
    "step-5",
    "step-6",
    "step-7",
    "step-8",
    "step-9",
    "step-10",
    "step-10b",
    "step-loading",
    "step-success",
    "step-error"
];

let currentStepIndex = 0;
let navigationHistory = [];

document.addEventListener("DOMContentLoaded", () => {
    initStepUI();
    setupConditionalInputs();
    setupCheckboxLimits();
    setupLikertScales();
    setupImageLightbox();
});

function initStepUI() {
    showStep(currentStepIndex);
}

function showStep(index) {
    const currentStepId = STEPS[index];
    const introEl = document.getElementById("step-0");
    const formContainer = document.getElementById("quiz-container");
    document.body.dataset.quizStep = currentStepId;

    if (currentStepId === "step-0") {
        introEl.style.display = "grid";
        formContainer.style.display = "none";
    } else {
        introEl.style.display = "none";
        formContainer.style.display = "block";

        const fieldsets = formContainer.querySelectorAll("fieldset");
        fieldsets.forEach(fs => {
            fs.classList.remove("is-active");
            fs.style.display = "none";
        });

        const currentStepEl = document.getElementById(currentStepId);
        if (currentStepEl) {
            currentStepEl.style.display = "grid";
            setTimeout(() => {
                currentStepEl.classList.add("is-active");
            }, 10);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    updateProgressBar(currentStepId);
}

function updateProgressBar(stepId) {
    const progressContainer = document.querySelector(".quiz-progress");
    const progressBar = document.getElementById("progress-bar");
    const progressLabel = document.getElementById("progress-label");

    const questionNumbers = {
        "step-1": 1,
        "step-1b": 1,
        "step-2": 2,
        "step-3": 3,
        "step-4": 4,
        "step-5": 5,
        "step-6": 6,
        "step-7": 7,
        "step-8": 8,
        "step-9": 9,
        "step-10": 10,
        "step-10b": 10
    };

    if (stepId === "step-0" || stepId === "step-loading" || stepId === "step-success" || stepId === "step-error") {
        if (progressContainer) progressContainer.style.display = "none";
        return;
    }

    if (progressContainer) progressContainer.style.display = "grid";
    if (!progressBar || !progressLabel) return;

    if (stepId === "step-multimedia") {
        progressLabel.textContent = "Producto";
        progressBar.style.width = "8%";
        return;
    }

    const questionNumber = questionNumbers[stepId] || 0;
    progressLabel.textContent = `Pregunta ${questionNumber} de 10`;
    progressBar.style.width = `${(questionNumber / 10) * 100}%`;
}

function nextStep() {
    const currentStepId = STEPS[currentStepIndex];

    if (!validateStepInput(currentStepId)) {
        showValidationWarning(currentStepId);
        return;
    }

    clearValidationWarning(currentStepId);
    navigationHistory.push(currentStepIndex);

    if (currentStepId === "step-0") {
        currentStepIndex = STEPS.indexOf("step-multimedia");
        showStep(currentStepIndex);
        return;
    }

    if (currentStepId === "step-1") {
        const checkedP1 = document.querySelector('input[name="p1_frecuencia"]:checked');
        currentStepIndex = checkedP1 && checkedP1.value.includes("Nunca")
            ? STEPS.indexOf("step-1b")
            : STEPS.indexOf("step-2");
        showStep(currentStepIndex);
        return;
    }

    if (currentStepId === "step-1b") {
        submitSurvey();
        return;
    }

    if (currentStepId === "step-10") {
        const checkedP10 = document.querySelector('input[name="p10_precio_estimado"]:checked');
        if (checkedP10 && checkedP10.value.includes("Menos de $2.00")) {
            currentStepIndex = STEPS.indexOf("step-10b");
            showStep(currentStepIndex);
        } else {
            submitSurvey();
        }
        return;
    }

    if (currentStepIndex < STEPS.length - 1) {
        currentStepIndex++;
        if (STEPS[currentStepIndex] === "quiz-container") currentStepIndex++;
        showStep(currentStepIndex);
    }
}

function prevStep() {
    if (navigationHistory.length > 0) {
        currentStepIndex = navigationHistory.pop();
        showStep(currentStepIndex);
        clearValidationWarning(STEPS[currentStepIndex]);
    }
}

function validateStepInput(stepId) {
    if (stepId === "step-0" || stepId === "step-multimedia" || stepId === "step-loading" || stepId === "step-success" || stepId === "step-error") {
        return true;
    }

    const container = document.getElementById(stepId);
    if (!container) return true;

    const radios = container.querySelectorAll('input[type="radio"]');
    if (radios.length > 0) {
        if (stepId === "step-4") {
            const groups = ["p4_1_autentica", "p4_2_moderna", "p4_3_premium", "p4_4_empaque", "p4_5_calorias", "p4_6_confianza"];
            return groups.every(groupName => document.querySelector(`input[name="${groupName}"]:checked`) !== null);
        }

        const name = radios[0].name;
        const checkedRadio = document.querySelector(`input[name="${name}"]:checked`);
        if (!checkedRadio) return false;

        if (checkedRadio.id.includes("otro") || checkedRadio.value === "Otro") {
            const textInput = container.querySelector('input[type="text"]');
            return textInput && textInput.value.trim() !== "";
        }

        return true;
    }

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

    const textInput = container.querySelector('input[type="text"]');
    return textInput ? textInput.value.trim() !== "" : true;
}

function getStepErrorEl(stepId) {
    const container = document.getElementById(stepId);
    if (!container) return null;

    let errorEl = container.querySelector(".field-error");
    if (!errorEl) {
        errorEl = document.createElement("p");
        errorEl.className = "field-error";
        errorEl.setAttribute("role", "alert");

        const actions = container.querySelector(".quiz-actions");
        container.insertBefore(errorEl, actions || null);
    }

    return errorEl;
}

function getValidationMessage(stepId) {
    const container = document.getElementById(stepId);
    if (!container) return "Completa este paso para continuar.";

    if (stepId === "step-4") {
        return "Responde todas las afirmaciones de la escala antes de continuar.";
    }

    const checkedOtro = container.querySelector('input[id*="otro"]:checked');
    if (checkedOtro) {
        return "Especifica tu respuesta en el campo de texto.";
    }

    if (container.querySelector('input[type="text"]') && !container.querySelector('input[type="radio"], input[type="checkbox"]')) {
        return "Escribe tu estimado antes de enviar la encuesta.";
    }

    if (container.querySelector('input[type="checkbox"]')) {
        return "Selecciona al menos una opcion para continuar.";
    }

    return "Selecciona una opcion para continuar.";
}

function showValidationWarning(stepId) {
    const errorEl = getStepErrorEl(stepId);
    if (errorEl) {
        errorEl.textContent = getValidationMessage(stepId);
        errorEl.style.display = "block";
        errorEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

function clearValidationWarning(stepId) {
    const container = document.getElementById(stepId);
    const errorEl = container ? container.querySelector(".field-error") : null;
    if (errorEl) errorEl.style.display = "none";
}

function setupConditionalInputs() {
    const configConditional = (radioOrCheckId, conditionalDivId, inputId) => {
        const trigger = document.getElementById(radioOrCheckId);
        const conditionalDiv = document.getElementById(conditionalDivId);
        const input = document.getElementById(inputId);

        if (trigger && conditionalDiv && input) {
            const parentForm = trigger.closest("fieldset");
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

function setupCheckboxLimits() {
    const configureLimit = (containerId, limitNumber) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        const note = document.createElement("p");
        note.className = "quiz-limit-note";
        container.insertAdjacentElement("beforebegin", note);

        const setOptionDisabled = (checkbox, disabled) => {
            checkbox.disabled = disabled;
            const option = checkbox.closest(".quiz-option");
            if (option) option.classList.toggle("is-disabled", disabled);
        };

        const updateNote = () => {
            const checkedCount = checkboxes.filter(c => c.checked).length;
            const noOptionsCheck = container.querySelector('input[id*="ninguno"], input[id*="no-compraria"]');
            const isExclusive = noOptionsCheck && noOptionsCheck.checked;
            note.textContent = isExclusive
                ? "Opcion exclusiva seleccionada."
                : `${Math.min(checkedCount, limitNumber)}/${limitNumber} seleccionadas`;
            note.classList.toggle("is-full", !isExclusive && checkedCount >= limitNumber);
        };

        checkboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                const noOptionsCheck = container.querySelector('input[id*="ninguno"], input[id*="no-compraria"]');

                if (noOptionsCheck && cb === noOptionsCheck && cb.checked) {
                    checkboxes.forEach(otherCb => {
                        if (otherCb !== cb) {
                            otherCb.checked = false;
                            setOptionDisabled(otherCb, true);
                        }
                    });
                    updateNote();
                    container.dispatchEvent(new Event("change"));
                    return;
                }

                if (noOptionsCheck && cb === noOptionsCheck && !cb.checked) {
                    checkboxes.forEach(otherCb => setOptionDisabled(otherCb, false));
                    updateNote();
                    return;
                }

                const checkedCount = checkboxes.filter(c => c.checked).length;
                if (checkedCount >= limitNumber) {
                    checkboxes.forEach(otherCb => {
                        if (!otherCb.checked) setOptionDisabled(otherCb, true);
                    });
                } else {
                    checkboxes.forEach(otherCb => {
                        if (!noOptionsCheck || !noOptionsCheck.checked) setOptionDisabled(otherCb, false);
                    });
                }

                updateNote();
            });
        });

        updateNote();
    };

    configureLimit("p2-checkboxes", 3);
    configureLimit("p3-checkboxes", 3);
    configureLimit("p6-checkboxes", 3);
}

function setupLikertScales() {
    document.querySelectorAll(".quiz-scale-options").forEach(scale => {
        if (scale.nextElementSibling && scale.nextElementSibling.classList.contains("quiz-scale-labels")) return;

        const labels = document.createElement("div");
        labels.className = "quiz-scale-labels";
        labels.innerHTML = "<span>1 = desacuerdo</span><span>5 = acuerdo</span>";
        scale.insertAdjacentElement("afterend", labels);
    });
}

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

function setupImageLightbox() {
    const lightbox = document.getElementById("image-lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const closeButton = lightbox ? lightbox.querySelector(".lightbox-close") : null;
    const galleryItems = document.querySelectorAll("[data-lightbox-src]");

    if (!lightbox || !lightboxImage || !closeButton || galleryItems.length === 0) return;

    const openLightbox = (src, alt) => {
        lightboxImage.src = src;
        lightboxImage.alt = alt;
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        closeButton.focus();
    };

    const closeLightbox = () => {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        lightboxImage.src = "";
        lightboxImage.alt = "";
        document.body.style.overflow = "";
    };

    galleryItems.forEach(item => {
        item.addEventListener("click", () => {
            openLightbox(item.dataset.lightboxSrc, item.dataset.lightboxAlt || "");
        });
    });

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
            closeLightbox();
        }
    });
}

function gatherSurveyData() {
    const data = {};

    const p1 = document.querySelector('input[name="p1_frecuencia"]:checked');
    data.p1_frecuencia = p1 ? p1.value : "";

    const p1b = document.querySelector('input[name="p1b_razon_no_consumo"]:checked');
    if (p1b) {
        data.p1b_razon_no_consumo = p1b.value === "Otro"
            ? `Otro: ${document.getElementById("p1b_razon_no_consumo_otro").value}`
            : p1b.value;
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
        data.p7_duda_freno = p7.value === "Otro"
            ? `Otro: ${document.getElementById("p7_duda_freno_otro").value}`
            : p7.value;
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
