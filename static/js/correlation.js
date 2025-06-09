// 存储所有年份的数据
let allData = {};

// 将 charts 定义为一个对象，方便按大洲名称访问
let charts = {}; 

// 属性名称映射
const attributeNameMap = {
    'Freedom': '自由',
    'Generosity': '慷慨',
    'Trust (Government Corruption)': '政府信任度',
    'Social support': '社会支持',
    'Dystopia + residual': '反乌托邦',
    'Economy (GDP per Capita)': '人均GDP',
    'Health (Life Expectancy)': '预期寿命'
};

// 大洲名称映射
const continentNameMap = {
    'Europe': '欧洲',
    'Asia': '亚洲',
    'North America': '北美洲',
    'South America': '南美洲',
    'Africa': '非洲',
    'Oceania': '大洋洲'
};

const continentColors = {
    'Asia': '#5470c6',          // 蓝色系
    'Europe': '#91cc75',        // 绿色系
    'North America': '#fac858', // 黄色系
    'South America': '#ee6666', // 红色系
    'Africa': '#73c0de',        // 浅蓝色系
    'Oceania': '#3ba272'      // 青色系
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
    initializeControls();
}

// 解析CSV数据
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = (values[index] !== undefined && values[index] !== null) ? values[index].trim() : '';
        });
        return obj;
    });
}

// 初始化控件
function initializeControls() {
    // 初始化年份选择器
    const years = Object.keys(allData).sort();
    const yearSelect = document.getElementById('year-select');
    yearSelect.innerHTML = years.map(year => 
        `<option value="${year}">${year}</option>`
    ).join('');

    // 添加事件监听器
    yearSelect.addEventListener('change', updateAllCharts);
    document.getElementById('attribute-select').addEventListener('change', updateAllCharts);

    // 初始更新图表
    updateAllCharts();
}

// 计算线性回归
function calculateRegression(x, y) {
    const n = x.length;
    if (n === 0) return { slope: 0, intercept: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
    }
    
    const denominator = (n * sumX2 - sumX * sumX);
    if (denominator === 0) return { slope: 0, intercept: sumY / n };

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
}

// 更新所有图表
function updateAllCharts() {
    const year = document.getElementById('year-select').value;
    const attribute = document.getElementById('attribute-select').value;
    
    // 按大洲分组数据
    const continentData = {
        'Europe': [],
        'Asia': [],
        'North America': [],
        'South America': [],
        'Africa': [],
        'Oceania': []
    };
    
    if (!allData[year]) {
        console.error(`No data found for year: ${year}`);
        return;
    }

    // 将数据按大洲分组
    allData[year].forEach(item => {
        const continent = item.continent;
        if (continent && continentData.hasOwnProperty(continent)) {
            const happinessScore = parseFloat(item['Happiness Score']);
            const attributeValue = parseFloat(item[attribute]);

            if (!isNaN(happinessScore) && !isNaN(attributeValue)) {
                continentData[continent].push({
                    name: item.Country_Chinese || item.Country,
                    happiness: happinessScore,
                    attribute: attributeValue
                });
            }
        }
    });
    
    // 更新每个大洲的图表
    Object.entries(continentData).forEach(([continent, data]) => {
        const chartKey = continent.replace(/\s/g, '');
        
        if (!charts[chartKey]) {
            console.warn(`Chart instance for continent ${chartKey} not found.`);
            return;
        }

        const color = continentColors[continent];

        const scatterData = data.filter(item => 
            !isNaN(item.attribute) && !isNaN(item.happiness)
        ).map(item => ({
            name: item.name,
            value: [item.attribute, item.happiness]
        }));
        
        if (scatterData.length < 2) {
            charts[chartKey].clear();
            charts[chartKey].setOption({
                title: {
                    text: `${continentNameMap[continent]}数据`,
                    left: 'center'
                },
                graphic: {
                    type: 'text',
                    left: 'center',
                    top: 'center',
                    style: {
                        text: '数据点不足，无法绘制图表',
                        fill: '#999',
                        font: '14px Microsoft YaHei'
                    }
                }
            });
            return;
        }

        const xValues = scatterData.map(item => item.value[0]);
        const yValues = scatterData.map(item => item.value[1]);
        const regression = calculateRegression(xValues, yValues);
        
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const regressionLine = [
            [minX, regression.slope * minX + regression.intercept],
            [maxX, regression.slope * maxX + regression.intercept]
        ];

        const option = {
            title: {
                text: `${continentNameMap[continent]}幸福指数与${attributeNameMap[attribute]}关系`,
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    if (params.seriesType === 'scatter') {
                        return `${params.name}<br/>${attributeNameMap[attribute]}: ${params.value[0].toFixed(2)}<br/>幸福指数: ${params.value[1].toFixed(2)}`;
                    }
                    return null;
                }
            },
            xAxis: {
                type: 'value',
                name: attributeNameMap[attribute],
                nameLocation: 'middle',
                nameGap: 30
            },
            yAxis: {
                type: 'value',
                name: '幸福指数',
                nameLocation: 'middle',
                nameGap: 30
            },
            series: [
                {
                    type: 'scatter',
                    data: scatterData,
                    symbolSize: 8,
                    label: {
                        show: false,
                        formatter: function(params) {
                            return params.name;
                        },
                        position: 'right',
                        fontSize: 10
                    },
                    itemStyle: {
                        color: color
                    }
                },
                {
                    type: 'line',
                    data: regressionLine,
                    symbol: 'none',
                    lineStyle: {
                        color: color,
                        width: 2,
                        type: 'dashed'
                    },
                    z: 10
                }
            ]
        };
        
        charts[chartKey].setOption(option);
    });
}

// 监听窗口大小变化
window.addEventListener('resize', function() {
    Object.values(charts).forEach(chart => chart.resize());
});

// 页面加载完成时初始化图表实例并加载数据
document.addEventListener('DOMContentLoaded', () => {
    // 初始化所有图表实例
    charts.Europe = echarts.init(document.getElementById('europe-chart'));
    charts.Asia = echarts.init(document.getElementById('asia-chart'));
    charts.NorthAmerica = echarts.init(document.getElementById('north-america-chart'));
    charts.SouthAmerica = echarts.init(document.getElementById('south-america-chart'));
    charts.Africa = echarts.init(document.getElementById('africa-chart'));
    charts.Oceania = echarts.init(document.getElementById('oceania-chart'));
    
    loadData();
});