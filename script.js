let speed = 100; 
let sortingActive = false;
let stopSorting = false; 
let stepMode = false; 
let comparisons = 0; 
let swaps = 0;
let nextStepResolve = null; 

let audioContext = null;
let musicOscillators = [];
let musicGainNode = null;
let musicPlaying = false; 
let delayNode = null;
let feedbackNode = null;
let filterNode = null;

const mp3MusicUrl = 'oppenheimer-music.mp3.mp3';
let mp3AudioBuffer = null;
let currentMp3SourceNode = null; 

const algorithms = {
    "bubble": {
        name: "Bubble Sort",
        timeAvg: "N^2",
        timeWorst: "N^2",
        space: "1",
        stable: "Yes",
        pseudocode: `
function bubbleSort(array):
    n = length(array)
    for i from 0 to n-2:
        for j from 0 to n-i-2:
            if array[j] > array[j+1]:
                swap array[j], array[j+1]
        `
    },
    "selection": {
        name: "Selection Sort",
        timeAvg: "N^2",
        timeWorst: "N^2",
        space: "1",
        stable: "No",
        pseudocode: `
function selectionSort(array):
    n = length(array)
    for i from 0 to n-2:
        min_idx = i
        for j from i+1 to n-1:
            if array[j] < array[min_idx]:
                min_idx = j
        swap array[i], array[min_idx]
        `
    },
    "insertion": {
        name: "Insertion Sort",
        timeAvg: "N^2",
        timeWorst: "N^2",
        space: "1",
        stable: "Yes",
        pseudocode: `
function insertionSort(array):
    n = length(array)
    for i from 1 to n-1:
        key = array[i]
        j = i - 1
        while j >= 0 and array[j] > key:
            array[j+1] = array[j]
            j = j - 1
        array[j+1] = key
        `
    },
    "shell": {
        name: "Shell Sort",
        timeAvg: "N \\log^2 N",
        timeWorst: "N^2",
        space: "1",
        stable: "No",
        pseudocode: `
function shellSort(array):
    n = length(array)
    gaps = [..., 1] 
    for each gap in gaps:
        for i from gap to n-1:
            temp = array[i]
            j = i
            while j >= gap and array[j - gap] > temp:
                array[j] = array[j - gap]
                j = j - gap
            array[j] = temp
        `
    },
    "heap": {
        name: "Heap Sort",
        timeAvg: "N \\log N",
        timeWorst: "N \\log N",
        space: "1",
        stable: "No",
        pseudocode: `
function heapSort(array):
    n = length(array)
    for i from floor(n/2)-1 down to 0:
        heapify(array, n, i)
    for i from n-1 down to 0:
        swap array[0], array[i]
        heapify(array, i, 0)

function heapify(array, n, i):
    largest = i
    left = 2*i + 1
    right = 2*i + 2
    if left < n and array[left] > array[largest]:
        largest = left
    if right < n and array[right] > array[largest]:
        largest = right
    if largest != i:
        swap array[i], array[largest]
        heapify(array, n, largest)
        `
    },
    "radix": {
        name: "Radix Sort",
        timeAvg: "Nk",
        timeWorst: "Nk",
        space: "N+k",
        stable: "Yes",
        pseudocode: `
function radixSort(array):
    max_val = max(array)
    exp = 1
    while max_val / exp > 0:
        countSort(array, exp)
        exp = exp * 10

function countSort(array, exp):
    n = length(array)
    output = new Array(n)
    counts = new Array(10).fill(0) 

    for i from 0 to n-1:
        digit = floor(array[i] / exp) % 10
        counts[digit] = counts[digit] + 1
    for i from 1 to 9:
        counts[i] = counts[i] + counts[i-1]
    for i from n-1 down to 0:
        digit = floor(array[i] / exp) % 10
        output[counts[digit]-1] = array[i]
        counts[digit] = counts[digit] - 1
    for i from 0 to n-1:
        array[i] = output[i]
        `
    },
    "cocktail": {
        name: "Cocktail Sort",
        timeAvg: "N^2",
        timeWorst: "N^2",
        space: "1",
        stable: "Yes",
        pseudocode: `
function cocktailSort(array):
    n = length(array)
    swapped = true
    start = 0
    end = n - 1
    while swapped:
        swapped = false
        for i from start to end-1:
            if array[i] > array[i+1]:
                swap array[i], array[i+1]
                swapped = true
        if not swapped: break 
        swapped = false
        end = end - 1
        for i from end-1 down to start:
            if array[i] > array[i+1]:
                swap array[i], array[i+1]
                swapped = true
        start = start + 1
        `
    },
    "quick": {
        name: "Quick Sort",
        timeAvg: "N \\log N",
        timeWorst: "N^2",
        space: "\\log N",
        stable: "No",
        pseudocode: `
function quickSort(array, low, high):
    if low < high:
        pi = partition(array, low, high)
        quickSort(array, low, pi - 1)
        quickSort(array, pi + 1, high)

function partition(array, low, high):
    pivot = array[high]
    i = low - 1
    for j from low to high-1:
        if array[j] < pivot:
            i = i + 1
            swap array[i], array[j]
    swap array[i+1], array[high]
    return i + 1
        `
    },
    "merge": {
        name: "Merge Sort",
        timeAvg: "N \\log N",
        timeWorst: "N \\log N",
        space: "N",
        stable: "Yes",
        pseudocode: `
function mergeSort(array, l, r):
    if l < r:
        m = floor((l + r) / 2)
        mergeSort(array, l, m)
        mergeSort(array, m + 1, r)
        merge(array, l, m, r)

function merge(array, l, m, r):
    n1 = m - l + 1
    n2 = r - m
    L = array[l..m]
    R = array[m+1..r]
    i = 0, j = 0, k = l
    while i < n1 and j < n2:
        if L[i] <= R[j]:
            array[k] = L[i]
            i = i + 1
        else:
            array[k] = R[j]
            j = j + 1
        k = k + 1
    while i < n1:
        array[k] = L[i]
        i = i + 1
        k = k + 1
    while j < n2:
        array[k] = R[j]
        j = j + 1
        k = k + 1
        `
    }
};

document.getElementById("speed-slider").addEventListener("input", function() {
    speed = 1010 - parseInt(this.value);
    document.getElementById("speed-value").textContent = this.value;
});

const numBarsSlider = document.getElementById("num-bars");
const numBarsValue = document.getElementById("num-bars-value");
numBarsSlider.addEventListener("input", function() {
    numBarsValue.textContent = this.value;
    if (!sortingActive) {
        generateBars(parseInt(this.value));
    }
});

const arrayTypeSelect = document.getElementById("array-type-select");
const userInputContainer = document.getElementById("user-input-container");
arrayTypeSelect.addEventListener("change", function() {
    if (this.value === "user-defined") {
        userInputContainer.classList.remove("hidden");
    } else {
        userInputContainer.classList.add("hidden");
        if (!sortingActive) {
            generateBars(parseInt(numBarsSlider.value));
        }
    }
});

document.getElementById("algo-select").addEventListener("change", function() {
    updateComplexityDisplay(algorithms[this.value]);
    document.getElementById("pseudocode-display").textContent = algorithms[this.value].pseudocode;
});

document.getElementById("next-step-button").addEventListener("click", nextStep);
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
document.getElementById("music-toggle").addEventListener("click", toggleMusic);

   function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            musicGainNode = audioContext.createGain();
            musicGainNode.gain.value = 1.0;
            musicGainNode.connect(audioContext.destination);
        } catch (e) {
            audioContext = null;
        }
    }
}




async function loadMp3() {
    if (!mp3MusicUrl || mp3AudioBuffer) return;
    if (!audioContext) {
        initAudioContext();
        if (!audioContext) return;
    }
    try {
        const response = await fetch(mp3MusicUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${mp3MusicUrl}`);
        const arrayBuffer = await response.arrayBuffer();
        mp3AudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
        mp3AudioBuffer = null;
    }
}

async function startMp3() {
    if (!audioContext) {
        initAudioContext();
        if (!audioContext) return;
    }
    if (!mp3AudioBuffer) {
        await loadMp3();
        if (!mp3AudioBuffer) return;
    }
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (e) {
            musicPlaying = false;
            document.getElementById("music-toggle").textContent = "Start Music";
            document.getElementById("music-toggle").classList.remove("active");
            return;
        }
    }
    if (musicPlaying && currentMp3SourceNode) {
        try {
            currentMp3SourceNode.stop();
            currentMp3SourceNode.disconnect();
            currentMp3SourceNode = null;
        } catch (e) {}
    }
    musicPlaying = true;
    document.getElementById("music-toggle").textContent = "Stop Music";
    document.getElementById("music-toggle").classList.add("active");
    currentMp3SourceNode = audioContext.createBufferSource();
    currentMp3SourceNode.buffer = mp3AudioBuffer;
    currentMp3SourceNode.loop = true;
    currentMp3SourceNode.connect(musicGainNode);
    currentMp3SourceNode.start(0);
    musicGainNode.gain.cancelScheduledValues(audioContext.currentTime);
    musicGainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
}

function stopMp3() {
    if (!audioContext || !musicPlaying || !currentMp3SourceNode) return;
    musicGainNode.gain.cancelScheduledValues(audioContext.currentTime);
    musicGainNode.gain.setValueAtTime(0.0, audioContext.currentTime);
    setTimeout(() => {
        try {
            currentMp3SourceNode.stop();
            currentMp3SourceNode.disconnect();
            currentMp3SourceNode = null;
        } catch (e) {}
        musicPlaying = false;
        document.getElementById("music-toggle").textContent = "Start Music";
        document.getElementById("music-toggle").classList.remove("active");
    }, 200);
}




function toggleMusic() {
    if (musicPlaying) {
        stopMp3();
    } else {
        startMp3();
    }
}

function generateBars(typeOverride = null) {
    const container = document.getElementById("bars-container");
    container.innerHTML = "";
    const arrayType = typeOverride || document.getElementById("array-type-select").value;
    let heights = [];
    const num = parseInt(numBarsSlider.value);
    if (arrayType === "user-defined") {
        const userInput = document.getElementById("user-array-input").value;
        const parsedHeights = userInput.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h) && h >= 10 && h <= 400);
        if (parsedHeights.length === 0 && userInput.trim() !== "") {
            updateComplexityDisplay(algorithms[document.getElementById("algo-select").value], "Invalid Input: Please enter comma-separated numbers (10-400).");
            document.getElementById("sort-status").classList.remove("text-green-400", "text-yellow-400");
            document.getElementById("sort-status").classList.add("text-red-400");
            return;
        } else if (parsedHeights.length === 0 && userInput.trim() === "") {
             arrayTypeSelect.value = "random";
             generateBars("random");
             return;
        }
        heights = parsedHeights;
    } else {
        switch (arrayType) {
            case "random":
                for (let i = 0; i < num; i++) {
                    heights.push(Math.floor(Math.random() * 390) + 10);
                }
                break;
            case "reversed":
                for (let i = 0; i < num; i++) {
                    heights.push(400 - (i * (390 / num)) - 10);
                }
                break;
            case "nearly-sorted":
                for (let i = 0; i < num; i++) {
                    heights.push(Math.floor(i * (390 / num)) + 10);
                }
                for (let i = 0; i < Math.floor(num * 0.1); i++) {
                    const idx1 = Math.floor(Math.random() * num);
                    const idx2 = Math.floor(Math.random() * num);
                    [heights[idx1], heights[idx2]] = [heights[idx2], heights[idx1]];
                }
                break;
            case "few-unique":
                const uniqueCount = Math.min(Math.floor(num / 5), 10);
                const uniqueHeights = [];
                for(let i = 0; i < uniqueCount; i++) {
                    uniqueHeights.push(Math.floor(Math.random() * 390) + 10);
                }
                for (let i = 0; i < num; i++) {
                    heights.push(uniqueHeights[Math.floor(Math.random() * uniqueCount)]);
                }
                break;
        }
    }
    if (arrayType === "random" || arrayType === "few-unique") {
        for (let i = heights.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [heights[i], heights[j]] = [heights[j], heights[i]];
        }
    }
    heights.forEach(h => {
        const bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.height = `${h}px`;
        container.appendChild(bar);
    });
    resetCounters();
    updateComplexityDisplay(algorithms[document.getElementById("algo-select").value], "Ready");
    document.getElementById("sort-status").classList.remove("text-green-400", "text-red-400");
    document.getElementById("sort-status").classList.add("text-yellow-400");
}

function delay() {
    return new Promise(resolve => {
        if (stopSorting) {
            throw new Error("Sorting stopped");
        }
        if (stepMode) {
            nextStepResolve = resolve;
        } else {
            setTimeout(resolve, speed);
        }
    });
}

function nextStep() {
    if (nextStepResolve) {
        nextStepResolve();
        nextStepResolve = null;
    }
}

async function startSort() {
    if (sortingActive) {
        return;
    }
    sortingActive = true;
    stopSorting = false;
    generateBars(document.getElementById("array-type-select").value);
    const algoSelect = document.getElementById("algo-select");
    const algo = algoSelect.value;
    const algoInfo = algorithms[algo];
    Array.from(document.getElementsByClassName("bar")).forEach(bar => bar.classList.remove("sorted"));
    updateComplexityDisplay(algoInfo, "Sorting in progress...");
    document.getElementById("sort-status").classList.add("text-yellow-400");
    try {
        let bars = document.getElementsByClassName("bar");
        switch (algo) {
            case "bubble": await bubbleSort(); break;
            case "selection": await selectionSort(); break;
            case "insertion": await insertionSort(); break;
            case "shell": await shellSort(); break;
            case "heap": await heapSort(); break;
            case "radix": await radixSort(); break;
            case "cocktail": await cocktailSort(); break;
            case "quick": await quickSort(bars, 0, bars.length - 1); break;
            case "merge": await mergeSort(bars, 0, bars.length - 1); break;
        }
        if (!stopSorting) {
            Array.from(bars).forEach(bar => bar.classList.add("sorted"));
            updateComplexityDisplay(algoInfo, "Sorting complete!");
            document.getElementById("sort-status").classList.remove("text-yellow-400", "text-red-400");
            document.getElementById("sort-status").classList.add("text-green-400");
        }
    } catch (error) {
        if (error.message === "Sorting stopped") {
        } else {
            updateComplexityDisplay(algoInfo, "Error during sort!");
            document.getElementById("sort-status").classList.remove("text-yellow-400", "text-green-400");
            document.getElementById("sort-status").classList.add("text-red-400");
        }
    } finally {
        sortingActive = false;
        if (!stopSorting && document.getElementById("sort-status").textContent !== "Sorting complete!") {
             updateComplexityDisplay(algoInfo, "Ready");
             document.getElementById("sort-status").classList.remove("text-green-400", "text-red-400");
             document.getElementById("sort-status").classList.add("text-yellow-400");
        }
        document.getElementById("next-step-button").disabled = true;
        if (stepMode) toggleStepMode();
    }
}

function resetSort() {
    stopSorting = true;
    sortingActive = false;
    generateBars(document.getElementById("array-type-select").value);
    updateComplexityDisplay(algorithms[document.getElementById("algo-select").value], "Stopped!");
    document.getElementById("sort-status").classList.remove("text-green-400", "text-yellow-400");
    document.getElementById("sort-status").classList.add("text-red-400");
    document.getElementById("next-step-button").disabled = true;
    if (stepMode) toggleStepMode();
}

function toggleStepMode() {
    stepMode = !stepMode;
    const toggleButton = document.getElementById("step-mode-toggle");
    const nextStepButton = document.getElementById("next-step-button");
    if (stepMode) {
        toggleButton.textContent = "Step Mode: ON";
        toggleButton.classList.add("active");
        if (sortingActive) nextStepButton.disabled = false;
    } else {
        toggleButton.textContent = "Step Mode: OFF";
        toggleButton.classList.remove("active");
        nextStepButton.disabled = true;
        if (nextStepResolve) {
            nextStepResolve();
            nextStepResolve = null;
        }
    }
}

function resetCounters() {
    comparisons = 0;
    swaps = 0;
    document.getElementById("comparisons-count").textContent = comparisons;
    document.getElementById("swaps-count").textContent = swaps;
}

function updateComplexityDisplay(algoInfo, status) {
    document.getElementById("algo-name").textContent = `Algorithm: ${algoInfo.name}`;
    document.getElementById("time-avg").innerHTML = `$O(${algoInfo.timeAvg})$`;
    document.getElementById("time-worst").innerHTML = `$O(${algoInfo.timeWorst})$`;
    document.getElementById("space-complexity").innerHTML = `$O(${algoInfo.space})$`;
    document.getElementById("sort-status").textContent = status;
    document.getElementById("pseudocode-display").textContent = algoInfo.pseudocode.trim();
    const statusElement = document.getElementById("sort-status");
    statusElement.classList.remove("text-green-400", "text-yellow-400", "text-red-400");
    if (status === "Sorting in progress...") {
        statusElement.classList.add("text-yellow-400");
    } else if (status === "Sorting complete!") {
        statusElement.classList.add("text-green-400");
    } else if (status === "Stopped!" || status === "Error during sort!") {
        statusElement.classList.add("text-red-400");
    } else {
        statusElement.classList.add("text-yellow-400");
    }
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const icon = document.getElementById(panelId.replace('-panel', '') + '-toggle-icon');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        icon.innerHTML = '&#9650;';
    } else {
        panel.classList.add('hidden');
        icon.innerHTML = '&#9660;';
    }
}

function toggleTheme() {
    const body = document.body;
    const themeToggleButton = document.getElementById("theme-toggle");
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeToggleButton.textContent = "Light Mode";
        themeToggleButton.classList.remove('active');
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggleButton.textContent = "Dark Mode";
        themeToggleButton.classList.add('active');
    }
    localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
}

async function swapBars(bar1, bar2) {
    swaps++;
    document.getElementById("swaps-count").textContent = swaps;
    bar1.classList.add("swapping");
    bar2.classList.add("swapping");
    await delay();
    if (stopSorting) throw new Error("Sorting stopped");
    let tempHeight = bar1.style.height;
    bar1.style.height = bar2.style.height;
    bar2.style.height = tempHeight;
    bar1.classList.remove("swapping");
    bar2.classList.remove("swapping");
}

function compare(height1, height2) {
    comparisons++;
    document.getElementById("comparisons-count").textContent = comparisons;
    return height1 > height2;
}

async function bubbleSort() {
    let bars = document.getElementsByClassName("bar");
    for (let i = 0; i < bars.length - 1; i++) {
        for (let j = 0; j < bars.length - i - 1; j++) {
            if (stopSorting) return;
            bars[j].classList.add("comparing");
            bars[j + 1].classList.add("comparing");
            await delay();
            let height1 = parseInt(bars[j].style.height);
            let height2 = parseInt(bars[j + 1].style.height);
            if (compare(height1, height2)) {
                await swapBars(bars[j], bars[j + 1]);
            }
            bars[j].classList.remove("comparing");
            bars[j + 1].classList.remove("comparing");
        }
        bars[bars.length - 1 - i].classList.add("sorted");
    }
    if (!stopSorting) bars[0].classList.add("sorted");
}

async function selectionSort() {
    let bars = document.getElementsByClassName("bar");
    let n = bars.length;
    for (let i = 0; i < n - 1; i++) {
        if (stopSorting) return;
        let min_idx = i;
        bars[i].classList.add("comparing");
        for (let j = i + 1; j < n; j++) {
            if (stopSorting) return;
            bars[j].classList.add("comparing");
            await delay();
            let height_min = parseInt(bars[min_idx].style.height);
            let height_j = parseInt(bars[j].style.height);
            if (compare(height_min, height_j)) {
                if (min_idx !== i) {
                    bars[min_idx].style.backgroundColor = "";
                }
                min_idx = j;
                bars[min_idx].style.backgroundColor = "#ff7f50";
            }
            bars[j].classList.remove("comparing");
        }
        if (min_idx !== i) {
            await swapBars(bars[i], bars[min_idx]);
        }
        if (min_idx !== i) {
            bars[min_idx].style.backgroundColor = ""; 
        }
        bars[i].classList.remove("comparing");
        if (!stopSorting) bars[i].classList.add("sorted");
    }
    if (!stopSorting) bars[n - 1].classList.add("sorted");
}

async function insertionSort() {
    let bars = document.getElementsByClassName("bar");
    let n = bars.length;
    for (let i = 1; i < n; i++) {
        if (stopSorting) return;
        let keyHeight = parseInt(bars[i].style.height);
        let keyBar = bars[i];
        keyBar.classList.add("inserting");
        await delay();
        let j = i - 1;
        while (j >= 0 && compare(parseInt(bars[j].style.height), keyHeight)) {
            if (stopSorting) return;
            bars[j + 1].style.height = bars[j].style.height;
            bars[j].classList.add("shifting");
            bars[j+1].classList.add("shifting");
            await delay();
            bars[j].classList.remove("shifting");
            bars[j+1].classList.remove("shifting");
            j = j - 1;
        }
        bars[j + 1].style.height = `${keyHeight}px`;
        keyBar.classList.remove("inserting");
        bars[j + 1].classList.add("inserted");
        await delay();
        bars[j + 1].classList.remove("inserted");
        for (let k = 0; k <= i; k++) {
            if (stopSorting) return;
            bars[k].classList.add("sorted");
        }
        await delay();
        for (let k = 0; k <= i; k++) {
            if (stopSorting) return;
            bars[k].classList.remove("sorted");
        }
    }
    if (!stopSorting) Array.from(bars).forEach(bar => bar.classList.add("sorted"));
}

async function shellSort() {
    let bars = document.getElementsByClassName("bar");
    let n = bars.length;
    let gaps = [701, 301, 132, 57, 23, 10, 4, 1];
    gaps = gaps.filter(g => g < n);
    if (gaps.length === 0) {
        let h = 1;
        while (h < n / 3) h = h * 3 + 1;
        gaps.push(h);
    }
    gaps.sort((a, b) => b - a);
    for (let g = 0; g < gaps.length; g++) {
        let gap = gaps[g];
        for (let i = gap; i < n; i++) {
            if (stopSorting) return;
            let temp = parseInt(bars[i].style.height);
            let tempBar = bars[i];
            tempBar.classList.add("inserting");
            await delay();
            let j = i;
            while (j >= gap && compare(parseInt(bars[j - gap].style.height), temp)) {
                if (stopSorting) return;
                bars[j].style.height = bars[j - gap].style.height;
                bars[j - gap].classList.add("shifting");
                bars[j].classList.add("shifting");
                await delay();
                bars[j - gap].classList.remove("shifting");
                bars[j].classList.remove("shifting");
                j -= gap;
            }
            bars[j].style.height = `${temp}px`;
            tempBar.classList.remove("inserting");
            bars[j].classList.add("inserted");
            await delay();
            bars[j].classList.remove("inserted");
        }
    }
    if (!stopSorting) Array.from(bars).forEach(bar => bar.classList.add("sorted"));
}

async function heapSort() {
    let bars = document.getElementsByClassName("bar");
    let n = bars.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        if (stopSorting) return;
        await heapify(bars, n, i);
    }
    for (let i = n - 1; i > 0; i--) {
        if (stopSorting) return;
        await swapBars(bars[0], bars[i]);
        bars[i].classList.add("sorted");
        await heapify(bars, i, 0);
    }
    if (!stopSorting) bars[0].classList.add("sorted");
}

async function heapify(bars, n, i) {
    let largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;
    bars[i].classList.add("comparing");
    if (left < n) bars[left].classList.add("comparing");
    if (right < n) bars[right].classList.add("comparing");
    await delay();
    if (left < n && parseInt(bars[left].style.height) > parseInt(bars[largest].style.height)) {
        largest = left;
    }
    if (right < n && parseInt(bars[right].style.height) > parseInt(bars[largest].style.height)) {
        largest = right;
    }
    bars[i].classList.remove("comparing");
    if (left < n) bars[left].classList.remove("comparing");
    if (right < n) bars[right].classList.remove("comparing");
    if (largest !== i) {
        await swapBars(bars[i], bars[largest]);
        if (stopSorting) throw new Error("Sorting stopped");
        await heapify(bars, n, largest);
    }
}

async function radixSort() {
    let bars = document.getElementsByClassName("bar");
    let n = bars.length;
    let maxVal = 0;
    for (let i = 0; i < n; i++) {
        maxVal = Math.max(maxVal, parseInt(bars[i].style.height));
    }
    for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
        if (stopSorting) return;
        await countSort(bars, n, exp);
    }
    if (!stopSorting) Array.from(bars).forEach(bar => bar.classList.add("sorted"));
}

async function countSort(bars, n, exp) {
    let output = new Array(n).fill(0);
    let counts = new Array(10).fill(0);
    let currentHeights = Array.from(bars).map(bar => parseInt(bar.style.height));
    for (let i = 0; i < n; i++) {
        if (stopSorting) throw new Error("Sorting stopped");
        let digit = Math.floor(currentHeights[i] / exp) % 10;
        counts[digit]++;
        bars[i].classList.add("counting");
        await delay();
        bars[i].classList.remove("counting");
    }
    for (let i = 1; i < 10; i++) {
        counts[i] += counts[i - 1];
    }
    for (let i = n - 1; i >= 0; i--) {
        if (stopSorting) throw new Error("Sorting stopped");
        let digit = Math.floor(currentHeights[i] / exp) % 10;
        output[counts[digit] - 1] = currentHeights[i];
        counts[digit]--;
        bars[i].classList.add("placing");
        await delay();
        bars[i].classList.remove("placing");
    }
    for (let i = 0; i < n; i++) {
        if (stopSorting) throw new Error("Sorting stopped");
        bars[i].style.height = `${output[i]}px`;
        bars[i].classList.add("sorted-pass");
        await delay();
        bars[i].classList.remove("sorted-pass");
    }
}

async function cocktailSort() {
    let bars = document.getElementsByClassName("bar");
    let n = bars.length;
    let swapped = true;
    let start = 0;
    let end = n - 1;
    while (swapped) {
        if (stopSorting) return;
        swapped = false;
        for (let i = start; i < end; i++) {
            if (stopSorting) return;
            bars[i].classList.add("comparing");
            bars[i + 1].classList.add("comparing");
            await delay();
            let height1 = parseInt(bars[i].style.height);
            let height2 = parseInt(bars[i + 1].style.height);
            if (compare(height1, height2)) {
                await swapBars(bars[i], bars[i + 1]);
                swapped = true;
            }
            bars[i].classList.remove("comparing");
            bars[i + 1].classList.remove("comparing");
        }
        if (!swapped) break;
        swapped = false;
        end--;
        for (let i = end - 1; i >= start; i--) {
            if (stopSorting) return;
            bars[i].classList.add("comparing");
            bars[i + 1].classList.add("comparing");
            await delay();
            let height1 = parseInt(bars[i].style.height);
            let height2 = parseInt(bars[i + 1].style.height);
            if (compare(height1, height2)) {
                await swapBars(bars[i], bars[i + 1]);
                swapped = true;
            }
            bars[i].classList.remove("comparing");
            bars[i + 1].classList.remove("comparing");
        }
        start++;
    }
    if (!stopSorting) Array.from(bars).forEach(bar => bar.classList.add("sorted"));
}

async function quickSort(bars, low, high) {
    if (stopSorting) return;
    if (low < high) {
        let pi = await partition(bars, low, high);
        await quickSort(bars, low, pi - 1);
        await quickSort(bars, pi + 1, high);
    } else if (low === high) {
        bars[low].classList.add("sorted");
        await delay();
    }
}

async function partition(bars, low, high) {
    let pivot = parseInt(bars[high].style.height);
    bars[high].classList.add("pivot");
    await delay();
    let i = low - 1;
    for (let j = low; j < high; j++) {
        if (stopSorting) throw new Error("Sorting stopped");
        bars[j].classList.add("comparing");
        await delay();
        if (parseInt(bars[j].style.height) < pivot) {
            i++;
            if (i !== j) {
                await swapBars(bars[i], bars[j]);
            }
        }
        bars[j].classList.remove("comparing");
    }
    await swapBars(bars[i + 1], bars[high]);
    bars[high].classList.remove("pivot"); 
    bars[i + 1].classList.add("sorted");
    await delay();
    return i + 1;
}

async function mergeSort(bars, l, r) {
    if (stopSorting) return;
    if (l < r) {
        let m = Math.floor((l + r) / 2);
        await mergeSort(bars, l, m);
        await mergeSort(bars, m + 1, r);
        await merge(bars, l, m, r);
    }
}

async function merge(bars, l, m, r) {
    let n1 = m - l + 1;
    let n2 = r - m;
    let L = new Array(n1);
    let R = new Array(n2);
    for (let i = 0; i < n1; i++) {
        if (stopSorting) throw new Error("Sorting stopped");
        L[i] = parseInt(bars[l + i].style.height);
        bars[l + i].classList.add("left-half"); }
    for (let j = 0; j < n2; j++) {
        if (stopSorting) throw new Error("Sorting stopped");
        R[j] = parseInt(bars[m + 1 + j].style.height);
        bars[m + 1 + j].classList.add("right-half"); 
    }
    await delay();
    let i = 0;
    let j = 0;
    let k = l;
    while (i < n1 && j < n2) {
        if (stopSorting) throw new Error("Sorting stopped");
        bars[k].classList.add("comparing");
        await delay();
        bars[k].classList.remove("comparing");
        comparisons++;
        document.getElementById("comparisons-count").textContent = comparisons;
        if (L[i] <= R[j]) {
            bars[k].style.height = `${L[i]}px`;
            i++;
        } else {
            bars[k].style.height = `${R[j]}px`;
            j++;
        }
        bars[k].classList.add("merged");
        await delay();
        bars[k].classList.remove("merged");
        k++;
    }
    while (i < n1) {
        if (stopSorting) throw new Error("Sorting stopped");
        bars[k].style.height = `${L[i]}px`;
        bars[k].classList.add("merged");
        await delay();
        bars[k].classList.remove("merged");
        i++;
        k++;
    }
    while (j < n2) {
        if (stopSorting) throw new Error("Sorting stopped");
        bars[k].style.height = `${R[j]}px`;
        bars[k].classList.add("merged");
        await delay();
        bars[k].classList.remove("merged");
        j++;
        k++;
    }
    for (let idx = l; idx <= r; idx++) {
        bars[idx].classList.remove("left-half", "right-half");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    generateBars();
    updateComplexityDisplay(algorithms[document.getElementById("algo-select").value], "Ready");
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById("theme-toggle").textContent = "Dark Mode";
        document.getElementById("theme-toggle").classList.add('active');
    } else {
        document.body.classList.add('dark-theme');
        document.getElementById("theme-toggle").textContent = "Light Mode";
        document.getElementById("theme-toggle").classList.remove('active');
    }
    document.getElementById("generate-array-button").addEventListener("click", () => {
        if (!sortingActive) {
            generateBars();
        }
    });
    document.getElementById("start-sort-button").addEventListener("click", startSort);
    document.getElementById("reset-sort-button").addEventListener("click", resetSort);
    document.getElementById("step-mode-toggle").addEventListener("click", toggleStepMode);
    document.getElementById("about-toggle").addEventListener("click", () => togglePanel('about-panel'));
    document.getElementById("controls-toggle").addEventListener("click", () => togglePanel('controls-panel'));
    document.getElementById("metrics-toggle").addEventListener("click", () => togglePanel('metrics-panel'));
    document.getElementById("pseudocode-toggle").addEventListener("click", () => togglePanel('pseudocode-panel'));
    togglePanel('about-panel');
    togglePanel('controls-panel');
    togglePanel('metrics-panel');
    togglePanel('pseudocode-panel');
    loadMp3();
});