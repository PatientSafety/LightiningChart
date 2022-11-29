import React, { useState, useEffect, useCallback } from "react";
const lcjs = require("@arction/lcjs");

const studyId = "142";
const {
  lightningChart,
  ColorPalettes,
  ColorRGBA,
  SolidFill,
  SolidLine,
  emptyLine,
  emptyFill,
  AxisTickStrategies,
  LegendBoxBuilders,
  UIOrigins,
  UIElementBuilders,
  UILayoutBuilders,
  AxisScrollStrategies,
  UIDraggingModes,
  Themes,
} = lcjs;

let sliderMin = 0;
let sliderMax = 0;
let playbackSpeed = 1000;

const palette = ColorPalettes.arction(10);
const colors = [6, 9, 0].map(palette);
const axisYColors = [colors[0], colors[1]];
const axisYStyles = axisYColors.map((color) => new SolidFill({ color }));
const axisYStrokeStyles = axisYStyles.map((fillStyle) => new SolidLine({ fillStyle, thickness: 2 }));
const axisYStylesHighlight = axisYStyles.map((fillStyle) => fillStyle.setA(100));
const axisXStyleHighlight = new SolidFill({ color: colors[2].setA(100) });
const seriesStrokeStyles = axisYStrokeStyles;
const fittingRectangleStrokeStyle = new SolidLine({ fillStyle: new SolidFill({ color: ColorRGBA(255, 255, 255, 100) }), thickness: 2 });
const zoomingRectangleFillStyle = new SolidFill({ color: colors[2].setA(100) });

function Charts() {
  const [studyData, setStudyData] = useState(null);
  const [studySignals, setStudySignals] = useState([]);
  const [signalsData, setSignalsData] = useState(null);
  const [interval, setInterval] = useState({});
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const loadStudyData = () => {
    fetch(`https://legacy-sleepscreen-v3.azurewebsites.net/sleepstudy/api/sleepstudyheaderinfo?sleepStudyId=${studyId}`)
      .then((response) => response.json())
      .then((result) => {
        setStudyData(result);
      });
  };

  const loadStudySignals = () => {
    fetch(`https://legacy-sleepscreen-v3.azurewebsites.net/sleepstudy/api/sleepstudysignals?sleepstudyid=${studyId}`)
      .then((response) => response.json())
      .then((result) => setStudySignals(result));
  };

  const loadSignalsData = useCallback(
    (interval) => {
      if (!studySignals.length) return;
      const l = studySignals.length;
      const data = {};
      studySignals.forEach((signal) => {
        fetch(`https://legacy-sleepscreen-v3.azurewebsites.net/sleepstudy/api/signalsegments?minimumSampleRate=10&signalId=${signal.SignalId}&startTime=${interval.start}&endTime=${interval.end}`)
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            data[signal.SignalId] = { data: result.reduce((accumulator, currentValue) => accumulator.concat(currentValue.Points), []), type: signal.Type };
            if (Object.keys(data).length === l) setSignalsData(data);
          });
      });
    },
    [studySignals]
  );

  const loadEvents = useCallback(
    (interval) => {
      if (!studySignals.length) return;
      const l = studySignals.length;
      const data = {};
      studySignals.forEach((signal) => {
        fetch(`https://legacy-sleepscreen-v3.azurewebsites.net/sleepstudy/api/signalsleepevents?signalId=${signal.SignalId}&startTime=${interval.start}&endTime=${interval.end}`)
          .then((response) => response.json())
          .then((result) => {
            data[signal.SignalId] = result.reduce(
              (accumulator, currentValue) =>
                accumulator.concat({
                  start: currentValue.StartTime,
                  end: currentValue.EndTime,
                  type: currentValue.Type,
                  y: parseFloat(currentValue.CustomCharacteristics["Highest Value"] || currentValue.CustomCharacteristics["Top Value"]),
                }),
              []
            );

            //console.log(result);
            if (Object.keys(data).length === l) setEvents(data);
          });
      });
    },
    [studySignals]
  );

  const drawCharts = useCallback(() => {
    if (!interval || !signalsData) return;

    const dateOrigin = new Date(interval.start);
    const dateOriginTime = dateOrigin.getTime();
    const chartNumber = Object.keys(signalsData).length;
    const dashboard = lightningChart().Dashboard({
      theme: Themes.lightNew,
      numberOfColumns: 1,
      container: "chartContainer",
      numberOfRows: 3 * chartNumber + 5,
      height: chartNumber * 300 + 300,
    });
    const xAxisList = [];
    const chartList = [];
    let i = 0;
    Object.keys(signalsData).forEach((signalId) => {
      const chart = dashboard
        .createChartXY({
          columnIndex: 0,
          columnSpan: 1,
          rowIndex: i * 3,
          rowSpan: 3,
          theme: Themes.lightNew,
        })
        .setPadding({
          right: 50,
        })
        .setTitle(signalsData[signalId].type)
        .setFittingRectangleStrokeStyle(fittingRectangleStrokeStyle)
        .setZoomingRectangleFillStyle(zoomingRectangleFillStyle);

      xAxisList[i] = chart
        .getDefaultAxisX()
        .setOverlayStyle(axisXStyleHighlight)
        .setNibOverlayStyle(axisXStyleHighlight)
        // Set the X Axis to use DateTime TickStrategy
        .setScrollStrategy(undefined)
        .setTickStrategy(
          // Use DateTime TickStrategy for this Axis
          AxisTickStrategies.DateTime,
          // Modify the DateOrigin of the TickStrategy
          (tickStrategy) => tickStrategy.setDateOrigin(dateOrigin)
        )
        .setInterval(0, 150)
        // Set view to 1 minute.
        .setAnimationScroll(false);

      // Style the default Y Axis.
      const axisY = chart
        .getDefaultAxisY()
        .setStrokeStyle(axisYStrokeStyles[0])
        .setOverlayStyle(axisYStylesHighlight[0])
        .setNibOverlayStyle(axisYStylesHighlight[0])
        .setInterval(0, 100)
        .setTickStrategy(
          // Use Numeric TickStrategy as base.
          AxisTickStrategies.Numeric,
          // Use mutator to modify the TickStrategy.
          (tickStrategy) =>
            tickStrategy
              // Modify Major Tick Style by using a mutator.
              .setMajorTickStyle((tickStyle) => tickStyle.setGridStrokeStyle(emptyLine))
          // Modify Minor Tick Style by using a mutator.
        )
        .setScrollStrategy(AxisScrollStrategies.regressive);
      // Modify the TickStrategy to remove gridLines from this Y Axis.
      const splineSeries1 = chart.addLineSeries({
        xAxis: xAxisList[i],
        yAxis: axisY,
      });

      if (i === 0) {
        // axisY.onScaleChange((start, end) => {
        //   for (let i = 1; i < l; i++) {
        //     console.log(start, end);
        //   }
        // });
        axisY.setInterval(-10, 200);
        const zoomBandChart = dashboard.createZoomBandChart({
          columnIndex: 0,
          theme: Themes.glacier,
          columnSpan: 1,
          rowIndex: Object.keys(signalsData).length * 3,
          rowSpan: 2,
          // Specify the Axis for the Zoom Band Chart to follow.
          // The Zoom Band Chart will imitate all Series present in that Axis.
          axis: chart.getDefaultAxisX(),
        });
        zoomBandChart.setPadding(20);
        zoomBandChart.setBackgroundStrokeStyle(
          new SolidLine({
            color: ColorRGBA(255, 0, 0),
          })
        );
        zoomBandChart.band.setValueStart(0);
        zoomBandChart.band.setValueEnd(signalsData[signalId].data.length * 300);
      }
      splineSeries1.add(signalsData[signalId].data.map((point, i) => ({ x: i * 1000, y: point })));
      axisY.setInterval(splineSeries1.getYMin() - 30, splineSeries1.getYMax() + 60, true, true);

      if (events[signalId] && events[signalId].length) {
        const rectangles = chart.addRectangleSeries();

        let y = 0;

        const figureHeight = 25;
        const figureThickness = 20;
        const figureGap = figureThickness * 0.5;
        const fitAxes = () => {
          // Custom fitting for some additional margins
          //axisY.setInterval(y, figureHeight * 0.5);
        };
        const t = i;
        let customYRange = figureHeight + figureGap * 1.6;
        const addCategory = (category) => {
          const categoryY = y;
          const addSpan = (i, min, max, index) => {
            // Add rect
            const rectDimensions = {
              x: min,
              y: category - figureHeight,
              width: max - min,
              height: figureHeight,
            };
            // Add element for span labels
            const spanText = chart
              .addUIElement(UILayoutBuilders.Row, { x: xAxisList[t], y: axisY })
              .setOrigin(UIOrigins.Center)
              .setDraggingMode(UIDraggingModes.notDraggable)
              .setPosition({
                x: (min + max) / 2,
                y: rectDimensions.y + 15,
              })
              .setBackground((background) => background.setFillStyle(emptyFill).setStrokeStyle(emptyLine));

            spanText.addElement(
              UIElementBuilders.PointableTextBox.addStyler((textBox) =>
                textBox
                  .setTextFont((fontSettings) => fontSettings.setSize(13))
                  .setText(events[signalId][i].type)
                  .setTextFillStyle(new SolidFill().setColor(ColorRGBA(25, 25, 25)))
                  .setDirection(lcjs.UIDirections.Left)
              )
            );

            fitAxes();
            // Return figure
            return rectangles.add(rectDimensions);
          };

          // Add custom tick for category

          y -= figureHeight * 1.5;

          fitAxes();
          // Return interface for category.
          return {
            addSpan,
          };
        };
        const categories = events[signalId].map((t) => addCategory(t.y));
        const colorPalette = ColorPalettes.flatUI(categories.length);
        const fillStyles = categories.map((_, i) => new SolidFill({ color: ColorRGBA(0, 0, 0, 0) }));
        const strokeStyle = new SolidLine({
          fillStyle: new SolidFill({ color: ColorRGBA(0, 0, 0, 0) }),
          thickness: 1,
        });

        let index = 0;
        //const start = props.data.data_pulse[0] ? (props.data.data_pulse[0].x.getTime() - dateOriginTime) / 1000 : 0;
        events[signalId].forEach((event, i) => {
          const start = new Date(event.start).getTime() - dateOriginTime;
          const end = new Date(event.end).getTime() - dateOriginTime;
          categories[i].addSpan(i, start, end, index).setFillStyle(fillStyles[i]).setStrokeStyle(strokeStyle);
        });
      }

      i++;
    });
    setLoading(false);
    const l = xAxisList.length;

    xAxisList[0].onScaleChange((start, end) => {
      for (let i = 1; i < l; i++) {
        xAxisList[i].setInterval(start, end, false, true);
      }
    });
    xAxisList[0].setInterval(-1900, 311000);
    setSignalsData(null);
  }, [signalsData, interval]);

  useEffect(() => {
    loadStudyData();
    loadStudySignals();
  }, []);

  useEffect(() => {
    if (studyData && studySignals.length) {
      if (interval.start) return;
      const newInterval = { start: studySignals[0].StartTime, end: studySignals[0].EndTime };
      setInterval(newInterval);
      loadSignalsData(newInterval);
      loadEvents(newInterval);
    }
  }, [studyData, studySignals, loadSignalsData, loadEvents, interval.start]);

  useEffect(() => {
    if (signalsData) drawCharts();
  }, [signalsData, drawCharts]);

  return (
    <>
      {loading && <img style={{ margin: "100px auto", display: "block" }} id="loading-image" src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Loading_2.gif?20170503175831" alt="Loading..." />}
      <div style={{ minHeight: "600px" }} id="chartContainer"></div>
    </>
  );
}

export default Charts;
