let activePart = null;

const partVariants = {
    "head": 15,
    "body": 5,
    "right-arm": 8,
    "left-arm": 8,
    "legs": 8
};

function changePart(part, direction = 0, random = false) {
    let img = document.getElementById(part);
    let maxIndex = partVariants[part] || 1;
    let newIndex;
    
    if (random) {
        newIndex = Math.floor(Math.random() * maxIndex) + 1;
    } else {
        let currentIndex = parseInt(img.getAttribute('data-index')) || 1;
        newIndex = currentIndex + direction;
        if (newIndex < 1) newIndex = maxIndex;
        if (newIndex > maxIndex) newIndex = 1;
    }

    let formattedPart = part.replace('-', '_');
    let newSrc = `assets/${formattedPart}/${formattedPart}${newIndex}.svg`;

    let imgTest = new Image();
    imgTest.src = newSrc;
    imgTest.onload = function () {
        img.src = newSrc;
        img.setAttribute('data-index', newIndex);
    };
}

function randomizeMascot() {
    Object.keys(partVariants).forEach(part => {
        changePart(part, 0, true);
    });
}

window.onload = randomizeMascot;

document.querySelectorAll("img").forEach(img => {
    img.onload = () => img.classList.add("loaded");
});

function toggleLayer(part) {
    const element = document.getElementById(part);
    const currentZ = parseInt(window.getComputedStyle(element).zIndex, 10);
    const newZ = currentZ === -1 ? 0 : (currentZ === 0 ? 1 : -1);
    element.style.zIndex = newZ;
}

function toggleDragMode(part) {
    const checkbox = document.getElementById(`move-${part}`);
    const element = document.getElementById(part);
    let currentZ = window.getComputedStyle(element).zIndex;
    currentZ = isNaN(parseInt(currentZ)) ? 0 : parseInt(currentZ);

    if (currentZ === -1) {
        alert("Move the arm to a higher layer to manually adjust it.");
        checkbox.checked = false;
        return;
    }

    if (part === "left-arm") {
        document.getElementById("move-right-arm").checked = false;
    } else {
        document.getElementById("move-left-arm").checked = false;
    }

    activePart = element;
    document.querySelectorAll('.movable').forEach(img => {
        img.style.pointerEvents = (img === activePart) ? 'auto' : 'none';
    });
}

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.attributeName === "style") {
            const element = mutation.target;
            const currentZ = parseInt(window.getComputedStyle(element).zIndex, 10) || 0;
            const part = element.id;
            const checkbox = document.getElementById(`move-${part}`);

            if (currentZ === -1 && checkbox.checked) {
                alert(`You moved ${element.alt} to the lower layer. Movement disabled.`);
                checkbox.checked = false;
            }
        }
    });
});

document.querySelectorAll('.movable').forEach(element => {
    observer.observe(element, { attributes: true, attributeFilter: ["style"] });
});

document.querySelectorAll('.movable').forEach(img => {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    img.addEventListener('mousedown', (e) => {
        if (img !== activePart) return;
        e.preventDefault();
        isDragging = true;
        offsetX = e.clientX - img.offsetLeft;
        offsetY = e.clientY - img.offsetTop;
        img.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || img !== activePart) return;
        img.style.left = `${e.clientX - offsetX}px`;
        img.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        img.style.cursor = 'grab';
    });
});

function downloadMascot() {
    const container = document.getElementById("canvas-container");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const layers = Array.from(container.getElementsByClassName("layer")).sort((a, b) => {
        return (parseInt(window.getComputedStyle(a).zIndex) || 0) - (parseInt(window.getComputedStyle(b).zIndex) || 0);
    });

    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;

    layers.forEach(img => {
        const x = img.offsetLeft;
        const y = img.offsetTop;
        const width = img.clientWidth;
        const height = img.clientHeight;

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + width > maxX) maxX = x + width;
        if (y + height > maxY) maxY = y + height;
    });

    const mascotWidth = maxX - minX;
    const mascotHeight = maxY - minY;
    canvas.width = mascotWidth;
    canvas.height = mascotHeight;

    const imagePromises = layers.map(img => {
        return new Promise(resolve => {
            const image = new Image();
            image.src = img.src;
            image.crossOrigin = "anonymous";
            image.onload = () => resolve({ image, img });
        });
    });

    Promise.all(imagePromises).then(images => {
        images.forEach(({ image, img }) => {
            ctx.drawImage(image, img.offsetLeft - minX, img.offsetTop - minY, img.clientWidth, img.clientHeight);
        });
        saveCanvasAsImage(canvas);
    });
}

function saveCanvasAsImage(canvas) {
    const link = document.createElement("a");
    link.download = "mascot.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}
