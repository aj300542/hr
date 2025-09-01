
const ctx = canvas.getContext("2d");
let elements = [];
let dragging = false;
let dragIndex = null;
let selectedIndex = null;
let offsetX = 0, offsetY = 0;
let selectionBox = null;
let selectedIndices = [];


// 初始化 canvas 尺寸
function resizeCanvas() {
    const canvas = document.getElementById("iconCanvas");
    const badge = document.querySelector(".badge");

    canvas.width = badge.offsetWidth;
    canvas.height = badge.offsetHeight;

    drawAll(); // 重新绘制图层
}

window.addEventListener("load", resizeCanvas);
window.addEventListener("resize", resizeCanvas);



// Emoji 提取函数
function extractIcons(text) {
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u26FF\uFE0F]/g;
    const matches = text.match(emojiRegex) || [];
    return matches.filter(char => typeof char === "string" && char.trim() !== "");
}


// 添加图标到元素数组
function addIcons(icons) {
    icons.forEach((icon, i) => {
        if (typeof icon !== "string" || icon.trim() === "") {
            console.warn("跳过非法图标:", icon);
            return;
        }

        elements.push({
            char: icon,
            x: 60 + (elements.length + i) * 70,
            y: canvas.height / 2,
            size: 200,
            rotation: 0
        });
    });

    setScene([...elements]);
}
window.addEventListener("DOMContentLoaded", () => {
    const badge = document.querySelector(".badge");

    // 阻止 badge 区域触发 photo-frame 的 input 行为
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        badge.addEventListener(eventName, e => {
            // 如果拖拽目标是 photo-frame，则不阻止
            const isPhotoFrame = e.target.closest("#frame");
            if (!isPhotoFrame) {
                e.preventDefault();
            }
        });
    });
});



canvas.addEventListener("dragover", e => {
    e.preventDefault(); // 允许放置
    canvas.style.cursor = "copy";
});

canvas.addEventListener("dragleave", () => {
    canvas.style.cursor = "default";
});

canvas.addEventListener("drop", e => {
    const frameRect = frame.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    const dropX = e.clientX;
    const dropY = e.clientY;

    // ✅ 如果拖拽发生在头像区域或 badge 区域，跳过 canvas 图层处理
    const inFrame =
        dropX >= frameRect.left &&
        dropX <= frameRect.right &&
        dropY >= frameRect.top &&
        dropY <= frameRect.bottom;

    const inBadge =
        dropX >= badgeRect.left &&
        dropX <= badgeRect.right &&
        dropY >= badgeRect.top &&
        dropY <= badgeRect.bottom;

    if (inFrame || inBadge) {
        e.preventDefault();
        return;
    }

    // ✅ 正常图层添加逻辑（仅处理 canvas 区域拖拽）
    e.preventDefault();
    canvas.style.cursor = "default";

    const files = e.dataTransfer.files;
    const imageFile = [...files].find(file => file.type.startsWith("image/"));
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                const x = e.offsetX;
                const y = e.offsetY;

                elements.push({
                    type: "image",
                    img,
                    x,
                    y,
                    size: Math.max(img.width, img.height),
                    width: img.width,
                    height: img.height,
                    rotation: 0
                });

                drawAll();
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(imageFile);
    }
});



// 绘制所有图标（支持旋转）
function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ✅ 绘制选择框（背景层）
    if (selectionBox) {
        const x = Math.min(selectionBox.startX, selectionBox.endX);
        const y = Math.min(selectionBox.startY, selectionBox.endY);
        const w = Math.abs(selectionBox.startX - selectionBox.endX);
        const h = Math.abs(selectionBox.startY - selectionBox.endY);

        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "blue";
        ctx.fillRect(x, y, w, h);
        ctx.restore();

        ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
    }
    elements.forEach((el, i) => {
        if (el.type === "group") {
            ctx.save();

            // ✅ 将群组中心作为旋转中心（兼容摇摆动画）
            const centerX = el.x;
            const centerY = el.y;
            // 🎯 先平移到中心
            ctx.translate(centerX, centerY);

            // 🔄 缩放和旋转都在中心坐标系内进行
            ctx.scale(el.size || 1, el.size || 1);
            ctx.rotate((el.rotationBase || 0) + (el.rotationSwing || 0));

            // ↩️ 再平移回原始坐标系
            ctx.translate(-centerX, -centerY);

            // ✅ 绘制子元素
            el.children.forEach((child, j) => {
                if (child.type === "image" && child.img) {
                    drawImageWithContext(child, el.x + child.x, el.y + child.y, selectedIndices.includes(i));
                } else {
                    drawEmojiWithContext(child, el.x + child.x, el.y + child.y, selectedIndices.includes(i));
                }
            });


            ctx.restore();
        } else if (el.type === "image" && el.img) {
            drawImageWithContext(
                el,
                el.x,
                el.y,
                selectedIndices.includes(i) || selectedIndex === i || dragIndex === i
            );
        } else {
            drawEmojiWithContext(
                el,
                el.x,
                el.y,
                selectedIndices.includes(i) || selectedIndex === i || dragIndex === i
            );
        }

    });

}
function drawImageWithContext(el, finalX, finalY, isSelected) {
    const rotation = (el.rotationBase || 0) + (el.rotationSwing || 0) + (el.rotation || 0);
    const scaleX = (el.isFlipped ? -1 : 1);
    const scaleY = 1;

    const baseW = el.width || 100;
    const baseH = el.height || 100;
    const scale = el.size ? el.size / Math.max(baseW, baseH) : 1;

    const width = baseW * scale;
    const height = baseH * scale;

    ctx.save();
    ctx.translate(finalX, finalY);
    ctx.scale(scaleX, scaleY);
    ctx.rotate(rotation);

    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 4;
    ctx.drawImage(el.img, -width / 2, -height / 2, width, height);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    if (isSelected) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        const padding = 4;
        ctx.strokeRect(-width / 2 - padding, -height / 2 - padding, width + padding * 2, height + padding * 2);
    }

    ctx.restore();
}


function drawEmojiWithContext(el, finalX, finalY, isSelected) {
    const rotation = (el.rotationBase || 0) + (el.rotationSwing || 0) + (el.rotation || 0);
    const scaleX = (el.isFlipped ? -1 : 1) * (el.scale || 1);
    const scaleY = el.scale || 1;

    ctx.save();
    ctx.translate(finalX, finalY);
    ctx.scale(scaleX, scaleY);
    ctx.rotate(rotation);

    ctx.font = `${el.size}px "SegoeEmojiOld", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 4;
    ctx.fillText(el.char, 0, 0);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    if (isSelected) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        const padding = 4;
        ctx.strokeRect(-el.size / 2 - padding, -el.size / 2 - padding, el.size + padding * 2, el.size + padding * 2);
    }

    ctx.restore();
}

document.getElementById("sendToBackBtn").addEventListener("click", () => {
    if (selectedIndex !== null && selectedIndex >= 0) {
        const [selected] = elements.splice(selectedIndex, 1);
        elements.unshift(selected); // 插入数组开头（底层）
        selectedIndex = 0;
        drawAll();
    }
});
let isFrameOnTop = true; // 初始状态：头像在上层

document.getElementById("bringToFrontBtn").addEventListener("click", () => {
    const frame = document.getElementById("frame");

    if (isFrameOnTop) {
        frame.style.zIndex = "0"; // ✅ 让头像沉到底层
    } else {
        frame.style.zIndex = "3"; // ✅ 让头像浮到上层
    }

    isFrameOnTop = !isFrameOnTop; // ✅ 切换状态
});



// 粘贴剪贴板 emoji
document.getElementById("pasteBtn").addEventListener("click", async () => {
    if (window._isPasting) return;
    window._isPasting = true;

    if (!navigator.clipboard) {
        console.warn("剪贴板 API 不可用");
        window._isPasting = false;
        return;
    }

    try {
        const text = await navigator.clipboard.readText();
        const icons = extractIcons(text);

        if (icons.length === 0) {
            console.log("剪贴板中未检测到 emoji");
            window._isPasting = false;
            return;
        }

        // 添加到画布中央
        const canvas = document.getElementById("iconCanvas");
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        icons.forEach((emoji, i) => {
            elements.push({
                char: emoji,
                x: centerX + i * 80, // 多个 emoji 横向排列
                y: centerY,
                size: 200,
                rotation: 0
            });
        });

        drawAll();
    } catch (err) {
        console.warn("剪贴板读取失败:", err);
        // 不弹窗，静默处理
    } finally {
        window._isPasting = false;
    }
});
