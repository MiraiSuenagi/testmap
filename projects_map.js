// Инициализация карты для page2.html
var map = L.map('map').setView([48.0196, 66.9237], 5);

// Добавление слоя карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markers = L.layerGroup();
var projectData = [];
var selectedRegion = "all"; // Выбранный регион

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
    markers.clearLayers();
    let filteredData = projectData.filter(project => {
        // Фильтр по региону
        if (selectedRegion !== "all" && project.properties.region !== selectedRegion) {
            return false;
        }
        return true;
    });

    console.log(`Проектов отфильтровано: ${filteredData.length}`);
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

document.getElementById("region-select").addEventListener("change", applyRegionFilter);
