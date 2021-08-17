const app = new Vue({
    el: '#app',
    components: {
        apexchart: VueApexCharts,
    },
    data: {
        values: [110, 88, 78, 89, 82, 80, 76, 78, 76, 70],
        presets: [],
        weight: {
            "2": [30, 70],
            "3": [10, 30, 60],
            "4": [10, 20, 30, 40],
            "5": [5, 15, 20, 25, 35],
            "6": [4, 8, 13, 20, 25, 30],
            "7": [1, 5, 7, 12, 20, 25, 30],
            "8": [3, 6, 9, 10, 12, 15, 20, 25],
            "9": [1, 3, 6, 8, 10, 12, 15, 20, 25],
            "10": [1, 2, 4, 6, 8, 10, 12, 15, 20, 22]
        },
        flag: false,
        alpha: 0.2,
        phantom: [],
        simpleValues: [],
        mobileValues: [],
        exponentialValues: [],
        N: 3,
        forecast: 2,
        isChartVisible: false,
        series: [],
        chartOptions: {
            chart: {
                type: 'line',
                shadow: {
                    enabled: true,
                    color: '#000',
                    top: 18,
                    left: 7,
                    blur: 10,
                    opacity: 1
                },
                toolbar: {
                    show: true,
                }
            },
            colors: ['#545454', '#77B6EA', '#77ea77', '#fa5959'],
            dataLabels: {
                enabled: true,
            },
            stroke: {
                curve: 'straight'
            },
            title: {
                text: 'Прогнозирование',
                align: 'left',
                style: {
                    fontSize: '20px',
                }
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                },
            },
            markers: {
                size: 6
            },
            xaxis: {
                categories: this.horizontal,
                title: {
                    text: 'Момент времени',
                    style: {
                        fontSize: '14px',
                    }
                },
            },
            yaxis: {
                title: {
                    text: 'Объемы в у.е.',
                    style: {
                        fontSize: '14px',
                    }
                },
                forceNiceScale: true,
            },
            legend: {
                position: 'right',
                horizontalAlign: 'right',
                floating: false,
                offsetY: 0,
                offsetX: 0
            }
        }
    },
    created: function () {
        for (let i = 0; i < localStorage.length; i++) {
            this.presets.push(localStorage.key(i));
        }
        this.result();
    },
    methods: {
        result: function () {
            this.flag = true;
            this.simpleValues = [];
            this.mobileValues = [];
            this.exponentialValues = [];
            this.phantom = [];
            this.phantom = [...this.values];
            let arr = new Array(this.N).fill(null);
            this.simpleValues = [...arr];
            this.mobileValues = [...arr];

            //Метод простого скользящего среднего
            let avgSimple = 0;
            for (let i = 0; i < this.values.length - this.N + this.forecast; i++) {
                for (let j = i; j < i + this.N; j++) {
                    avgSimple += this.phantom[j];
                }
                this.simpleValues.push(Number((avgSimple / this.N).toFixed(3)));
                if (this.phantom.length < this.simpleValues.length)
                    this.phantom.push(this.simpleValues[this.simpleValues.length - 1]);
                avgSimple = 0;
            }


            //Метод взвешенного скользящего среднего
            this.exponentialValues.push(this.simpleValues[this.simpleValues.length - 1]);

            this.phantom = [];
            this.phantom = [...this.values];
            let curMobile = 0;

            for (let i = 0; i < this.values.length - this.N + this.forecast; i++) {
                curMobile = 0;
                for (let j = i; j < i + this.N; j++) {
                    avgSimple += this.phantom[j] * this.weight[this.N][curMobile];
                    curMobile++;
                }
                this.mobileValues.push(Number((avgSimple / 100).toFixed(3)));
                if (this.phantom.length < this.mobileValues.length)
                    this.phantom.push(this.mobileValues[this.mobileValues.length - 1]);
                avgSimple = 0;
            }

            //Метод экспоненциального сглаживания
            this.phantom = [];
            this.phantom = [...this.values];

            for (let i = 0; i < this.values.length + this.forecast - 1; i++) {
                this.exponentialValues.push(Number((this.exponentialValues[i] + this.alpha * (this.phantom[i] - this.exponentialValues[i])).toFixed(3)));
                if (this.phantom.length < this.exponentialValues.length)
                    this.phantom.push(this.simpleValues[this.exponentialValues.length - 1])
            }

            this.series = [{
                name: 'Исходные данные',
                data: [...this.values],
            }, {
                name: 'Метод простого скользящего среднего',
                data: [...this.simpleValues]
            }, {
                name: 'Метод взвешенного скользящего среднего',
                data: [...this.mobileValues]
            }, {
                name: 'Метод экспоненциального сглаживания',
                data: [...this.exponentialValues]
            }];
            this.isChartVisible = true;
        },
        save: function () {
            let presetName = prompt("Введите название пресета: ");
            if (presetName != null) {
                let presetDate = new Date(Date.now()).toLocaleDateString("ru-RU");
                let presetTime = new Date(Date.now()).toLocaleTimeString("ru-RU");
                localStorage.setItem(presetName + ' - ' + presetDate + ' ' + presetTime, JSON.stringify(this.$data));
                this.presets = [];
                for (let i = 0; i < localStorage.length; i++) {
                    this.presets.push(localStorage.key(i));
                }
            }
        },
        exportJSON: function () {
            let json = JSON.stringify(localStorage);
            download(json, 'data.json', 'application/json');
        },
        exportCSV: function () {
            let exportData = [];
            let values = ["Values"];
            values.push(...this.values);
            let simple = ["Simple values"];
            simple.push(...this.simpleValues);
            let mobile = ["Mobile values"];
            mobile.push(...this.mobileValues);
            let exponential = ["Exponential values"];
            exponential.push(...this.exponentialValues);
            exportData.push(values);
            exportData.push(simple);
            exportData.push(mobile);
            exportData.push(exponential);

            let csvString = '"sep=|"\r\n';
            exportData.forEach(function (RowItem, RowIndex) {
                RowItem.forEach(function (ColItem, ColIndex) {
                    if (ColItem != null)
                        csvString += ColItem.toLocaleString() + '|';
                    else
                        csvString += "" + "|";
                });
                csvString += '\r\n';
            });

            csvString = "data:application/csv," + encodeURIComponent(csvString);
            let x = document.createElement("a");
            x.setAttribute("href", csvString);
            x.setAttribute("download", "data.csv");
            document.body.appendChild(x);
            x.click();
        },
        showFile: function (e) {
            parse(e.target.files[0]).then(() => {
                this.presets = [];
                for (let i = 0; i < localStorage.length; i++) {
                    this.presets.push(localStorage.key(i));
                }
            })
        },
        storageLoad: function (index) {
            this.values = [];
            this.values = JSON.parse(localStorage.getItem(this.presets[index])).values;
            this.N = JSON.parse(localStorage.getItem(this.presets[index])).N;
            this.forecast = JSON.parse(localStorage.getItem(this.presets[index])).forecast;
            this.alpha = JSON.parse(localStorage.getItem(this.presets[index])).alpha;
            this.presets = [];
            for (let i = 0; i < localStorage.length; i++) {
                this.presets.push(localStorage.key(i));
            }
            this.result();
        },
        storageDelete: function (index) {
            localStorage.removeItem(this.presets[index]);
            this.presets = [];
            for (let i = 0; i < localStorage.length; i++) {
                this.presets.push(localStorage.key(i));
            }
            this.result();
        },
        deleteOne: function (index) {
            this.flag = false;
            this.values.splice(index, 1);
        },
        addOne: function () {
            this.flag = false;
            this.values.push(0);
        },
        checkAlpha: function () {
            if (this.alpha > 1) this.alpha = 1;
            if (this.alpha < 0.01) this.alpha = 0.01;
        },
        checkN: function () {
            if (this.N > 10) this.N = 10;
            if (this.N < 2) this.N = 2;
        },
        checkCount: function () {
            if (this.forecast > 10) this.forecast = 10;
            if (this.forecast < 1) this.forecast = 1;
        },
        checkInput: function (index) {
            if (this.values[index] < 0) this.values.splice(index, 1, 0);
        }
    }
})

function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

async function parse(file) {
    const reader = new FileReader();
    const result = await new Promise((resolve, reject) => {
        reader.onload = function (event) {
            let parsedJSON = JSON.parse(reader.result);
            Object.keys(parsedJSON).forEach(function (k) {
                localStorage.setItem(k, parsedJSON[k]);
            });
            resolve(reader.result)
        }
        reader.readAsText(file);
    })
}