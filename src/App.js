import { useEffect, useState, useCallback } from "react";
import logo from "./logo.svg";
import "./App.css";
import { InfluxDB } from "@influxdata/influxdb-client";
import ChartComponent from "./ChartComponent";

let sliderMin = 0;
let sliderMax = 0;
let playbackSpeed = 1000;

function App() {
  const datetimeFormat = "HH:mm:ss";
  const [data_spo2, setDataSpo2] = useState([]);
  const [data_pulse, setDataPulse] = useState([]);
  const [data_movement, setDataMovement] = useState([]);
  const [rangeGap, setRangeGap] = useState(5 * 60 * 1000);
  const [numberOfCharts, setNumberOfCharts] = useState(3);
  const [containerHeight, setContainerHeight] = useState(550);
  const [chartHeight, setChartHeight] = useState(550 / 3 - 50 / 3);

  const updateChart = (height) => {
    // This needs to properly update the chart
    if (!this.stockChart) return;
    for (let i = 0; i < this.stockChart.charts.length; i++) {
      console.log(this.stockChart.charts[i].height);

      this.stockChart.charts[i].options.height = height;
      console.log("after adjustment");
      console.log(this.stockChart.charts[i].height);
    }
    this.stockChart.render();
  };

  const setChartData = useCallback(async () => {
    if (!rangeGap) return;
    // This needs to be based on report specs
    let startTime = 1561259000;
    let endTime = 1561272800;

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
    const spo2 = await getData(querySignalType1);
    const pulse = await getData(querySignalType4);
    const movement = await getData(querySignalType2);
    console.log(pulse);
    setDataSpo2(spo2);
    setDataMovement(movement);
    setDataPulse(pulse);
    sliderMin = new Date(spo2[0]["x"]).getTime();
    sliderMax = new Date(spo2[0]["x"]).getTime() + rangeGap;
    // this.stockChart.navigator.slider.set("minimum", sliderMin);
    // this.stockChart.navigator.slider.set("maximum", sliderMax);
  }, [rangeGap]);

  const getData = async (query) => {
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
    console.log(arr);
    return arr;
  };

  useEffect(() => {
    console.log(rangeGap);
    setChartData();
  }, [setChartData]);

  const incrementSlider = (direction) => {
    let chart = this.stockChart;
    if (chart && direction > 0) {
      sliderMin = chart.navigator.slider.maximum;
      sliderMax = chart.navigator.slider.maximum + rangeGap;
      chart.navigator.slider.set("minimum", sliderMin);
      chart.navigator.slider.set("maximum", sliderMax);
    }
    if (chart && direction < 0) {
      sliderMin = chart.navigator.slider.minimum - rangeGap;
      sliderMax = chart.navigator.slider.minimum;
      chart.navigator.slider.set("minimum", sliderMin);
      chart.navigator.slider.set("maximum", sliderMax);
    }

    chart.render();
  };

  const nextPage = () => {
    this.incrementSlider(1);
  };

  const previousPage = () => {
    this.incrementSlider(-1);
  };

  const rangeChangeHandler = (e) => {
    this.setState({
      rangeGap: e.maximum - e.minimum,
    });
  };

  const togglePlay = () => {
    if (!this.state.isPlaying) {
      this.timer = setInterval(this.incrementSlider.bind(this, 1), playbackSpeed);
    } else {
      clearInterval(this.timer);
    }
    this.setState({
      isPlaying: !this.state.isPlaying,
      playDirection: 1,
    });
  };

  const toggleRewind = () => {
    if (!this.state.isPlaying) {
      this.timer = setInterval(this.incrementSlider.bind(this, -1), playbackSpeed);
    }
    this.setState({
      isPlaying: true,
      playDirection: -1,
    });
  };

  const increasePlaySpeed = () => {
    playbackSpeed = playbackSpeed / 2;
    clearInterval(this.timer);
    this.timer = setInterval(this.incrementSlider, playbackSpeed);
  };
  return (
    <>
      <ChartComponent
        data={{
          data_movement,
          data_pulse,
          data_spo2,
        }}
      />
    </>
  );
}

export default App;
