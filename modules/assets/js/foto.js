// Função auxiliar para converter dataURL em Blob (caso necessário)
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function getFilteredImageBlob() {
  return new Promise((resolve, reject) => {
    const file = fileInput.files[0];
    if (!file) {
      return reject(new Error("Nenhuma imagem carregada."));
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const originalImage = new Image();
      originalImage.onload = () => {
        const brightness = parseFloat(brightnessSlider.value);
        const saturation = parseFloat(saturationSlider.value);
        const contrast = parseFloat(contrastSlider.value);

        const brightnessVal = (brightness - 100) / 100;
        const contrastVal = (contrast - 100) / 100;
        const saturationVal = (saturation - 100) / 100;

        let glfxCanvas;
        try {
          glfxCanvas = fx.canvas();
        } catch (e) {
          return reject(new Error("glfx.js não é suportado neste navegador: " + e.message));
        }

        const texture = glfxCanvas.texture(originalImage);
        glfxCanvas.draw(texture).brightnessContrast(brightnessVal, contrastVal).hueSaturation(0, saturationVal).update();

        glfxCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Erro ao converter imagem para blob"));
          },
          "image/jpeg", // agora é JPEG
          0.05 // 90% de qualidade
        );
      };

      originalImage.onerror = () => reject(new Error("Erro ao carregar a imagem original"));
      originalImage.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Erro ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

// Configuração dos eventos de drag & drop e sliders

const dropContainer = document.getElementById("image-upload-container");
const fileInput = dropContainer.querySelector('input[type="file"]');
const imgPreview = document.getElementById("img-preview");

// Sliders e spans (removido o slider de hue)
const brightnessSlider = document.getElementById("brightness-range");
const saturationSlider = document.getElementById("saturation-range");
const contrastSlider = document.getElementById("contrast-range");

const brightnessValue = document.getElementById("brightness-value");
const saturationValue = document.getElementById("saturation-value");
const contrastValue = document.getElementById("contrast-value");

// Botões de reset (removido o botão de hue)
const resetBrightnessBtn = document.getElementById("reset-brightness");
const resetSaturationBtn = document.getElementById("reset-saturation");
const resetContrastBtn = document.getElementById("reset-contrast");
const resetAllBtn = document.getElementById("reset-all");

function updateImageStyle() {
  const brightness = brightnessSlider.value;
  const saturation = saturationSlider.value;
  const contrast = contrastSlider.value;
  brightnessValue.textContent = brightness;
  saturationValue.textContent = saturation;
  contrastValue.textContent = contrast;
  // Aplica filtro via CSS sem o hue-rotate
  imgPreview.style.filter = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;
}

function resetBrightness() {
  brightnessSlider.value = 100;
  updateImageStyle();
}
function resetSaturation() {
  saturationSlider.value = 100;
  updateImageStyle();
}
function resetContrast() {
  contrastSlider.value = 100;
  updateImageStyle();
}
function resetAllFilters() {
  brightnessSlider.value = 100;
  saturationSlider.value = 100;
  contrastSlider.value = 100;
  updateImageStyle();
}

brightnessSlider.addEventListener("input", updateImageStyle);
saturationSlider.addEventListener("input", updateImageStyle);
contrastSlider.addEventListener("input", updateImageStyle);

resetBrightnessBtn.addEventListener("click", resetBrightness);
resetSaturationBtn.addEventListener("click", resetSaturation);
resetContrastBtn.addEventListener("click", resetContrast);
resetAllBtn.addEventListener("click", resetAllFilters);

function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Por favor, selecione um arquivo de imagem.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    imgPreview.src = e.target.result;
    imgPreview.style.display = "block";
    resetAllFilters();
  };
  reader.readAsDataURL(file);
}

dropContainer.addEventListener("click", function () {
  fileInput.click();
});

fileInput.addEventListener("change", function () {
  if (this.files && this.files[0]) {
    handleFile(this.files[0]);
  }
});

dropContainer.addEventListener("dragover", function (e) {
  e.preventDefault();
  dropContainer.classList.add("drag-over");
});
dropContainer.addEventListener("dragleave", function (e) {
  e.preventDefault();
  dropContainer.classList.remove("drag-over");
});
dropContainer.addEventListener("drop", function (e) {
  e.preventDefault();
  dropContainer.classList.remove("drag-over");
  const files = e.dataTransfer.files;
  if (files.length) {
    fileInput.files = files;
    handleFile(files[0]);
  }
});
