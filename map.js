var map = L.map('map').setView([48.0196, 66.9237], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markers = L.layerGroup();
var schoolData = [];
var selectedRegion = "all";
let currentProject = "comfort";

// Функция переключения проектов
function switchProject(project) {
    currentProject = project;

    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`[onclick="switchProject('${project}')"]`).classList.add("active");

    document.getElementById("project-title").textContent = 
        project === "comfort" ? "Национальный проект «Комфортная школа»" : 
        project === "project2" ? "Проект 2" : "Проект 3";

    let dataFile = project === "comfort" ? "schools.json" : 
                   project === "project2" ? "project2.json" : "project3.json";

    fetch(dataFile)
        .then(response => response.json())
        .then(data => {
            schoolData = data;
            loadSchools();
        })
        .catch(error => console.error('Ошибка загрузки данных:', error));
}

// Функция загрузки школ
function loadSchools() {
    markers.clearLayers();
    let filteredData = schoolData.filter(school => selectedRegion === "all" || school.properties.region === selectedRegion);

    document.getElementById("total-schools").textContent = schoolData.length;
    document.getElementById("filtered-schools").textContent = filteredData.length;

    filteredData.forEach(school => {
        let [lng, lat] = school.geometry.coordinates;
        var marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: "#28a745",
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(`<b>${school.properties.name}</b><br>${school.properties.status}`);

        markers.addLayer(marker);
    });

    map.addLayer(markers);
}

// Фильтр по регионам
function applyRegionFilter() {
    selectedRegion = document.getElementById("region-select").value;
    loadSchools();
}

function resetFilters() {
    selectedRegion = "all";
    loadSchools();
}

// Загрузка данных при старте
switchProject("comfort");
