function previewPhoto(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = evt => {
            preview.src = evt.target.result;
            preview.style.display = "block";
            if (prompt) prompt.style.display = "none";
        };
        reader.readAsDataURL(file);
    }
}


function downloadBadge() {
    const container = document.getElementById("badgeContainer");
    const info = document.querySelector(".info");

    // ✅ 临时启用 pointer-events，确保 html2canvas 能捕捉文字
    const originalPointer = info?.style.pointerEvents;
    if (info) info.style.pointerEvents = "auto";

    // ✅ 使用视口单位计算徽章尺寸
    const vh = window.innerHeight / 100;
    const badgeWidth = 30 * vh;
    const badgeHeight = 46 * vh;
    const aspectRatio = badgeHeight / badgeWidth || 1;

    html2canvas(container, {
        scale: 4, // ✅ 提高渲染精度，缓解 emoji 模糊（可调为 2~4）
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false
    }).then(canvas => {
        if (info) info.style.pointerEvents = originalPointer;

        // ✅ 创建中间 canvas（530px 宽）
        const resizedCanvas = document.createElement("canvas");
        resizedCanvas.width = 530;
        resizedCanvas.height = Math.round(530 * aspectRatio);

        const ctx = resizedCanvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, resizedCanvas.width, resizedCanvas.height);
        ctx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

        // ✅ 创建最终裁切 canvas（480×800）
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = 480;
        finalCanvas.height = 800;

        const finalCtx = finalCanvas.getContext("2d");
        finalCtx.fillStyle = "#ffffff";
        finalCtx.fillRect(0, 0, 480, 800);

        // ✅ 居中绘制 resizedCanvas 到 finalCanvas
        const offsetX = (480 - resizedCanvas.width) / 2;
        const offsetY = (800 - resizedCanvas.height) / 2;
        finalCtx.drawImage(resizedCanvas, offsetX, offsetY);

        // ✅ 下载为 PNG（更清晰，避免 JPEG 压缩模糊）
        const link = document.createElement("a");
        link.download = "badge.png";
        link.href = finalCanvas.toDataURL("image/png");
        link.click();
    }).catch(err => {
        console.error("导出失败：", err);
        alert("导出失败，请检查元素是否存在或图片是否跨域");
    });
}
function updateInfo() {
    const defaultName = document.querySelector(".line.name").textContent || "小天才二号";
    const defaultId = document.querySelector(".line.id").textContent.replace("编号：", "") || "88888";
    const defaultDept = document.querySelector(".line.dept").textContent || "研究部 / 实验物品";

    const name = window.prompt("请输入姓名：", defaultName) || defaultName;
    const id = window.prompt("请输入编号：", defaultId) || defaultId;
    const dept = window.prompt("请输入部门：", defaultDept) || defaultDept;


    document.querySelector(".line.name").textContent = name;
    document.querySelector(".line.id").textContent = id;
    document.querySelector(".line.dept").textContent = dept;
}
function fillFunnyInfo() {
    fetch("json/hr.json")
        .then(res => res.json())
        .then(data => {
            const maxImageIndex = 37; // 最大图片编号
            const randomIndex = Math.floor(Math.random() * data.length);
            const random = data[randomIndex];

            // 如果数据条目超过图片数量，限制图片索引在 0–37 范围内
            const imageIndex = randomIndex % (maxImageIndex + 1);
            const imgPath = `img/img_${imageIndex.toString().padStart(3, '0')}.jpg`;

            // 更新文字信息
            document.getElementById("displayName").textContent = random.name;
            document.getElementById("displayId").textContent = random.id;
            document.getElementById("displayDept").textContent = random.dept;

            // 更新头像图片
            const imgElement = document.getElementById("preview");
            const promptSpan = document.getElementById("uploadPrompt");

            imgElement.src = imgPath;
            imgElement.style.display = "block";
            if (promptSpan) promptSpan.style.display = "none"; // ✅ 正确使用变量名
            frame.classList.add("filled");

        })
        .catch(err => {
            console.error("无法加载 hr.json：", err);
            alert("搞怪信息加载失败，请检查文件路径或格式！");
        });
}
const frame = document.getElementById("frame");
const preview = document.getElementById("preview");
const prompt = document.getElementById("prompt");
const badge = document.querySelector(".badge");
const canvas = document.getElementById("iconCanvas");

// ✅ 通用图片处理函数
function handleImageUpload(file, target) {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = evt => {
        if (target === "avatar") {
            preview.src = evt.target.result;
            preview.style.display = "block";
            if (prompt) prompt.style.display = "none";
            frame.classList.add("filled");
        } else if (target === "canvas") {
            const img = new Image();
            img.onload = () => {
                const x = canvas.width / 2;
                const y = canvas.height / 2;
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
        }
    };
    reader.readAsDataURL(file);
}

// ✅ 判断是否在头像区域
function isInFrameArea(e) {
    return e.target.closest("#frame");
}

// 🟩 头像区域拖拽上传
frame.addEventListener("dragover", e => {
    e.preventDefault();
    e.stopPropagation();
});
frame.addEventListener("drop", e => {
    e.preventDefault();
    e.stopPropagation();
    handleImageUpload(e.dataTransfer.files[0], "avatar");
});

// 🟦 badge 拖拽逻辑（图层添加）
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    badge.addEventListener(eventName, e => {
        if (isInFrameArea(e)) return;
        e.preventDefault();
    });
});

badge.addEventListener("dragover", e => {
    if (!isInFrameArea(e)) {
        badge.style.boxShadow = "0 0 0.8vh 0.4vh #999";
    }
});
badge.addEventListener("dragleave", () => {
    badge.style.boxShadow = "0 1vh 2vh rgba(0, 0, 0, 0.15)";
});

badge.addEventListener("drop", e => {
    if (isInFrameArea(e)) return;
    badge.style.boxShadow = "0 1vh 2vh rgba(0, 0, 0, 0.15)";
    handleImageUpload(e.dataTransfer.files[0], "canvas");
});
(function () {
    const originalLog = console.log;
    const panel = document.getElementById("consolePanel");

    console.log = function (...args) {
        originalLog.apply(console, args); // 保留原始行为

        const message = args.map(arg => {
            if (typeof arg === "object") {
                return JSON.stringify(arg, null, 2);
            }
            return String(arg);
        }).join(" ");

        const line = document.createElement("div");
        line.textContent = message;
        panel.appendChild(line);

        // ✅ 限制最多显示 3 行
        while (panel.children.length > 3) {
            panel.removeChild(panel.firstChild);
        }

        panel.scrollTop = panel.scrollHeight;
    };
})();

