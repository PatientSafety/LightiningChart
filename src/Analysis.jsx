import { InfluxDB } from "@influxdata/influxdb-client";
import React, { Component } from "react";
import { ButtonGroup } from "react-bootstrap";

import CanvasJSReact from "./canvasjs.stock.react";
var CanvasJSStockChart = CanvasJSReact.CanvasJSStockChart;

let sliderMin = 0;
let sliderMax = 0;
let playbackSpeed = 1000;

class Analysis extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datetimeFormat: "HH:mm:ss",
      data_spo2: [],
      data_pulse: [],
      data_movement: [],
      isPlaying: false,
      rangeGap: 5 * 60 * 1000 /* Five minutes */,
      numberOfCharts: 3,
      containerHeight: 550,
      chartHeight: 550 / 3 - 50 / 3,
    };
    this.incrementSlider = this.incrementSlider.bind(this);

    this.timer = null;
    this.chartContainerRef = null;
  }

  componentDidMount() {
    this.setChartData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.chartContainerRef) {
      //console.log(this.chartContainerRef.current.clientHeight);
    }
    if (this.props.chartHeight !== prevProps.chartHeight) {
      this.updateChart();
    }
  }

  updateChart(height) {
    // This needs to properly update the chart
    console.log(this.stockChart);
    if (!this.stockChart) return;
    for (let i = 0; i < this.stockChart.charts.length; i++) {
      console.log(this.stockChart.charts[i].height);

      this.stockChart.charts[i].options.height = height;
      console.log("after adjustment");
      console.log(this.stockChart.charts[i].height);
    }
    this.stockChart.render();
  }

  async setChartData() {
    // This needs to be based on report specs
    let startTime = 1561259000;
    let endTime = 1561312800;

    // move these to another file and find a way to prettify
    const querySignalType1 = `from(bucket:"Signals")
|> range(start: ${startTime}, stop: ${endTime})
|> filter(fn: (r) => r["_measurement"] == "signals" and r["signalType"] == "1")
|> keep(columns: ["_time", "_value"])
|> group()
|> sort(columns:["_time"])`;

    const querySignalType2 = `from(bucket:"Signals")
|> range(start: ${startTime}, stop: ${endTime})
|> filter(fn: (r) => r["_measurement"] == "signals" and r["signalType"] == "2")
|> keep(columns: ["_time", "_value"])
|> group()
|> sort(columns:["_time"])`;

    const querySignalType4 = `from(bucket:"Signals")
|> range(start: ${startTime}, stop: ${endTime})
|> filter(fn: (r) => r["_measurement"] == "signals" and r["signalType"] == "4")
|> keep(columns: ["_time", "signalType", "_value"])
|> group()
|> sort(columns:["_time"])`;

    const spo2 = await this.getData(querySignalType1);
    const pulse = await this.getData(querySignalType4);
    const movement = await this.getData(querySignalType2);
    this.setState({
      data_spo2: spo2,
      data_pulse: pulse,
      data_movement: movement,
    });
    sliderMin = new Date(spo2[0]["x"]).getTime();
    sliderMax = new Date(spo2[0]["x"]).getTime() + this.state.rangeGap;
    this.stockChart.navigator.slider.set("minimum", sliderMin);
    this.stockChart.navigator.slider.set("maximum", sliderMax);
  }

  async getData(query) {
    // Todo: Hide these tokens
    let url = "https://eastus-1.azure.cloud2.influxdata.com";
    let token = "EQ5Bv0SLlUTfi4seAdZX8v3GU_egyWsEF11OfyodAVWwTYjr4YoG2W4T_c_0jnRJEntI5DYxuCTqKipK3uHEpQ==";
    let org = "";

    const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
    var arr = [];
    await queryApi.collectRows(query).then((data) => {
      data.forEach((x) => {
        let val = { x: new Date(x._time), y: x._value };
        arr.push(val);
      });
    });

    return arr;
  }

  incrementSlider(direction) {
    let chart = this.stockChart;
    if (chart && direction > 0) {
      sliderMin = chart.navigator.slider.maximum;
      sliderMax = chart.navigator.slider.maximum + this.state.rangeGap;
      chart.navigator.slider.set("minimum", sliderMin);
      chart.navigator.slider.set("maximum", sliderMax);
    }
    if (chart && direction < 0) {
      sliderMin = chart.navigator.slider.minimum - this.state.rangeGap;
      sliderMax = chart.navigator.slider.minimum;
      chart.navigator.slider.set("minimum", sliderMin);
      chart.navigator.slider.set("maximum", sliderMax);
    }

    chart.render();
  }

  nextPage() {
    this.incrementSlider(1);
  }

  previousPage() {
    this.incrementSlider(-1);
  }

  rangeChangeHandler(e) {
    this.setState({
      rangeGap: e.maximum - e.minimum,
    });
  }

  togglePlay() {
    if (!this.state.isPlaying) {
      this.timer = setInterval(this.incrementSlider.bind(this, 1), playbackSpeed);
    } else {
      clearInterval(this.timer);
    }
    this.setState({
      isPlaying: !this.state.isPlaying,
      playDirection: 1,
    });
  }

  toggleRewind() {
    if (!this.state.isPlaying) {
      this.timer = setInterval(this.incrementSlider.bind(this, -1), playbackSpeed);
    }
    this.setState({
      isPlaying: true,
      playDirection: -1,
    });
  }

  increasePlaySpeed() {
    playbackSpeed = playbackSpeed / 2;
    clearInterval(this.timer);
    this.timer = setInterval(this.incrementSlider, playbackSpeed);
  }

  render() {
    var minX = this.state.data_spo2.length > 0 ? new Date(this.state.data_spo2[0]["x"]) : 0;
    var maxX = this.state.data_spo2.length > 0 ? new Date(this.state.data_spo2[this.state.data_spo2.length - 1]["x"]) : 0;
    let eventData = [];
    this.state.data_spo2.forEach((point, index) => {
      if (point["y"] < 92) {
        eventData.push({ y: [80, 85], x: this.state.data_spo2[index]["x"] });
      }
    });
    console.log(this.state);
    const options = {
      rangeChanged: this.rangeChangeHandler.bind(this),
      charts: [
        //SpO2 chart
        {
          height: this.state.chartHeight,
          backgroundColor: "#dde9f0",
          // zoomEnabled: false,
          // zoomType: "x",
          legend: {
            horizontalAlign: "left",
            verticalAlign: "center",
            cursor: "pointer",
            fontSize: 30,
            itemTextFormatter: () => {
              return "Yellowerrrr";
            },
          },
          axisY: {
            title: "SpO2",
            minimum: 70,
            maximum: 100,
            labelTextAlign: "left",
          },
          axisX: {
            labelFormatter: function () {
              return " ";
            },
          },
          data: [
            {
              type: "line",
              color: "#d3f0d9",
              dataPoints: [
                { x: minX, y: 97.4 },
                { x: maxX, y: 97.4 },
              ],
            },
            {
              type: "line",
              color: "#2ea38e",
              xValueFormatString: this.state.datetimeFormat,
              toolTipContent: "SpO2: {y} <br> {x}, ",
              fillOpacity: 0.8,
              dataPoints: this.state.data_spo2,
            },
          ],
        },
        //Pulse Chart
        {
          height: this.state.chartHeight,
          // zoomEnabled: true,
          backgroundColor: "#dde9f0",
          // zoomType: 'x',
          axisY: {
            title: "Pulse",
            minimum: 50,
            maximum: 100,
            labelTextAlign: "left",
          },
          axisX: {
            labelFormatter: function () {
              return " ";
            },
          },
          data: [
            {
              type: "line",
              color: "#e9c46a",
              xValueFormatString: this.state.datetimeFormat,
              toolTipContent: "Pulse: {y} <br> {x}, ",
              dataPoints: this.state.data_pulse,
            },
          ],
        },
        {
          //Movement Chart
          height: this.state.chartHeight,
          zoomEnabled: true,
          backgroundColor: "#dde9f0",
          zoomType: "x",
          axisY: {
            title: "Movement",
            labelTextAlign: "left",
            minimum: 0,
            maximum: 5,
          },
          axisX: {
            labelFormatter: function () {
              return " ";
            },
          },
          data: [
            {
              type: "line",
              color: "#e76f51",
              xValueFormatString: this.state.datetimeFormat,
              toolTipContent: "Movements: {y} <br> {x}, ",
              dataPoints: this.state.data_movement,
            },
          ],
        },
      ],
      rangeSelector: {
        enabled: false,
      },
      navigator: {
        verticalAlign: "bottom",
        height: 50,
        axisY: {
          title: "SpO2",
          minimum: 85,
          maximum: 100,
          labelTextAlign: "left",
        },
        slider: {
          minimun: sliderMin,
          maximum: sliderMax,
        },
        data: [
          {
            type: "line",
            color: "#264653",
            fillOpacity: 0.8,
            dataPoints: this.state.data_spo2,
          },
        ],
      },
    };

    const containerProps = {
      margin: "auto",
      height: this.state.containerHeight,
      dynamicUpdate: false,
    };
    return (
      <div style={{ backgroundColor: "white", width: "100%", height: "100%" }} ref={this.chartContainerRef}>
        <CanvasJSStockChart options={options} containerProps={containerProps} onRef={(ref) => (this.stockChart = ref)} />
        <div className="row d-flex align-items-center justify-content-center">
          <div className="col-2"></div>
          <div className="col-8">
            <ButtonGroup className="list-group-item p-0 rounded text-center border-0">
              <button className={"btn btn-sm border"} onClick={this.previousPage.bind(this)} title="Page Back">
                <i className="fa-regular fa-angle-left"></i>
              </button>
              <button className={"btn btn-sm border"} title="Rewind" onClick={this.toggleRewind.bind(this)}>
                <i className="fa-regular fa-backward-fast"></i>
              </button>
              {!this.state.isPlaying && (
                <button className={"btn btn-sm border"} title="Play" onClick={this.togglePlay.bind(this)}>
                  <i className="fa-regular fa-play"></i>
                </button>
              )}
              {this.state.isPlaying && (
                <button className={"btn btn-sm border"} title="Pause" onClick={this.togglePlay.bind(this)}>
                  <i className="fa-regular fa-pause"></i>
                </button>
              )}
              <button className={"btn btn-sm border"} title="Fast Forward" onClick={this.increasePlaySpeed.bind(this)}>
                <i className="fa-regular fa-forward-fast"></i>
              </button>
              <button className={"btn btn-sm border"} onClick={this.nextPage.bind(this)} title="Page Forward">
                <i className="fa-regular fa-angle-right"></i>
              </button>
            </ButtonGroup>
          </div>
          <div className="col-2 d-flex justify-content-center">
            <div className="border border-rounded">
              <span className="d-flex justify-content-end align-items-center" style={{ fontSize: 10, padding: 5 }}>
                {Math.round(this.state.rangeGap / 1000 / 60)} Minute View
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Analysis;
