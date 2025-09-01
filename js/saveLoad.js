let sceneLoaded = false;
let currentScene = [];
// ✅ 设置场景：替换当前图层元素
function setScene(newElements) {
    if (!Array.isArray(newElements) || newElements.length === 0) {
        console.warn("⛔ setScene 被调用但数据无效");
        sceneLoaded = false;
        elements = [];
        drawAll();
        return;
    }

    elements = newElements.map(obj => ({
        ...obj,
        rotationSwing: 0,
        animationHandle: null
    }));

    sceneLoaded = true;
    drawAll();
    console.log("✅ 新场景已设置，元素数：", elements.length);

    if (typeof restoreAnimations === "function") {
        restoreAnimations(elements);
    }

    if (typeof saveInitialStates === "function") {
        saveInitialStates();
    }
}

// ✅ 从文件载入场景
function loadSceneFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            const loadedElements = Array.isArray(data)
                ? data
                : Array.isArray(data.elements)
                    ? data.elements
                    : [];

            if (loadedElements.length === 0) {
                alert("⚠️ 文件内容为空");
                return;
            }

            setScene(loadedElements);
        } catch (err) {
            console.error("❌ 文件解析失败:", err);
            alert("载入失败：请确认 JSON 格式正确");
            sceneLoaded = false;
            elements = [];
            drawAll();
        }
    };

    reader.readAsText(file);
}

// ✅ 保存当前场景为 JSON 文件
async function saveSceneAsFile() {
    console.log("🧪 保存前调试：elements.length =", elements.length);

    if (!elements.length) {
        alert("❗场景为空，无法保存！");
        return;
    }

    const data = JSON.stringify(elements, null, 2);
    const blob = new Blob([data], { type: 'application/json' });

    try {
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: "scene.json",
            types: [{
                description: "JSON 文件",
                accept: { "application/json": [".json"] }
            }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log("✅ 场景已成功保存！");
    } catch (err) {
        console.error("❌ 保存失败：", err);
    }
}


// ✅ 保存 canvas 图像为 PNG 文件
async function saveCanvasAsImageWithPicker() {
    const canvas = document.getElementById("iconCanvas");
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));

    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: "scene.png",
            types: [{
                description: "PNG 图片",
                accept: { "image/png": [".png"] }
            }]
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert("保存成功 🎉");
    } catch (err) {
        console.error("保存失败", err);
        alert("保存已取消或失败 ❌");
    }
}
