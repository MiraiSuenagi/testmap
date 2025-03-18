// Инициализация карты для page2.html
var map = L.map('map').setView([48.0196, 66.9237], 5);

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markers = L.layerGroup();
var projectData = [];
var selectedRegion = "all"; // Выбранный регион

// Автоматическое движение ползунков
let playing = true;
let yearSlider = document.getElementById('timeline-slider');
let monthSlider = document.getElementById('month-slider');

if (!yearSlider || !monthSlider) {
    console.error("Ошибка: Ползунки не найдены! Проверь ID элементов в HTML.");
} else {
    let currentYear = parseInt(yearSlider.value);
    let maxYear = parseInt(yearSlider.max);
    let currentMonth = parseInt(monthSlider.value);

    function autoPlaySlider() {
        let interval = setInterval(() => {
            if (!playing) return;

            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
            if (currentYear > maxYear) {
                currentYear = parseInt(yearSlider.min);
            }

            monthSlider.value = currentMonth;
            yearSlider.value = currentYear;
            loadProjects(); // Обновляем карту
        }, 1000);
    }

    autoPlaySlider();
}

// Функция обновления информации в карточке
function updateProjectInfo(filteredData) {
    document.getElementById("total-projects").textContent = projectData.length;
    document.getElementById("filtered-projects").textContent = filteredData.length;

    let projectList = document.getElementById("project-list");
    projectList.innerHTML = "";

    if (filteredData.length === 0) {
        projectList.innerHTML = "<p>Нет проектов в этом регионе.</p>";
    } else {
        filteredData.forEach(project => {
            let projectItem = document.createElement("div");
            projectItem.textContent = project.properties.name;
            projectList.appendChild(projectItem);
        });
    }
}

// Функция загрузки и отображения проектов
function loadProjects() {
    if (!yearSlider || !monthSlider) return;

    let year = parseInt(yearSlider.value);
    let month = parseInt(monthSlider.value);
    markers.clearLayers();

    let filteredData = projectData.filter(project => {
        if (!project.properties.completed) return false;
        let completedDate = new Date(String(project.properties.completed).replace(".0", "-01-01"));
        let isCompleted = completedDate.getFullYear() < year || 
            (completedDate.getFullYear() === year && completedDate.getMonth() + 1 <= month);
        if (!isCompleted) return false;
        if (selectedRegion !== "all" && project.properties.region !== selectedRegion) return false;
        return true;
    });

    console.log(`Проектов отфильтровано: ${filteredData.length} за ${year}-${month}`);
    updateProjectInfo(filteredData);

    filteredData.forEach(project => {
        let [lng, lat] = project.geometry.coordinates;
        let marker = L.marker([lat, lng])
            .bindPopup(`<b>${project.properties.name}</b><br>${project.properties.description}`);
        markers.addLayer(marker);
    });

    map.addLayer(markers);
}

// Фильтр по регионам
function applyRegionFilter() {
    selectedRegion = document.getElementById("region-select").value;
    loadProjects();
}

function resetFilters() {
    selectedRegion = "all";
    loadProjects();
}

// Загрузка данных
fetch('projects.json')
    .then(response => response.json())
    .then(data => {
        projectData = data.features;
        console.log("Данные проектов загружены:", projectData);
        document.getElementById("total-projects").textContent = projectData.length;
        loadProjects();
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));

if (yearSlider && monthSlider) {
    yearSlider.addEventListener('input', () => {
        currentYear = parseInt(yearSlider.value);
        loadProjects();
    });

    monthSlider.addEventListener('input', () => {
        currentMonth = parseInt(monthSlider.value);
        loadProjects();
    });
}

// Кнопка паузы/старта
let toggleButton = document.getElementById("toggleAnimation");
if (toggleButton) {
    toggleButton.addEventListener("click", function () {
        playing = !playing;
        this.innerText = playing ? "⏸ Пауза" : "▶️ Старт";
    });
}

document.getElementById("region-select").addEventListener("change", applyRegionFilter);
