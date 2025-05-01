// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCGqYg1nM3-D1_C0uZUetiHQDE-IzLtsfQ",
    authDomain: "airzone-df9fc.firebaseapp.com",
    databaseURL: "https://airzone-df9fc-default-rtdb.firebaseio.com",
    projectId: "airzone-df9fc",
    storageBucket: "airzone-df9fc.appspot.com",
    messagingSenderId: "295212383221",
    appId: "1:295212383221:web:f61350d7f60bdf82563ebc"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements and Charts
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
let tempHistoryChart, humidityHistoryChart, aqiTrendChart, qualityDistributionChart;

// Initialize Charts
function initializeCharts() {
    // Temperature History Chart (Last 30 readings)
    const tempHistoryCtx = document.getElementById('tempHistoryChart').getContext('2d');
    tempHistoryChart = new Chart(tempHistoryCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Temperature (°C)' }
                },
                x: {
                    title: { display: true, text: 'Last 30 Readings' }
                }
            }
        }
    });

    // Humidity History Chart (Last 30 readings)
    const humidityHistoryCtx = document.getElementById('humidityHistoryChart').getContext('2d');
    humidityHistoryChart = new Chart(humidityHistoryCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humidity (%)',
                data: [],
                borderColor: '#166088',
                backgroundColor: 'rgba(22, 96, 136, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Humidity (%)' }
                },
                x: {
                    title: { display: true, text: 'Last 30 Readings' }
                }
            }
        }
    });

    // AQI Trend Chart (Last 30 readings)
    const aqiTrendCtx = document.getElementById('aqiTrendChart').getContext('2d');
    aqiTrendChart = new Chart(aqiTrendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Air Quality Status',
                data: [],
                borderColor: '#4a6fa5',
                backgroundColor: 'rgba(74, 111, 165, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            const statuses = ['Good', 'Moderate', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];
                            return statuses[value] || value;
                        }
                    },
                    title: { display: true, text: 'AQI Status' }
                },
                x: {
                    title: { display: true, text: 'Last 30 Readings' }
                }
            }
        }
    });

    // Quality Distribution Chart
    const qualityDistributionCtx = document.getElementById('qualityDistributionChart').getContext('2d');
    qualityDistributionChart = new Chart(qualityDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Good', 'Moderate', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#4CAF50',
                    '#FFC107',
                    '#FF9800',
                    '#F44336',
                    '#9C27B0'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

// Helper function to safely access sensor data
function getSensorValue(data, field) {
    if (!data) return null;
    // Handle different field name variations
    if (field === 'temperature') {
        return data['temperature(°C)'] || data.temperature || null;
    }
    return data[field] || null;
}

// Convert air quality status to numerical value
function statusToNumber(status) {
    const statusMap = {
        'Good': 0,
        'Moderate': 1,
        'Unhealthy': 2,
        'Very Unhealthy': 3,
        'Hazardous': 4
    };
    return statusMap[status] ?? 1; // Default to Moderate
}

// Get Health Recommendation
function getHealthRecommendation(status) {
    const recommendations = {
        'Good': 'Air quality is satisfactory. Enjoy your normal outdoor activities.',
        'Moderate': 'Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.',
        'Unhealthy': 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
        'Very Unhealthy': 'Everyone may begin to experience health effects. Sensitive groups should avoid prolonged outdoor exertion.',
        'Hazardous': 'Health warning of emergency conditions. The entire population is more likely to be affected. Stay indoors.'
    };
    return recommendations[status] || 'Loading recommendations...';
}

// Format time for chart labels
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Update Dashboard with Real-time Data
function updateDashboard(sensorData) {
    if (!sensorData) {
        document.getElementById('temp-value').textContent = '--';
        document.getElementById('humidity-value').textContent = '--';
        document.getElementById('aqi-value').textContent = '--';
        document.getElementById('aqi-description').textContent = '--';
        document.getElementById('health-recommendation').textContent = 'Waiting for data...';
        return;
    }

    // Update Temperature
    const tempValue = parseFloat(getSensorValue(sensorData, 'temperature')) || '--';
    document.getElementById('temp-value').textContent = tempValue === '--' ? tempValue : tempValue.toFixed(1);

    // Update Humidity
    const humidityValue = parseFloat(getSensorValue(sensorData, 'humidity')) || '--';
    document.getElementById('humidity-value').textContent = humidityValue === '--' ? humidityValue : humidityValue.toFixed(1);

    // Update Air Quality Status
    const airQualityStatus = getSensorValue(sensorData, 'MQ135_air_quality_status') || '--';
    document.getElementById('aqi-value').textContent = airQualityStatus;
    document.getElementById('aqi-description').textContent = airQualityStatus;

    // Update Health Recommendation
    document.getElementById('health-recommendation').textContent = 
        airQualityStatus !== '--' ? getHealthRecommendation(airQualityStatus) : 'Waiting for data...';

    // Update Quality Distribution Chart
    if (airQualityStatus !== '--') {
        updateQualityDistribution(airQualityStatus);
    }
}

// Update Quality Distribution Chart
function updateQualityDistribution(status) {
    const distribution = [0, 0, 0, 0, 0];
    const index = statusToNumber(status);
    distribution[index] = 1;
    qualityDistributionChart.data.datasets[0].data = distribution;
    qualityDistributionChart.update();
}

// Fetch Last 30 Readings
function fetchLast30Readings() {
    const dhtRef = database.ref('DHT22_sensor_data').limitToLast(30);
    const mqRef = database.ref('MQ135_sensor_data').limitToLast(30);

    Promise.all([dhtRef.once('value'), mqRef.once('value')])
        .then(([dhtSnapshot, mqSnapshot]) => {
            const dhtData = dhtSnapshot.val() || {};
            const mqData = mqSnapshot.val() || {};

            // Combine data by timestamp
            const combinedData = [];
            
            // Process DHT data
            Object.values(dhtData).forEach(entry => {
                if (entry.timestamp) {
                    combinedData.push({
                        timestamp: entry.timestamp,
                        temperature: getSensorValue(entry, 'temperature'),
                        humidity: getSensorValue(entry, 'humidity')
                    });
                }
            });

            // Process MQ135 data
            Object.values(mqData).forEach(entry => {
                if (entry.timestamp) {
                    const existingEntry = combinedData.find(item => item.timestamp === entry.timestamp);
                    if (existingEntry) {
                        existingEntry.airQuality = entry.MQ135_air_quality_status;
                    } else {
                        combinedData.push({
                            timestamp: entry.timestamp,
                            airQuality: entry.MQ135_air_quality_status
                        });
                    }
                }
            });

            // Sort by timestamp (newest first)
            combinedData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Get last 30 entries
            const last30Readings = combinedData.slice(0, 30).reverse();

            // Prepare data for charts
            const timeLabels = last30Readings.map(entry => formatTime(entry.timestamp));
            const tempValues = last30Readings.map(entry => entry.temperature || null);
            const humidityValues = last30Readings.map(entry => entry.humidity || null);
            const aqiValues = last30Readings.map(entry => 
                entry.airQuality ? statusToNumber(entry.airQuality) : null
            );

            // Update Temperature Chart
            tempHistoryChart.data.labels = timeLabels;
            tempHistoryChart.data.datasets[0].data = tempValues;
            tempHistoryChart.update();

            // Update Humidity Chart
            humidityHistoryChart.data.labels = timeLabels;
            humidityHistoryChart.data.datasets[0].data = humidityValues;
            humidityHistoryChart.update();

            // Update AQI Trend Chart
            aqiTrendChart.data.labels = timeLabels;
            aqiTrendChart.data.datasets[0].data = aqiValues;
            aqiTrendChart.update();
        })
        .catch(error => {
            console.error('Error fetching historical data:', error);
        });
}

// Initialize the app
function init() {
    initializeCharts();
    fetchLast30Readings();

    // Set up real-time listeners
    const dhtRef = database.ref('DHT22_sensor_data').limitToLast(1);
    const mqRef = database.ref('MQ135_sensor_data').limitToLast(1);

    dhtRef.on('child_added', (snapshot) => {
        const dhtData = snapshot.val();
        mqRef.once('child_added').then((mqSnapshot) => {
            const mqData = mqSnapshot.val();
            const combinedData = {
                ...dhtData,
                MQ135_air_quality_status: mqData?.MQ135_air_quality_status
            };
            updateDashboard(combinedData);
            
            // Add new data point to historical charts
            const timeLabel = formatTime(dhtData?.timestamp || new Date().toISOString());
            
            // Temperature Chart
            if (tempHistoryChart.data.labels.length >= 30) {
                tempHistoryChart.data.labels.shift();
                tempHistoryChart.data.datasets[0].data.shift();
            }
            tempHistoryChart.data.labels.push(timeLabel);
            tempHistoryChart.data.datasets[0].data.push(getSensorValue(dhtData, 'temperature'));
            tempHistoryChart.update();
            
            // Humidity Chart
            if (humidityHistoryChart.data.labels.length >= 30) {
                humidityHistoryChart.data.labels.shift();
                humidityHistoryChart.data.datasets[0].data.shift();
            }
            humidityHistoryChart.data.labels.push(timeLabel);
            humidityHistoryChart.data.datasets[0].data.push(getSensorValue(dhtData, 'humidity'));
            humidityHistoryChart.update();
            
            // AQI Chart
            if (aqiTrendChart.data.labels.length >= 30) {
                aqiTrendChart.data.labels.shift();
                aqiTrendChart.data.datasets[0].data.shift();
            }
            aqiTrendChart.data.labels.push(timeLabel);
            aqiTrendChart.data.datasets[0].data.push(statusToNumber(mqData?.MQ135_air_quality_status));
            aqiTrendChart.update();
        });
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init); 