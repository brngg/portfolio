(function () {
    const footerYear = document.getElementById("footer-year");
    const progressBar = document.getElementById("scroll-progress");
    const revealItems = document.querySelectorAll(".reveal");
    const canvas = document.getElementById("wave-background");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    function updateScrollProgress() {
        if (!progressBar) {
            return;
        }

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = progress + "%";
    }

    if (revealItems.length && typeof IntersectionObserver === "function") {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: "0px 0px -10% 0px",
                threshold: 0.12
            }
        );

        revealItems.forEach((item) => observer.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    let animationFrameId = null;
    let canvasResizeHandler = null;

    function startCanvasAnimation() {
        if (!canvas || prefersReducedMotion.matches) {
            if (canvas) {
                canvas.style.display = "none";
            }
            return;
        }

        if (animationFrameId !== null) {
            return;
        }

        const context = canvas.getContext("2d");
        const characters = ["0", "1", "{", "}", "[", "]", ";", "=", ">", "<", "/", "*", "+", "!", "?", "&"];
        let width = 0;
        let height = 0;
        let columns = 0;
        let rows = 0;
        let tick = 0;
        let fontSize = 11;

        function resizeCanvas() {
            const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            fontSize = width < 640 ? 12 : 11;
            columns = Math.ceil(width / fontSize);
            rows = Math.ceil(height / fontSize);

            canvas.width = Math.floor(width * devicePixelRatio);
            canvas.height = Math.floor(height * devicePixelRatio);
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
            context.font = fontSize + 'px "IBM Plex Mono", monospace';
            context.textBaseline = "top";
        }

        function drawFrame() {
            context.clearRect(0, 0, width, height);
            tick += 0.012;
            context.fillStyle = "#120a8f";

            for (let x = 0; x < columns; x += 1) {
                const xPos = x * fontSize;
                const waveA =
                    height * 0.34 +
                    Math.sin(x * 0.042 + tick) * (height / 5.4) +
                    Math.sin(x * 0.09 - tick * 0.55) * (height / 18);
                const waveB =
                    height * 0.72 +
                    Math.sin(x * 0.035 - tick * 0.85) * (height / 4.3) +
                    Math.cos(x * 0.08 + tick * 1.1) * (height / 15);

                for (let y = 0; y < rows; y += 1) {
                    const yPos = y * fontSize;
                    const distanceA = Math.abs(yPos - waveA);
                    const distanceB = Math.abs(yPos - waveB);
                    const threshold = 180;
                    const opacityA = Math.max(0, 1 - distanceA / threshold);
                    const opacityB = Math.max(0, 1 - distanceB / threshold);
                    let opacity = opacityA + opacityB;

                    if (opacity <= 0.04) {
                        continue;
                    }

                    const texture = (Math.sin(xPos * 0.008 + yPos * 0.012 + tick * 2) + 1) / 2;
                    opacity *= 0.18 + texture * 0.52;

                    if (opacity <= 0.03) {
                        continue;
                    }

                    const characterIndex = Math.abs(
                        Math.floor((x * 17 + y * 13 + tick * 70) % characters.length)
                    );
                    context.globalAlpha = Math.min(0.22, opacity * 0.18);
                    context.fillText(characters[characterIndex], xPos, yPos);
                }
            }

            context.globalAlpha = 1;
            animationFrameId = window.requestAnimationFrame(drawFrame);
        }

        resizeCanvas();
        drawFrame();
        canvasResizeHandler = resizeCanvas;
        window.addEventListener("resize", canvasResizeHandler);
    }

    function handleMotionPreferenceChange(event) {
        if (!canvas) {
            return;
        }

        if (event.matches) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            if (canvasResizeHandler) {
                window.removeEventListener("resize", canvasResizeHandler);
                canvasResizeHandler = null;
            }
            canvas.style.display = "none";
            return;
        }

        canvas.style.display = "";
        startCanvasAnimation();
    }

    updateScrollProgress();
    startCanvasAnimation();

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    if (typeof prefersReducedMotion.addEventListener === "function") {
        prefersReducedMotion.addEventListener("change", handleMotionPreferenceChange);
    }
})();
