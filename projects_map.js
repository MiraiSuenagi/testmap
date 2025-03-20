// Инициализация карты для page2.html
var map = L.map('map').setView([48.0196, 66.9237], 5);

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markers = L.layerGroup();
map.addLayer(markers); // Добавляем слой маркеров на карту

var projectData = [];
var selectedRegion = "all"; // Выбранный регион

// Автоматическое движение ползунков
let playing = true;
let yearSlider = document.getElementById('timeline-slider');
let monthSlider = document.getElementById('month-slider');

if (!yearSlider || !monthSlider) {
    console.error("Ошибка: Ползунки не найдены! Проверь ID элементов в HTML.");
} else {
    function autoPlaySlider() {
        let interval = setInterval(() => {
            if (!playing) return;

            let currentYear = parseInt(yearSlider.value);
            let maxYear = parseInt(yearSlider.max);
            let currentMonth = parseInt(monthSlider.value);

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
    let currentDate = new Date(year, month - 1);

    markers.clearLayers();

    let filteredData = projectData.filter(project => {
        let completedDate = new Date(String(project.properties.completed).replace(".0", "-01-01"));
        if (selectedRegion !== "all" && project.properties.region !== selectedRegion) return false;
        return true; // Показываем все объекты
    });

    console.log(`Проектов отфильтровано: ${filteredData.length} за ${year}-${month}`);

    let greenProjectsCount = 0; // Счетчик зеленых маркеров
    let projectCounts = {};

    filteredData.forEach(project => {
        let coords = project.geometry.coordinates.join(',');
        if (!projectCounts[coords]) {
            projectCounts[coords] = [];
        }
        projectCounts[coords].push(project);
    });

    Object.keys(projectCounts).forEach(coords => {
        let [lng, lat] = coords.split(',').map(Number);
        let count = projectCounts[coords].length;
        let projectNames = projectCounts[coords].map(p => p.properties.name).join("<br>");

        let completedDate = new Date(String(projectCounts[coords][0].properties.completed).replace(".0", "-01-01"));
        let markerColor = completedDate <= currentDate ? "#28a745" : "#dc3545"; // Красный если не завершен, зеленый если завершен

        if (markerColor === "#28a745") {
            greenProjectsCount += count; // Учитываем все завершенные проекты
        }

        var circle = L.circleMarker([lat, lng], {
            radius: 8 + count * 2,
            fillColor: markerColor,
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
            interactive: true
        }).bindPopup(`<b>Проекты:</b><br>${projectNames}`);

        markers.addLayer(circle);
    });

    map.addLayer(markers);

    // Обновляем количество завершенных проектов
    document.getElementById("filtered-projects").textContent = greenProjectsCount;

    // Обновляем список проектов
    updateProjectInfo(filteredData);
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
    yearSlider.addEventListener('input', loadProjects);
    monthSlider.addEventListener('input', loadProjects);
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
