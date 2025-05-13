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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements and Charts
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
let tempHistoryChart, humidityHistoryChart, aqiTrendChart, qualityDistributionChart;

// Initialize Charts
function initializeCharts() {
    // Temperature History Chart
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
                    title: { display: true, text: 'Last 30 Days' }
                }
            }
        }
    });

    // Humidity History Chart
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
                    title: { display: true, text: 'Last 30 Days' }
                }
            }
        }
    });

    // AQI Trend Chart
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
                    title: { display: true, text: 'Last 30 Days' }
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

function fetchLast30Readings() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dhtRef = database.ref('DHT22_sensor_data')
        .orderByChild('timestamp')
        .startAt(thirtyDaysAgo.getTime());
    
    const mqRef = database.ref('MQ135_sensor_data')
        .orderByChild('timestamp')
        .startAt(thirtyDaysAgo.getTime());

    Promise.all([dhtRef.once('value'), mqRef.once('value')])
        .then(([dhtSnapshot, mqSnapshot]) => {
            const dhtData = dhtSnapshot.val() || {};
            const mqData = mqSnapshot.val() || {};

            // Combine and process data
            const combinedData = [];
            
            // Process DHT data
            Object.entries(dhtData).forEach(([key, entry]) => {
                combinedData.push({
                    timestamp: entry.timestamp,
                    temperature: getSensorValue(entry, 'temperature'),
                    humidity: getSensorValue(entry, 'humidity')
                });
            });

            // Process MQ135 data
            Object.entries(mqData).forEach(([key, entry]) => {
                const existingEntry = combinedData.find(item => item.timestamp === entry.timestamp);
                if (existingEntry) {
                    existingEntry.airQuality = entry.MQ135_air_quality_status;
                } else {
                    combinedData.push({
                        timestamp: entry.timestamp,
                        airQuality: entry.MQ135_air_quality_status
                    });
                }
            });

            // Sort by timestamp (oldest first)
            combinedData.sort((a, b) => a.timestamp - b.timestamp);

            // Limit to the most recent 30 readings
            const last30Data = combinedData.slice(-30);

            // Prepare chart data
            const labels = last30Data.map(entry => {
                const date = new Date(entry.timestamp);
                return `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            });

            const tempData = last30Data.map(entry => entry.temperature);
            const humidityData = last30Data.map(entry => entry.humidity);
            const aqiData = last30Data.map(entry => 
                entry.airQuality ? statusToNumber(entry.airQuality) : null
            );

            // Update charts
            updateCharts(labels, tempData, humidityData, aqiData);
        })
        .catch(error => {
            console.error('Error fetching history:', error);
            document.getElementById('historyContainer').innerHTML = 
                '<p>Error loading history. Please try again later.</p>';
        });
}

// function fetchLast30DaysReadings() {
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
//     const dhtRef = database.ref('DHT22_sensor_data')
//         .orderByChild('timestamp')
//         .startAt(thirtyDaysAgo.getTime());
    
//     const mqRef = database.ref('MQ135_sensor_data')
//         .orderByChild('timestamp')
//         .startAt(thirtyDaysAgo.getTime());

//     Promise.all([dhtRef.once('value'), mqRef.once('value')])
//         .then(([dhtSnapshot, mqSnapshot]) => {
//             const dhtData = dhtSnapshot.val() || {};
//             const mqData = mqSnapshot.val() || {};

//             // Combine and process data
//             const combinedData = [];
            
//             // Process DHT data
//             Object.entries(dhtData).forEach(([key, entry]) => {
//                 combinedData.push({
//                     timestamp: entry.timestamp,
//                     temperature: getSensorValue(entry, 'temperature'),
//                     humidity: getSensorValue(entry, 'humidity')
//                 });
//             });

//             // Process MQ135 data
//             Object.entries(mqData).forEach(([key, entry]) => {
//                 const existingEntry = combinedData.find(item => item.timestamp === entry.timestamp);
//                 if (existingEntry) {
//                     existingEntry.airQuality = entry.MQ135_air_quality_status;
//                 } else {
//                     combinedData.push({
//                         timestamp: entry.timestamp,
//                         airQuality: entry.MQ135_air_quality_status
//                     });
//                 }
//             });

//             // Sort by timestamp (oldest first)
//             combinedData.sort((a, b) => a.timestamp - b.timestamp);

//             // Prepare chart data
//             const labels = combinedData.map(entry => {
//                 const date = new Date(entry.timestamp);
//                 return `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
//             });

//             const tempData = combinedData.map(entry => entry.temperature);
//             const humidityData = combinedData.map(entry => entry.humidity);
//             const aqiData = combinedData.map(entry => 
//                 entry.airQuality ? statusToNumber(entry.airQuality) : null
//             );

//             // Update charts
//             updateCharts(labels, tempData, humidityData, aqiData);
//         })
//         .catch(error => {
//             console.error('Error fetching history:', error);
//             document.getElementById('historyContainer').innerHTML = 
//                 '<p>Error loading history. Please try again later.</p>';
//         });
// }

// Add this helper function
function updateCharts(labels, tempData, humidityData, aqiData) {
    tempHistoryChart.data.labels = labels;
    tempHistoryChart.data.datasets[0].data = tempData;
    tempHistoryChart.update();

    humidityHistoryChart.data.labels = labels;
    humidityHistoryChart.data.datasets[0].data = humidityData;
    humidityHistoryChart.update();

    aqiTrendChart.data.labels = labels;
    aqiTrendChart.data.datasets[0].data = aqiData;
    aqiTrendChart.update();
}

// Update your getHealthRecommendation function to ensure it always returns a value
function getHealthRecommendation(status) {
    const recommendations = {
        'very Good (Fresh Air)': 'Air quality is satisfactory. Enjoy outdoor activities.',
        'Moderate': 'Air quality is acceptable. Sensitive individuals should reduce prolonged outdoor exertion.',
        'Unhealthy': 'Sensitive groups may experience health effects. Limit outdoor activity.',
        'Very Unhealthy': 'Everyone may experience health effects. Avoid prolonged outdoor exertion.',
        'Hazardous': 'Health emergency. Entire population affected. Stay indoors.',
        'default': 'Air quality data is currently unavailable. Please check back later.'
    };
    return recommendations[status] || recommendations['default'];
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
            if (tempHistoryChart.data.labels.length >= 24*7) { // Keep 7 days of hourly data
                tempHistoryChart.data.labels.shift();
                tempHistoryChart.data.datasets[0].data.shift();
            }
            tempHistoryChart.data.labels.push(timeLabel);
            tempHistoryChart.data.datasets[0].data.push(getSensorValue(dhtData, 'temperature'));
            tempHistoryChart.update();
            
            // Humidity Chart
            if (humidityHistoryChart.data.labels.length >= 24*7) {
                humidityHistoryChart.data.labels.shift();
                humidityHistoryChart.data.datasets[0].data.shift();
            }
            humidityHistoryChart.data.labels.push(timeLabel);
            humidityHistoryChart.data.datasets[0].data.push(getSensorValue(dhtData, 'humidity'));
            humidityHistoryChart.update();
            
            // AQI Chart
            if (aqiTrendChart.data.labels.length >= 24*7) {
                aqiTrendChart.data.labels.shift();
                aqiTrendChart.data.datasets[0].data.shift();
            }
            aqiTrendChart.data.labels.push(timeLabel);
            aqiTrendChart.data.datasets[0].data.push(statusToNumber(mqData?.MQ135_air_quality_status));
            aqiTrendChart.update();
        });
    });

    // Hamburger menu toggle
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Improved Contact Form Submission
    document.getElementById("contactForm").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();
        
        if (!name || !email || !message) {
            showFormMessage("Please fill in all fields", "error");
            return;
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            showFormMessage("Please enter a valid email address", "error");
            return;
        }

        database.ref("messages").push({
            name: name,
            email: email,
            message: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        })
        .then(() => {
            showFormMessage("Message sent successfully!", "success");
            document.getElementById("contactForm").reset();
        })
        .catch((error) => {
            console.error("Error saving message: ", error);
            showFormMessage("Error: " + error.message, "error");
        });
    });
}

// Show form message with animation
function showFormMessage(text, type = "success") {
    const messageDiv = document.getElementById("formMessage");
    messageDiv.textContent = text;
    messageDiv.className = `form-message ${type}`;
    messageDiv.classList.remove("hidden");
    
    setTimeout(() => {
        messageDiv.classList.add("hidden");
    }, 5000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);