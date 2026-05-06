(function () {
    const cursor = document.getElementById("cursor");
    const pixelCanvas = document.getElementById("pixel-matrix");
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function initCursor() {
        if (!cursor || !hasFinePointer) {
            return;
        }

        document.addEventListener("mousemove", (event) => {
            cursor.style.left = event.clientX + "px";
            cursor.style.top = event.clientY + "px";
        });

        const interactables = document.querySelectorAll("a, button, .hover\\:text-brand, .index-row-link");

        interactables.forEach((element) => {
            element.addEventListener("mouseenter", () => {
                cursor.style.transform = "translate(-50%, -50%) scale(2.5)";

                if (element.classList.contains("index-row-link")) {
                    cursor.style.backgroundColor = "#ffffff";
                    cursor.style.mixBlendMode = "difference";
                }
            });

            element.addEventListener("mouseleave", () => {
                cursor.style.transform = "translate(-50%, -50%) scale(1)";
                cursor.style.backgroundColor = "#0000ff";
                cursor.style.mixBlendMode = "normal";
            });
        });
    }

    function initPixelMatrix() {
        if (!pixelCanvas) {
            return;
        }

        const context = pixelCanvas.getContext("2d");

        if (!context) {
            return;
        }

        const resolution = 64;
        let columns = 0;
        let rows = 0;
        let grid = [];
        let mouseX = -1;
        let mouseY = -1;
        let isDrawing = false;

        function initCanvas() {
            const parent = pixelCanvas.parentElement;
            const parentWidth = Math.max(parent.clientWidth, 1);
            const parentHeight = Math.max(parent.clientHeight, 1);
            const aspect = parentHeight / parentWidth;

            pixelCanvas.style.width = "100%";
            pixelCanvas.style.height = "100%";
            pixelCanvas.width = resolution;
            pixelCanvas.height = Math.max(1, Math.floor(resolution * aspect));

            columns = pixelCanvas.width;
            rows = pixelCanvas.height;
            grid = new Array(columns).fill(0).map(() => new Array(rows).fill(0));
        }

        function updatePointerPosition(event) {
            const rect = pixelCanvas.getBoundingClientRect();
            const scaleX = pixelCanvas.width / rect.width;
            const scaleY = pixelCanvas.height / rect.height;

            mouseX = Math.floor((event.clientX - rect.left) * scaleX);
            mouseY = Math.floor((event.clientY - rect.top) * scaleY);
            isDrawing = true;
        }

        function drawBrush() {
            if (!isDrawing || mouseX < 0 || mouseX >= columns || mouseY < 0 || mouseY >= rows) {
                return;
            }

            const brushWidth = 3;
            const brushHeight = 3;

            for (let x = -brushWidth; x <= brushWidth; x += 1) {
                for (let y = -brushHeight; y <= brushHeight; y += 1) {
                    const cellX = mouseX + x;
                    const cellY = mouseY + y;
                    const isInsideBrush = x * x + y * y <= brushWidth * brushHeight;

                    if (isInsideBrush && cellX >= 0 && cellX < columns && cellY >= 0 && cellY < rows && Math.random() > 0.1) {
                        grid[cellX][cellY] = 255;
                    }
                }
            }
        }

        function animate() {
            context.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);

            drawBrush();

            for (let x = 0; x < columns; x += 1) {
                for (let y = 0; y < rows; y += 1) {
                    if (grid[x][y] > 0) {
                        const alpha = grid[x][y] / 255;
                        context.fillStyle = "rgba(0, 0, 255, " + alpha + ")";
                        context.fillRect(x, y, 1, 1);

                        grid[x][y] -= Math.random() * 12;

                        if (grid[x][y] < 0) {
                            grid[x][y] = 0;
                        }
                    }
                }
            }

            window.requestAnimationFrame(animate);
        }

        window.addEventListener("resize", initCanvas);
        pixelCanvas.addEventListener("pointermove", updatePointerPosition);
        pixelCanvas.addEventListener("pointerleave", () => {
            isDrawing = false;
        });

        initCanvas();
        animate();
    }

    function initProjectPanels() {
        const toggles = document.querySelectorAll("[data-project-toggle]");
        const closeDelay = 430;
        const descriptionAnimations = new WeakMap();
        const scrambleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]{}<>/_-+=*#";

        function getDescription(detail) {
            const description = detail.querySelector(".project-description-reveal");

            if (!description) {
                return null;
            }

            if (!description.dataset.finalText) {
                description.dataset.finalText = description.textContent.trim().replace(/\s+/g, " ");
            }

            return description;
        }

        function stopDescriptionAnimation(description) {
            const frameId = descriptionAnimations.get(description);

            if (frameId) {
                window.cancelAnimationFrame(frameId);
                descriptionAnimations.delete(description);
            }
        }

        function resetDescription(detail) {
            const description = getDescription(detail);

            if (!description) {
                return;
            }

            stopDescriptionAnimation(description);
            description.classList.remove("is-scrambling");
            description.textContent = description.dataset.finalText;
        }

        function scrambleDescription(detail) {
            const description = getDescription(detail);

            if (!description) {
                return;
            }

            const finalText = description.dataset.finalText;

            stopDescriptionAnimation(description);

            if (prefersReducedMotion.matches) {
                description.textContent = finalText;
                return;
            }

            const startedAt = performance.now();
            const duration = 520;
            const bootPhase = 0.32;
            const bootPrefix = "> PROJECT_BRIEF::READ ";

            description.classList.add("is-scrambling");

            function getNoiseCharacter(character) {
                if (character === " " || /[.,:;-]/.test(character)) {
                    return character;
                }

                return scrambleCharacters[Math.floor(Math.random() * scrambleCharacters.length)];
            }

            function drawFrame(timestamp) {
                const progress = Math.min((timestamp - startedAt) / duration, 1);
                const resolveProgress = Math.max((progress - bootPhase) / (1 - bootPhase), 0);
                const easedProgress = 1 - Math.pow(1 - resolveProgress, 3);

                description.textContent = Array.from(finalText, (character, index) => {
                    if (progress < bootPhase) {
                        return bootPrefix[index] || getNoiseCharacter(character);
                    }

                    if (character === " ") {
                        return character;
                    }

                    const revealThreshold = ((index * 37) % finalText.length) / finalText.length;

                    if (easedProgress >= revealThreshold) {
                        return character;
                    }

                    return getNoiseCharacter(character);
                }).join("");

                if (progress < 1) {
                    const frameId = window.requestAnimationFrame(drawFrame);
                    descriptionAnimations.set(description, frameId);
                    return;
                }

                description.textContent = finalText;
                description.classList.remove("is-scrambling");
                descriptionAnimations.delete(description);
            }

            const frameId = window.requestAnimationFrame(drawFrame);
            descriptionAnimations.set(description, frameId);
        }

        function openPanel(toggle, panel, detail) {
            window.clearTimeout(Number(detail.dataset.closeTimer || 0));
            detail.hidden = false;
            resetDescription(detail);
            toggle.setAttribute("aria-expanded", "true");
            detail.setAttribute("aria-hidden", "false");
            detail.style.setProperty("--project-detail-height", detail.scrollHeight + "px");

            window.requestAnimationFrame(() => {
                panel.classList.add("is-open");
                window.setTimeout(() => {
                    scrambleDescription(detail);
                }, 80);
            });
        }

        function closePanel(toggle, panel, detail) {
            window.clearTimeout(Number(detail.dataset.closeTimer || 0));
            resetDescription(detail);
            toggle.setAttribute("aria-expanded", "false");
            detail.setAttribute("aria-hidden", "true");
            detail.style.setProperty("--project-detail-height", detail.scrollHeight + "px");
            panel.classList.remove("is-open");

            const timer = window.setTimeout(() => {
                if (toggle.getAttribute("aria-expanded") === "false") {
                    detail.hidden = true;
                    detail.style.removeProperty("--project-detail-height");
                }
            }, closeDelay);

            detail.dataset.closeTimer = String(timer);
        }

        toggles.forEach((toggle) => {
            toggle.addEventListener("click", () => {
                const panel = toggle.closest(".project-panel");
                const detailId = toggle.getAttribute("aria-controls");
                const detail = detailId ? document.getElementById(detailId) : null;

                if (!panel || !detail) {
                    return;
                }

                const willOpen = toggle.getAttribute("aria-expanded") !== "true";

                toggles.forEach((otherToggle) => {
                    if (otherToggle === toggle) {
                        return;
                    }

                    const otherPanel = otherToggle.closest(".project-panel");
                    const otherDetailId = otherToggle.getAttribute("aria-controls");
                    const otherDetail = otherDetailId ? document.getElementById(otherDetailId) : null;

                    if (otherPanel && otherDetail && otherToggle.getAttribute("aria-expanded") === "true") {
                        closePanel(otherToggle, otherPanel, otherDetail);
                    }
                });

                if (willOpen) {
                    openPanel(toggle, panel, detail);
                    return;
                }

                closePanel(toggle, panel, detail);
            });
        });
    }

    initCursor();
    initPixelMatrix();
    initProjectPanels();
})();
