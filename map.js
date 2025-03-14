document.addEventListener("DOMContentLoaded", function () {
    var map = L.map('map').setView([48.0196, 66.9237], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var markers = L.layerGroup();
    var schoolData = [];
    var selectedRegion = "all";

    let yearSlider = document.getElementById('timeline-slider');
    let monthSlider = document.getElementById('month-slider');

    function updateSchoolInfo(filteredData) {
        document.getElementById("total-schools").textContent = schoolData.length;
        document.getElementById("filtered-schools").textContent = filteredData.length;
    }

    function loadSchools() {
        let year = parseInt(yearSlider.value);
        let month = parseInt(monthSlider.value);
        markers.clearLayers();

        let filteredData = schoolData.filter(school => {
            if (!school.properties.completed) return false;

            let completedDate = new Date(String(school.properties.completed).replace(".0", "-01-01"));

            let isCompleted = completedDate.getFullYear() < year || 
                (completedDate.getFullYear() === year && completedDate.getMonth() + 1 <= month);

            if (!isCompleted) return false;
            if (selectedRegion !== "all" && school.properties.region !== selectedRegion) {
                return false;
            }

            return true;
        });

        updateSchoolInfo(filteredData);

        let schoolCounts = {};
        filteredData.forEach(school => {
            let coords = school.geometry.coordinates.join(',');
            if (!schoolCounts[coords]) {
                schoolCounts[coords] = [];
            }
            schoolCounts[coords].push(school.properties.name);
        });

        Object.keys(schoolCounts).forEach(coords => {
            let [lng, lat] = coords.split(',').map(Number);
            let count = schoolCounts[coords].length;

            var circle = L.circleMarker([lat, lng], {
                radius: 8 + count * 2,
                fillColor: "#28a745",
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
                interactive: true
            });

            markers.addLayer(circle);
        });

        map.addLayer(markers);
    }

    function applyRegionFilter() {
        selectedRegion = document.getElementById("region-select").value;
        loadSchools();
    }

    fetch('schools.json')
        .then(response => response.json())
        .then(data => {
            schoolData = data;
            loadSchools();
        })
        .catch(error => console.error('Ошибка загрузки данных:', error));

    yearSlider.addEventListener('input', loadSchools);
    monthSlider.addEventListener('input', loadSchools);
    document.getElementById("region-select").addEventListener("change", applyRegionFilter);
});
