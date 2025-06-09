// 初始化所有图表
let worldMapChart = echarts.init(document.getElementById('world-map'));
let topCountriesChart = echarts.init(document.getElementById('top-countries-chart'));
let bottomCountriesChart = echarts.init(document.getElementById('bottom-countries-chart'));
let continentChart = echarts.init(document.getElementById('continent-chart'));
let correlationChart = echarts.init(document.getElementById('correlation-chart'));

// 存储所有年份的数据
let allData = {};
let currentYear = 2024;

// 英文属性到中文的映射
const attributeNameMap = {
    'Happiness Score': '幸福指数',
    'Freedom': '自由',
    'Generosity': '慷慨',
    'Trust (Government Corruption)': '政府信任度',
    'Social support': '社会支持',
    'Dystopia + residual': '反乌托邦',
    'Economy (GDP per Capita)': '人均GDP',
    'Health (Life Expectancy)': '预期寿命',
    'Country': '国家',
    'Continent': '大洲',
    'Asia': '亚洲',
    'Europe': '欧洲',
    'North America': '北美洲',
    'South America': '南美洲',
    'Africa': '非洲',
    'Oceania': '大洋洲'
};

// 加载数据
async function loadData() {
    const years = Array.from({length: 10}, (_, i) => 2015 + i);
    for (const year of years) {
        const response = await fetch(`/data/${year}.csv`);
        const text = await response.text();
        const data = parseCSV(text);
        allData[year] = data;
    }
    updateAllCharts();
}

// 解析CSV数据
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = (values[index] !== undefined && values[index] !== null) ? values[index].trim() : '';
        });
        
        // 添加日志
        const happinessScoreKey = 'Happiness Score'; // 确保这个键名与CSV中的列名完全一致
        if (obj[happinessScoreKey] !== undefined) {
            const rawValue = obj[happinessScoreKey];
            const parsedValue = parseFloat(rawValue);
            // console.log(`Parsing "${happinessScoreKey}": Raw = "${rawValue}", Parsed = ${parsedValue}`);
            // console.log(`Is NaN: ${isNaN(parsedValue)}`); // 检查是否是 NaN
        }
        
        return obj;
    });
}

// 更新世界地图
function updateWorldMap() {
    const data = allData[currentYear];
    const mapData = data.map(item => ({
        name: item.Country,
        name_zh: item.Country_Chinese,
        value: parseFloat(item['Happiness Score'])
    }));

    const option = {
        title: {
            text: '世界幸福指数分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.data && params.data.name_zh) {
                    return `${params.data.name_zh}: ${params.value.toFixed(2)}`;
                }
                // 如果没有中文名称，但有值，显示英文名和值
                if (params.value) {
                    return `${params.name}: ${params.value.toFixed(2)}`;
                }
                // 否则只显示英文名（例如没有数据的国家）
                return params.name;
            }
        },
        visualMap: {
            min: 0,
            max: 10,
            text: ['高', '低'],
            realtime: false,
            calculable: true,
            inRange: {
                color: ['#f3f3f9', '#444693']
            }
        },
        series: [{
            name: '幸福指数',
            type: 'map',
            map: 'world',
            roam: true,
            emphasis: {
                label: {
                    show: true
                }
            },
            data: mapData
        }]
    };

    worldMapChart.setOption(option);
}

// 更新前十名国家图表
function updateTopCountriesChart() {
    const data = allData[currentYear];
    const sortedData = [...data].sort((a, b) =>
        parseFloat(b['Happiness Score']) - parseFloat(a['Happiness Score'])
    ).slice(0, 10);

    const scores = sortedData.map(item => parseFloat(item['Happiness Score']));
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const margin = (maxScore - minScore) * 0.1;

    const option = {
        title: {
            text: '幸福指数前十名国家',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            data: sortedData.map(item => item.Country_Chinese),
            axisLabel: {
                interval: 0,
                rotate: 30
            }
        },
        yAxis: {
            type: 'value',
            name: '幸福指数',
            min: (minScore - margin).toFixed(2),
            max: (maxScore + margin).toFixed(2)
        },
        series: [{
            data: scores.map(score => parseFloat(score.toFixed(2))),
            type: 'bar',
            itemStyle: {
                color: '#2c7fb8'
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}'
            }
        }],
        animationDuration: 1000,
        animationEasing: 'cubicOut'
    };

    topCountriesChart.setOption(option);
}

// 更新后十名国家图表
function updateBottomCountriesChart() {
    const data = allData[currentYear];
    const sortedData = [...data].sort((a, b) =>
        parseFloat(a['Happiness Score']) - parseFloat(b['Happiness Score'])
    ).slice(0, 10);

    const scores = sortedData.map(item => parseFloat(item['Happiness Score']));
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const margin = (maxScore - minScore) * 0.1;

    const option = {
        title: {
            text: '幸福指数后十名国家',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            data: sortedData.map(item => item.Country_Chinese),
            axisLabel: {
                interval: 0,
                rotate: 30
            }
        },
        yAxis: {
            type: 'value',
            name: '幸福指数',
            min: (minScore - margin).toFixed(2),
            max: (maxScore + margin).toFixed(2)
        },
        series: [{
            data: scores.map(score => parseFloat(score.toFixed(2))),
            type: 'bar',
            itemStyle: {
                color: '#e34a33' // 红色系，表示较低的幸福指数
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}'
            }
        }],
        animationDuration: 1000,
        animationEasing: 'cubicOut'
    };

    bottomCountriesChart.setOption(option);
}

// 更新大洲平均幸福指数图表
function updateContinentChart() {
    const data = allData[currentYear];
    const continentData = {};

    data.forEach(item => {
        const continent = item.continent;
        if (!continentData[continent]) {
            continentData[continent] = {
                sum: 0,
                count: 0
            };
        }
        continentData[continent].sum += parseFloat(item['Happiness Score']);
        continentData[continent].count++;
    });

    const continents = Object.keys(continentData);
    const avgContinentScores = Object.keys(continentData).map(continent => ({
        name: continent,
        value: continentData[continent].sum / continentData[continent].count
    })).sort((a, b) => b.value - a.value);

    const minScore = Math.min(...avgContinentScores.map(item => parseFloat(item.value)));
    const maxScore = Math.max(...avgContinentScores.map(item => parseFloat(item.value)));
    const margin = (maxScore - minScore) * 0.1;

    const option = {
        title: {
            text: '各大洲平均幸福指数',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            // 将英文大洲名映射为中文
            data: avgContinentScores.map(item => attributeNameMap[item.name] || item.name),
            axisLabel: {
                interval: 0,
                rotate: 30
            }
        },
        yAxis: {
            type: 'value',
            name: '平均幸福指数',
            min: (minScore - margin).toFixed(2),
            max: (maxScore + margin).toFixed(2)
        },
        series: [{
            data: avgContinentScores.map(item => parseFloat(item.value.toFixed(2))),
            type: 'bar',
            itemStyle: {
                color: '#31a354'
            }
        }]
    };

    continentChart.setOption(option);
}

// 更新相关性图表为热力图
function updateCorrelationChart() {
    const data = allData[currentYear];
    const allFeatures = [
        'Happiness Score',
        'Freedom',
        'Generosity',
        'Trust (Government Corruption)',
        'Social support',
        'Dystopia + residual',
        'Economy (GDP per Capita)',
        'Health (Life Expectancy)'
    ];

    // Prepare data for each feature
    const featureValuesMap = {};
    allFeatures.forEach(feature => {
        featureValuesMap[feature] = data.map(item => parseFloat(item[feature])).filter(val => !isNaN(val));
    });

    const heatmapData = [];
    // Calculate correlation matrix
    for (let i = 0; i < allFeatures.length; i++) {
        for (let j = 0; j < allFeatures.length; j++) {
            const feature1 = allFeatures[i];
            const feature2 = allFeatures[j];

            const values1 = featureValuesMap[feature1];
            const values2 = featureValuesMap[feature2];

            // Ensure arrays have same length and are not empty for correlation calculation
            if (values1.length > 1 && values1.length === values2.length) {
                const correlation = calculateCorrelation(values1, values2);
                heatmapData.push([i, j, parseFloat(correlation.toFixed(2))]); // Store with indices and rounded value
            } else {
                // If data is insufficient or missing, set correlation to 0 or NaN, here 0 for display
                heatmapData.push([i, j, 0]);
            }
        }
    }

    const option = {
        title: { text: `${currentYear} 幸福指数各因素相关性热力图`, left: 'center' },
        tooltip: {
            position: 'top',
            formatter: function(params) {
                const featureName1 = attributeNameMap[allFeatures[params.value[0]]] || allFeatures[params.value[0]];
                const featureName2 = attributeNameMap[allFeatures[params.value[1]]] || allFeatures[params.value[1]];
                return `${featureName1} vs ${featureName2}: ${params.value[2]}`;
            }
        },
        grid: {
            height: '60%',
            top: '10%',
            left: '15%', // Adjust grid to make space for labels
            right: '10%',
            bottom: '20%' // Adjust bottom to make space for visualMap
        },
        xAxis: {
            type: 'category',
            data: allFeatures,
            axisLabel: {
                interval: 0,
                rotate: 45, // Rotate labels for better readability
                align: 'right',
                fontSize: 8,
                formatter: function(value) {
                    return attributeNameMap[value] || value;
                }
            }
        },
        yAxis: {
            type: 'category',
            data: allFeatures,
            axisLabel: {
                interval: 0,
                fontSize: 8,
                formatter: function(value) {
                    return attributeNameMap[value] || value;
                }
            }
        },
        visualMap: {
            min: 0,
            max: 1,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%', // Move visualMap to the very bottom
            inRange: {
                color: ['#313695', '#4575b4', '#abd9e9', '#ffffbf', '#fee090', '#fc8d59', '#d73027', '#a50026'] // Diverging color scheme
            },
            text: ['高', '低'],
        },
        series: [{
            name: '相关系数',
            type: 'heatmap',
            data: heatmapData,
            label: {
                show: true,
                formatter: function(params) {
                    return params.value[2]; // Display the correlation value on the cell
                },
                fontSize: 10 // Adjust font size for better readability on small cells
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };

    correlationChart.setOption(option);
}

// 计算相关系数
function calculateCorrelation(x, y) {
    const n = x.length;
    let sum_x = 0, sum_y = 0, sum_xy = 0;
    let sum_x2 = 0, sum_y2 = 0;

    for (let i = 0; i < n; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += x[i] * y[i];
        sum_x2 += x[i] * x[i];
        sum_y2 += y[i] * y[i];
    }

    const numerator = n * sum_xy - sum_x * sum_y;
    const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

// 更新所有图表
function updateAllCharts() {
    updateWorldMap();
    updateTopCountriesChart();
    updateBottomCountriesChart();
    updateContinentChart();
    updateCorrelationChart();
}

// 监听年份滑块变化
document.getElementById('year-slider').addEventListener('input', function(e) {
    currentYear = parseInt(e.target.value);
    document.getElementById('current-year').textContent = currentYear;
    updateAllCharts();
});

// 监听窗口大小变化
window.addEventListener('resize', function() {
    worldMapChart.resize();
    topCountriesChart.resize();
    bottomCountriesChart.resize();
    continentChart.resize();
    correlationChart.resize();
});

// 加载数据
loadData();