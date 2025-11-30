// builder.js

(function () {
  "use strict";

  const slides = [];
  let lastIntervalSec = 4;
  let startIndex = 0; // 0-based

  const titleInput = document.getElementById("slide-title");
  const imgInput = document.getElementById("slide-image");
  const descInput = document.getElementById("slide-description");
  const intervalInput = document.getElementById("slide-interval");
  const startIndexInput = document.getElementById("slide-start-index");

  const btnAdd = document.getElementById("btn-add-slide");
  const btnClear = document.getElementById("btn-clear-slides");
  const btnSave = document.getElementById("btn-save-carousel");

  const slideList = document.getElementById("slide-list");
  const previewWrapper = document.getElementById("builder-preview");
  const statusEl = document.getElementById("builder-status");

  function renderSlideList() {
    slideList.innerHTML = "";
    slides.forEach((s, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${s.title || "(без назви)"}  [${s.image || "без зображення"}]`;
      slideList.appendChild(li);
    });

    if (slides.length > 0) {
      startIndexInput.max = String(slides.length);
      if (+startIndexInput.value < 1) {
        startIndexInput.value = "1";
      }
    }
  }

  function createCarouselDOM(targetElement, data) {
    targetElement.innerHTML = "";

    if (!data || !data.slides || data.slides.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Немає жодного слайду для відображення.";
      targetElement.appendChild(p);
      return;
    }

    const slidesArr = data.slides;
    const intervalMs = Math.max(1000, (data.intervalSec || 4) * 1000);
    let current = data.startIndex || 0;

    const carousel = document.createElement("div");
    carousel.className = "carousel";

    const track = document.createElement("div");
    track.className = "carousel-track";
    carousel.appendChild(track);

    slidesArr.forEach((slide) => {
      const slideDiv = document.createElement("div");
      slideDiv.className = "carousel-slide";

      if (slide.image) {
        const img = document.createElement("img");
        img.src = slide.image;
        img.alt = slide.title || "";
        slideDiv.appendChild(img);
      }

      if (slide.title || slide.description) {
        const caption = document.createElement("div");
        caption.className = "carousel-caption";

        if (slide.title) {
          const h4 = document.createElement("h4");
          h4.textContent = slide.title;
          caption.appendChild(h4);
        }

        if (slide.description) {
          const p = document.createElement("p");
          p.textContent = slide.description;
          caption.appendChild(p);
        }

        slideDiv.appendChild(caption);
      }

      track.appendChild(slideDiv);
    });

    const btnPrev = document.createElement("button");
    btnPrev.className = "carousel-control prev";
    btnPrev.type = "button";
    btnPrev.textContent = "‹";

    const btnNext = document.createElement("button");
    btnNext.className = "carousel-control next";
    btnNext.type = "button";
    btnNext.textContent = "›";

    carousel.appendChild(btnPrev);
    carousel.appendChild(btnNext);

    const indicators = document.createElement("div");
    indicators.className = "carousel-indicators";

    const dots = slidesArr.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.addEventListener("click", () => goTo(index));
      indicators.appendChild(dot);
      return dot;
    });

    carousel.appendChild(indicators);

    function update() {
      const offset = -current * 100;
      track.style.transform = `translateX(${offset}%)`;
      dots.forEach((d, i) => {
        d.classList.toggle("active", i === current);
      });
    }

    function goTo(index) {
      if (index < 0) index = slidesArr.length - 1;
      if (index >= slidesArr.length) index = 0;
      current = index;
      update();
    }

    btnPrev.addEventListener("click", () => goTo(current - 1));
    btnNext.addEventListener("click", () => goTo(current + 1));

    let timerId = null;
    function startAuto() {
      if (timerId !== null) clearInterval(timerId);
      timerId = setInterval(() => {
        goTo(current + 1);
      }, intervalMs);
    }

    carousel.addEventListener("mouseenter", () => {
      if (timerId !== null) clearInterval(timerId);
    });

    carousel.addEventListener("mouseleave", () => {
      startAuto();
    });

    targetElement.appendChild(carousel);

    goTo(current);
    startAuto();
  }

  function renderPreview() {
    const data = {
      slides: slides.slice(),
      intervalSec: lastIntervalSec,
      startIndex: startIndex
    };
    createCarouselDOM(previewWrapper, data);
  }

  btnAdd.addEventListener("click", () => {
    const title = (titleInput.value || "").trim();
    const image = (imgInput.value || "").trim();
    const desc = (descInput.value || "").trim();

    if (!title && !image && !desc) {
      alert("Заповніть хоча б один параметр слайду.");
      return;
    }

    const slide = { title, image, description: desc };
    slides.push(slide);

    lastIntervalSec = Math.max(1, parseInt(intervalInput.value, 10) || 4);
    startIndex = Math.max(0, (parseInt(startIndexInput.value, 10) || 1) - 1);

    renderSlideList();
    renderPreview();

    titleInput.value = "";
    descInput.value = "";
  });

  btnClear.addEventListener("click", () => {
    if (!confirm("Очистити всі слайди?")) return;
    slides.length = 0;
    renderSlideList();
    renderPreview();
  });

  btnSave.addEventListener("click", async () => {
    if (slides.length === 0) {
      alert("Спочатку додай хоча б один слайд.");
      return;
    }

    lastIntervalSec = Math.max(1, parseInt(intervalInput.value, 10) || 4);
    startIndex = Math.max(0, (parseInt(startIndexInput.value, 10) || 1) - 1);

    const payload = {
      slides: slides,
      intervalSec: lastIntervalSec,
      startIndex: startIndex
    };

    statusEl.textContent = "Збереження каруселі на сервері...";

    try {
      // ВАЖЛИВО ДЛЯ INFINITYFREE: без Content-Type, через FormData
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));

      const resp = await fetch("carousel_save.php", {
        method: "POST",
        body: formData
      });

      const text = await resp.text();
      console.log("Відповідь сервера:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        statusEl.textContent = "Сервер повернув не JSON: " + text;
        return;
      }

      if (data.status === "ok") {
        statusEl.textContent = "Карусель успішно збережена: " + (data.savedAt || "");
      } else {
        statusEl.textContent = "Помилка збереження: " + (data.message || "невідома.");
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Не вдалося звернутися до сервера: " + err.message;
    }
  });

  renderPreview();
})();
