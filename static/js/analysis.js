// 初始化所有图表
let trendChart = echarts.init(document.getElementById('trend-chart'));
let radarChart = echarts.init(document.getElementById('radar-chart'));
let comparisonRadarChart = echarts.init(document.getElementById('comparison-radar'));
let pcaScatterChart = echarts.init(document.getElementById('pca-scatter'));
let trajectoryChart = echarts.init(document.getElementById('trajectory-chart'));

// 存储所有年份的数据
let allData = {};
let currentYear = 2024;

// 属性名称映射
const attributeNameMap = {
    'Happiness Score': '幸福指数',
    'Freedom': '自由',
    'Generosity': '慷慨',
    'Trust (Government Corruption)': '政府信任度',
    'Social support': '社会支持',
    'Dystopia + residual': '反乌托邦',
    'Economy (GDP per Capita)': '人均GDP',
    'Health (Life Expectancy)': '预期寿命'
};

// 定义国家颜色映射
const countryColors = [
    '#5470c6', // 蓝色
    '#91cc75', // 绿色
    '#fac858', // 黄色
    '#ee6666', // 红色
    '#73c0de', // 浅蓝色
    '#3ba272', // 青色
    '#fc8452', // 橙色
    '#9a60b4', // 紫色
    '#ea7ccc'  // 粉色
];

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
    // 获取所有国家列表
    const uniqueCountriesMap = new Map();

    Object.values(allData).forEach(yearData => {
        yearData.forEach(item => {
            const originalEnglishName = item.Country; // 原始英文国家名
            const chineseName = item.Country_Chinese; // 中文国家名

            // 确保国家名存在且不为空
            if (originalEnglishName && originalEnglishName.trim() && chineseName && chineseName.trim()) {
                const standardizedEnglishName = originalEnglishName.trim().toLowerCase(); // 标准化英文名作为Map的键
                const standardizedChineseName = chineseName.trim().toLowerCase(); // 标准化中文名作为Map的键
                // 如果Map中还没有这个标准化后的英文名，或者有但我们希望用最新的中文名覆盖（取决于需求）
                // 这里我们选择第一次出现时记录，后续相同标准化英文名不会覆盖
                if (!uniqueCountriesMap.has(standardizedEnglishName) && !uniqueCountriesMap.has(standardizedChineseName)) {
                    uniqueCountriesMap.set(standardizedChineseName, {
                        name: originalEnglishName.trim(), // 存储原始的、去除了首尾空格的英文名
                        name_zh: chineseName.trim() // 存储中文名
                    });
                }
            }
        });
    });

    // 将Map的值转换为数组并按中文名排序
    const countries = Array.from(uniqueCountriesMap.values()).sort((a, b) => {
        // 使用 localeCompare 进行中文排序
        return a.name_zh.localeCompare(b.name_zh, 'zh-CN', { sensitivity: 'base' });
    });

    // 初始化年份选择器
    const years = Object.keys(allData).sort();
    ['compare-year', 'pca-year'].forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = years.map(year => 
            `<option value="${year}" ${year == currentYear ? 'selected' : ''}>${year}</option>`
        ).join('');
    });

    // 初始化国家选择器
    const countrySelect = document.getElementById('country-select');
    countrySelect.innerHTML = countries.map(country => 
        `<option value="${country.name}">${country.name_zh}</option>`
    ).join('');

    // 初始化多选国家选择器
    const countryMultiSelect = document.getElementById('country-multi-select');
    countryMultiSelect.innerHTML = countries.map(country => 
        `<option value="${country.name}">${country.name_zh}</option>`
    ).join('');

    // 初始化PCA国家选择器
    const pcaCountries = document.getElementById('pca-countries');
    pcaCountries.innerHTML = countries.map(country => 
        `<option value="${country.name}">${country.name_zh}</option>`
    ).join('');

    // 添加事件监听器
    document.getElementById('analysis-type').addEventListener('change', handleAnalysisTypeChange);
    document.getElementById('country-multi-select').addEventListener('change', handleMultiSelectChange);
    document.getElementById('update-charts').addEventListener('click', updateAllAnalysisCharts);

    // 添加年份选择器的change事件
    document.getElementById('compare-year').addEventListener('change', updateAllAnalysisCharts);
    document.getElementById('pca-year').addEventListener('change', updateAllAnalysisCharts);
    
    // 添加国家选择器的change事件
    document.getElementById('country-select').addEventListener('change', updateAllAnalysisCharts);
    document.getElementById('pca-countries').addEventListener('change', updateAllAnalysisCharts);

    // 初始显示第一个模块
    handleAnalysisTypeChange();
}

// 显示分析类型选择
function showAnalysisTypeSelection() {
    // 隐藏所有图表模块
    document.querySelectorAll('.chart-module').forEach(module => {
        module.classList.remove('active');
    });
    
    // 隐藏所有控制部分
    document.querySelectorAll('.control-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示分析类型选择部分
    document.getElementById('analysis-type-section').classList.add('active');
}

// 处理分析类型变化
function handleAnalysisTypeChange() {
    const analysisType = document.getElementById('analysis-type').value;
    
    // 隐藏所有控制部分
    document.querySelectorAll('.control-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 隐藏所有图表模块
    document.querySelectorAll('.chart-module').forEach(module => {
        module.classList.remove('active');
    });
    
    // 显示相应的控制部分和图表模块
    switch(analysisType) {
        case 'time-series-radar':
            document.getElementById('time-series-controls').classList.add('active');
            document.getElementById('module-time-series-radar').classList.add('active');
            break;
        case 'comparison-radar':
            document.getElementById('comparison-controls').classList.add('active');
            document.getElementById('module-comparison-radar').classList.add('active');
            break;
        case 'pca-trajectory':
            document.getElementById('pca-controls').classList.add('active');
            document.getElementById('module-pca-trajectory').classList.add('active');
            break;
    }

    // 更新图表
    updateAllAnalysisCharts();
}

// 处理多选国家变化
function handleMultiSelectChange() {
    const select = document.getElementById('country-multi-select');
    const selectedCountries = Array.from(select.selectedOptions);
    
    // 限制最多选择5个国家
    if (selectedCountries.length > 5) {
        selectedCountries[selectedCountries.length - 1].selected = false;
        alert('最多只能选择5个国家进行对比');
        return;
    }
    
    // 更新已选择国家列表显示
    const selectedList = document.getElementById('selected-countries-list');
    selectedList.innerHTML = selectedCountries.map(option => `
        <span class="selected-country">
            ${option.text}
            <span class="remove" data-value="${option.value}">&times;</span>
        </span>
    `).join('');
    
    // 添加移除按钮事件
    selectedList.querySelectorAll('.remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const option = select.querySelector(`option[value="${value}"]`);
            if (option) option.selected = false;
            handleMultiSelectChange();
        });
    });
}

// 更新所有分析图表
function updateAllAnalysisCharts() {
    const analysisType = document.getElementById('analysis-type').value;
    
    switch(analysisType) {
        case 'time-series-radar':
            updateSingleCountryCharts();
            break;
        case 'comparison-radar':
            updateComparisonParallel();
            break;
        case 'pca-trajectory':
            updatePCAScatter();
            updateTrajectoryChart();
            break;
    }
}

// 更新单个国家时序变化图表
function updateSingleCountryCharts() {
    const country = document.getElementById('country-select').value;
    const selectedCountryChineseName = document.getElementById('country-select').options[document.getElementById('country-select').selectedIndex].text;
    
    const years = Object.keys(allData).sort();
    
    const features = [
        'Happiness Score',
        'Freedom',
        'Generosity',
        'Trust (Government Corruption)',
        'Social support',
        'Dystopia + residual',
        'Economy (GDP per Capita)',
        'Health (Life Expectancy)'
    ];

    // 更新趋势图
    const series = features.map(feature => ({
        name: attributeNameMap[feature],
        type: 'line',
        data: years.map(year => {
            const countryData = allData[year].find(item => item.Country === country);
            return countryData ? parseFloat(countryData[feature]) : null;
        })
    }));

    const trendOption = {
        title: {
            text: `${selectedCountryChineseName} 幸福指数及影响因素趋势`,
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: features.map(f => attributeNameMap[f]),
            type: 'scroll',
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: years
        },
        yAxis: {
            type: 'value',
            name: '分数'
        },
        series: series
    };

    trendChart.setOption(trendOption);

    // 更新堆叠柱状图（替换原来的雷达图）
    const barFeatures = features.filter(f => f !== 'Happiness Score'); // 排除幸福指数
    const barData = barFeatures.map(feature => {
        return {
            name: attributeNameMap[feature],
            type: 'bar',
            stack: 'total',
            emphasis: {
                focus: 'series'
            },
            data: years.map(year => {
                const countryData = allData[year].find(item => item.Country === country);
                return countryData ? parseFloat(countryData[feature]) : 0;
            })
        };
    });

    const barOption = {
        title: {
            text: `${selectedCountryChineseName} 年度特征堆叠分析`,
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                let result = params[0].axisValue + '年<br/>';
                let total = 0;
                params.forEach(param => {
                    const value = param.value;
                    total += value;
                    result += `${param.seriesName}: ${value.toFixed(2)}<br/>`;
                });
                result += `<br/>总分: ${total.toFixed(2)}`;
                return result;
            }
        },
        legend: {
            data: barFeatures.map(f => attributeNameMap[f]),
            type: 'scroll',
            bottom: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: years,
            name: '年份'
        },
        yAxis: {
            type: 'value',
            name: '分数',
            min: 0
        },
        series: barData
    };

    radarChart.setOption(barOption);
}

// 更新国家间对比平行坐标图
function updateComparisonParallel() {
    const year = document.getElementById('compare-year').value;
    const selectedCountries = Array.from(document.getElementById('country-multi-select').selectedOptions).map(option => option.value);
    
    if (selectedCountries.length === 0) {
        comparisonRadarChart.clear();
        comparisonRadarChart.setOption({
            title: { text: `${year}年国家特征对比`, left: 'center' },
            graphic: {
                type: 'text',
                left: 'center',
                top: 'center',
                style: {
                    text: '请选择至少一个国家进行对比',
                    fill: '#999',
                    font: '14px Microsoft YaHei'
                }
            }
        });
        return;
    }

    const features = [
        'Economy (GDP per Capita)',
        'Health (Life Expectancy)',
        'Freedom',
        'Trust (Government Corruption)',
        'Generosity',
        'Social support',
        'Dystopia + residual'
    ];

    // 准备数据
    const data = selectedCountries.map((country, index) => {
        const countryData = allData[year].find(item => item.Country === country);
        if (!countryData) return null;
        
        const values = features.map(feature => parseFloat(countryData[feature]) || 0);
        return {
            name: countryData.Country_Chinese,
            value: values,
            color: countryColors[index % countryColors.length] // 为每个国家分配颜色
        };
    }).filter(Boolean);

    // 计算每个维度的最大值和最小值
    const dimensionRanges = features.map(feature => {
        let min = Infinity;
        let max = -Infinity;
        data.forEach(item => {
            const value = item.value[features.indexOf(feature)];
            min = Math.min(min, value);
            max = Math.max(max, value);
        });
        // 增加一点缓冲
        const range = max - min;
        min = Math.max(0, min - range * 0.05);
        max = max + range * 0.05;
        return [min, max];
    });

    const option = {
        title: {
            text: `${year}年国家特征对比`,
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(param => {
                    const feature = features[param.dimension];
                    result += `${attributeNameMap[feature]}: ${param.value.toFixed(2)}<br/>`;
                });
                return result;
            }
        },
        legend: {
            data: data.map(item => ({
                name: item.name,
                itemStyle: {
                    color: item.color
                }
            })),
            type: 'scroll',
            bottom: 0,
            selectedMode: true,
            textStyle: {
                fontSize: 12
            }
        },
        parallelAxis: features.map((feature, index) => ({
            dim: index,
            name: attributeNameMap[feature],
            nameLocation: 'middle',
            nameGap: 30,
            min: dimensionRanges[index][0],
            max: dimensionRanges[index][1],
            axisLabel: {
                formatter: '{value}'
            }
        })),
        parallel: {
            left: '5%',
            right: '5%',
            bottom: '15%',
            top: '15%',
            parallelAxisDefault: {
                type: 'value',
                nameLocation: 'end',
                nameGap: 20,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisTick: {
                    show: true
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: '#ccc'
                    }
                }
            }
        },
        series: data.map(item => ({
            name: item.name,
            type: 'parallel',
            lineStyle: {
                width: 2,
                color: item.color,
                opacity: 0.8
            },
            data: [{
                name: item.name,
                value: item.value
            }]
        }))
    };

    comparisonRadarChart.setOption(option);
}

// 更新PCA散点图
function updatePCAScatter() {
    const year = document.getElementById('pca-year').value;
    const selectedCountries = Array.from(document.getElementById('pca-countries').selectedOptions).map(option => option.value);
    
    // 过滤数据，只包含选中的国家
    const data = allData[year].filter(item => selectedCountries.includes(item.Country));
    
    if (data.length === 0) {
        pcaScatterChart.clear();
        pcaScatterChart.setOption({
            title: { text: `${year}年国家聚类分析 (PCA)`, left: 'center' },
            graphic: {
                type: 'text',
                left: 'center',
                top: 'center',
                style: {
                    text: '请选择至少一个国家进行分析',
                    fill: '#999',
                    font: '14px Microsoft YaHei'
                }
            }
        });
        return;
    }
    
    // 准备特征数据
    const features = [
        'Happiness Score',
        'Freedom',
        'Generosity',
        'Trust (Government Corruption)',
        'Social support',
        'Dystopia + residual', 
        'Economy (GDP per Capita)', 
        'Health (Life Expectancy)' 
    ];

    // 计算PCA
    const pcaResult = calculatePCA(data, features);

    // 准备散点图数据
    const scatterData = pcaResult.map((point, index) => ({
        name: data[index].Country_Chinese,
        value: [point[0], point[1]],
        happiness: parseFloat(data[index]['Happiness Score'])
    }));

    // 获取 happiness score 的 min/max 用于 visualMap
    const happinessScores = scatterData.map(item => item.happiness);
    const minHappiness = Math.min(...happinessScores);
    const maxHappiness = Math.max(...happinessScores);

    const option = {
        title: {
            text: `${year}年国家聚类分析 (PCA)`,
            left: 'center'
        },
        tooltip: {
            formatter: function(params) {
                return `${params.name}<br/>幸福指数: ${params.data.happiness.toFixed(2)}`;
            }
        },
        xAxis: {
            type: 'value',
            name: '主成分1',
            splitLine: {
                lineStyle: {
                    type: 'dashed'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '主成分2',
            splitLine: {
                lineStyle: {
                    type: 'dashed'
                }
            }
        },
        visualMap: {
            min: minHappiness, // 使用实际数据的最小值
            max: maxHappiness, // 使用实际数据的最大值
            dimension: 'happiness',
            orient: 'horizontal',
            left: 'center',
            bottom: '5%',
            calculable: true,
            inRange: {
                color: ['#e0f3f8', '#2c7fb8'] // 浅蓝到深蓝
            },
            text: ['高', '低']
        },
        series: [{
            type: 'scatter',
            data: scatterData,
            symbolSize: 10,
            label: {
                show: true,
                formatter: function(params) {
                    return params.name;
                },
                position: 'right',
                // 避免标签重叠
                distance: 5,
                fontSize: 10
            },
            emphasis: {
                focus: 'series'
            }
        }]
    };

    pcaScatterChart.setOption(option);
}

// 计算PCA
function calculatePCA(data, features) {
    // 准备数据矩阵，确保每个元素都是数值
    const matrix = data.map(item => 
        features.map(feature => parseFloat(item[feature]))
    );

    // 标准化数据
    const standardized = standardizeMatrix(matrix);

    // 计算协方差矩阵
    const covariance = calculateCovarianceMatrix(standardized);

    // 计算特征值和特征向量 (只取前两个主成分)
    const { eigenvalues, eigenvectors } = powerIteration(covariance, 2);

    // 投影数据
    // 注意：这里的eigenvectors是按行存储的，需要转置以便于矩阵乘法或按列访问
    const principleComponents = eigenvectors.map(vec => {
        const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
        return vec.map(v => v / norm);
    });

    const projectedData = standardized.map(row => {
        const projected = [];
        for (let i = 0; i < 2; i++) { // 对于每个主成分
            let componentSum = 0;
            for (let j = 0; j < row.length; j++) { // 对于每个原始特征
                componentSum += row[j] * principleComponents[i][j]; // 修正矩阵乘法
            }
            projected.push(componentSum);
        }
        return projected;
    });
    return projectedData;
}

// 标准化矩阵
function standardizeMatrix(matrix) {
    if (matrix.length === 0 || matrix[0].length === 0) return [];
    const numRows = matrix.length;
    const numCols = matrix[0].length;

    const means = Array(numCols).fill(0);
    for (let j = 0; j < numCols; j++) {
        for (let i = 0; i < numRows; i++) {
            means[j] += matrix[i][j];
        }
        means[j] /= numRows;
    }

    const stds = Array(numCols).fill(0);
    for (let j = 0; j < numCols; j++) {
        for (let i = 0; i < numRows; i++) {
            stds[j] += Math.pow(matrix[i][j] - means[j], 2);
        }
        stds[j] = Math.sqrt(stds[j] / numRows); // 使用样本标准差 (n)
    }

    // 处理标准差为0的情况，避免除以0
    const standardizedMatrix = matrix.map(row => 
        row.map((val, j) => (stds[j] === 0 ? 0 : (val - means[j]) / stds[j]))
    );
    return standardizedMatrix;
}


// 计算协方差矩阵 (校正为方阵)
function calculateCovarianceMatrix(matrix) {
    if (matrix.length === 0 || matrix[0].length === 0) return [];
    const n = matrix.length; // 样本数
    const p = matrix[0].length; // 特征数
    const cov = Array(p).fill().map(() => Array(p).fill(0));

    for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += matrix[k][i] * matrix[k][j];
            }
            cov[i][j] = sum / (n - 1); // 样本协方差 (n-1)
        }
    }
    return cov;
}

// 幂迭代法计算特征值和特征向量 (修正为一个更稳定的版本)
function powerIteration(matrix, numComponents) {
    const n = matrix.length; // 矩阵维度
    const eigenvalues = [];
    const eigenvectors = [];

    // 创建一个副本，因为我们会修改它
    let currentMatrix = matrix.map(row => [...row]);

    for (let k = 0; k < numComponents; k++) {
        let vector = Array(n).fill().map(() => Math.random());
        let eigenvalue = 0;
        let prevEigenvalue = Infinity;
        let iterations = 0;
        const maxIterations = 500; // 增加迭代次数
        const tolerance = 1e-6; // 调整容忍度

        while (Math.abs(eigenvalue - prevEigenvalue) > tolerance && iterations < maxIterations) {
            // 归一化向量
            const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
            vector = vector.map(val => val / norm);

            // 计算 Av
            const newVector = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    newVector[i] += currentMatrix[i][j] * vector[j];
                }
            }

            // 计算新的特征值 (Rayleigh quotient)
            prevEigenvalue = eigenvalue;
            eigenvalue = vector.reduce((sum, val, i) => sum + val * newVector[i], 0);

            // 更新向量
            vector = newVector;
            iterations++;
        }

        eigenvalues.push(eigenvalue);
        eigenvectors.push(vector.map(val => val / Math.sqrt(vector.reduce((s, v) => s + v * v, 0)))); // 确保特征向量归一化

        // 从矩阵中减去已经找到的成分 (deflation)
        const outerProduct = Array(n).fill().map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                outerProduct[i][j] = eigenvalue * eigenvectors[k][i] * eigenvectors[k][j];
            }
        }
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                currentMatrix[i][j] -= outerProduct[i][j];
            }
        }
    }
    return { eigenvalues, eigenvectors };
}

// 更新轨迹图
function updateTrajectoryChart() {
    const selectedCountries = Array.from(document.getElementById('pca-countries').selectedOptions).map(option => option.value);
    
    if (selectedCountries.length === 0) {
        trajectoryChart.clear();
        trajectoryChart.setOption({
            title: { text: '国家幸福指数排名变化趋势', left: 'center' },
            graphic: {
                type: 'text',
                left: 'center',
                top: 'center',
                style: {
                    text: '请选择至少一个国家进行分析',
                    fill: '#999',
                    font: '14px Microsoft YaHei'
                }
            }
        });
        return;
    }
    
    const years = Object.keys(allData).sort();
    
    // 定义一组颜色，用于为每个国家分配一个颜色
    const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
    
    const series = selectedCountries.map((country, index) => { // 添加 index 参数
        // 收集该国家所有年份的排名数据
        const dataForCountry = years.map(year => {
            const countryData = allData[year].find(item => item.Country === country);
            if (!countryData) return null;
            return {
                value: parseInt(countryData['Happiness Rank']),
                year: year,
                score: parseFloat(countryData['Happiness Score']).toFixed(2)
            };
        }).filter(Boolean);

        // 如果没有数据点，则不显示该系列
        if (dataForCountry.length === 0) {
            return null;
        }

        return {
            name: allData[years[0]].find(item => item.Country === country)?.Country_Chinese || country,
            type: 'line',
            data: dataForCountry.map(d => d.value),
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
                width: 2,
                color: colors[index % colors.length] // 根据索引从颜色数组中选择颜色
            },
            tooltip: {
                formatter: function(params) {
                    const year = dataForCountry[params.dataIndex].year;
                    const score = dataForCountry[params.dataIndex].score;
                    return `${params.seriesName} (${year}年)<br/>排名: ${params.value}<br/>幸福指数: ${score}`;
                }
            }
        };
    }).filter(Boolean);

    const option = {
        title: {
            text: '国家幸福指数排名变化趋势',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: series.map(s => s.name),
            type: 'scroll',
            bottom: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: years,
            name: '年份',
            nameLocation: 'middle',
            nameGap: 30
        },
        yAxis: {
            type: 'value',
            name: '排名',
            inverse: true, // 反转Y轴，使排名1在最上方
            min: 1,
            max: function(value) {
                return Math.ceil(value.max * 1.1); // 增加一点空间
            }
        },
        series: series,
        // 移除 visualMap 或者将其改为仅用于显示颜色范围，不控制系列颜色
        // visualMap: {
        //     show: false,
        //     dimension: 0, // 这一行需要移除，因为我们直接控制 series 的颜色
        //     min: 0,
        //     max: years.length - 1,
        //     inRange: {
        //         color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
        //     }
        // }
    };

    trajectoryChart.setOption(option);
}

// 监听窗口大小变化
window.addEventListener('resize', function() {
    trendChart.resize();
    radarChart.resize();
    comparisonRadarChart.resize();
    pcaScatterChart.resize();
    trajectoryChart.resize();
});

// 页面加载完成时加载数据
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});