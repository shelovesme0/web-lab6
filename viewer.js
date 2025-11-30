// viewer.js

(function () {
  "use strict";

  const wrapper = document.getElementById("viewer-carousel-wrapper");
  const statusEl = document.getElementById("viewer-status");

  let lastJson = null;
  let currentTimer = null;

  function createCarouselDOM(targetElement, data) {
    targetElement.innerHTML = "";

    if (!data || !data.slides || data.slides.length === 0) {
      const p = document.createElement("p");
      p.textContent = "На сервері поки немає збереженої каруселі.";
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

    if (currentTimer !== null) {
      clearInterval(currentTimer);
      currentTimer = null;
    }

    function startAuto() {
      if (currentTimer !== null) clearInterval(currentTimer);
      currentTimer = setInterval(() => {
        goTo(current + 1);
      }, intervalMs);
    }

    carousel.addEventListener("mouseenter", () => {
      if (currentTimer !== null) clearInterval(currentTimer);
    });

    carousel.addEventListener("mouseleave", () => {
      startAuto();
    });

    targetElement.appendChild(carousel);

    goTo(current);
    startAuto();
  }

  async function loadFromServer(updateOnly) {
    try {
      // Без headers – InfinityFree не любить зайві заголовки
      const resp = await fetch("carousel_load.php?ts=" + Date.now());
      const text = await resp.text();
      console.log("load response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        statusEl.textContent = "Сервер повернув не JSON: " + text;
        return;
      }

      const jsonStr = JSON.stringify(data);
      if (updateOnly && jsonStr === lastJson) {
        statusEl.textContent = "Перевірка змін: нових даних немає.";
        return;
      }

      lastJson = jsonStr;

      if (data.status === "error") {
        statusEl.textContent = "Помилка сервера: " + (data.message || "");
        wrapper.innerHTML = "";
        return;
      }

      statusEl.textContent =
        "Останнє оновлення: " + (data.savedAt || "невідомо") +
        ". Кількість слайдів: " + data.slides.length + ".";

      createCarouselDOM(wrapper, data);
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Не вдалося отримати дані з сервера: " + err.message;
    }
  }

  loadFromServer(false);

  const POLL_INTERVAL_MS = 5000;
  setInterval(() => {
    loadFromServer(true);
  }, POLL_INTERVAL_MS);
})();
