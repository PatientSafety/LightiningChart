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
  UIVisibilityModes,
  UIOrigins,
  UIElementBuilders,
  UILayoutBuilders,
  AxisScrollStrategies,
  FontSettings,
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
      .then((result) => setStudySignals(result.slice(0, 6)));
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
            data[signal.SignalId] = { data: result.reduce((accumulator, currentValue) => accumulator.concat(currentValue.Points), []), type: signal.Type + " " + signal.Specification };
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
      height: 1100,
      margin: { top: 50 },
    });
    dashboard.setSplitterStyle(emptyLine);
    const xAxisList = [];
    const chartList = [];
    let i = 0;
    Object.keys(signalsData).forEach((signalId) => {
      const chart = dashboard
        .createChartXY({
          columnIndex: 0,
          columnSpan: 1,
          rowIndex: i * 3,
          rowSpan: 4 + (i === chartNumber - 1 ? 1 : 0),
          theme: Themes.lightNew,
          defaultAxisX: {
            opposite: i === 0,
          },
        })
        .setTitleFont((font) => font.setSize(10))
        .setPadding({
          right: 50,
          left: 0,
          top: 30,
          bottom: 20,
          //bottom: i === 0 ? 0 : -30,
        })

        .setTitle("")
        .setTitleMarginTop(0)
        .setFittingRectangleStrokeStyle(fittingRectangleStrokeStyle)
        .setZoomingRectangleFillStyle(zoomingRectangleFillStyle)
        .setMouseInteractionWheelZoom(false);

      if (i === 0 || i === chartNumber - 1) {
        xAxisList[i] = chart
          .getDefaultAxisX()

          .setOverlayStyle(axisXStyleHighlight)
          .setMouseInteractions(false)
          .setNibOverlayStyle(axisXStyleHighlight)
          // Set the X Axis to use DateTime TickStrategy
          .setScrollStrategy(undefined)
          .setTickStrategy(
            // Use DateTime TickStrategy for this Axis
            AxisTickStrategies.DateTime,
            // Modify the DateOrigin of the TickStrategy
            (tickStrategy) => tickStrategy.setDateOrigin(dateOrigin)
          );
      } else {
        xAxisList[i] = chart
          .getDefaultAxisX()

          .setOverlayStyle(axisXStyleHighlight)
          .setNibOverlayStyle(axisXStyleHighlight)
          // Set the X Axis to use DateTime TickStrategy
          .setScrollStrategy(undefined)
          .setTickStrategy(
            // Use DateTime TickStrategy for this Axis
            AxisTickStrategies.Empty
            // Modify the DateOrigin of the TickStrategy
          )
          .setInterval(0, 150)
          // Set view to 1 minute.
          .setAnimationScroll(false);
      }
      //chart.setTickMarkerYVisibility(UIVisibilityModes.never);

      // Style the default Y Axis.
      const axisY = chart
        .getDefaultAxisY()
        .setStrokeStyle(axisYStrokeStyles[0])
        .setTitle(signalsData[signalId].type.slice(0, 20))
        .setOverlayStyle(axisYStylesHighlight[0])
        .setNibOverlayStyle(axisYStylesHighlight[0])
        .setInterval(0, 100)
        .setTitleFont(
          new FontSettings({
            size: 11,
            family: "Arial, Helvetica, sans-serif",
            weight: "bold",
            style: "italic",
          })
        )
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
      const customTick = axisY
        .addCustomTick()
        .setTickLength(70)
        .setTextFormatter((position, customTick) => "");
      // Modify the TickStrategy to remove gridLines from this Y Axis.
      const splineSeries1 = chart.addLineSeries({
        xAxis: xAxisList[i],
        yAxis: axisY,
      });

      if (i === 0) {
        axisY.setInterval(-10, 200);
        const zoomBandChart = dashboard.createZoomBandChart({
          columnIndex: 0,
          theme: Themes.glacier,
          columnSpan: 1,
          rowIndex: Object.keys(signalsData).length * 3,
          rowSpan: 4,
          // Specify the Axis for the Zoom Band Chart to follow.
          // The Zoom Band Chart will imitate all Series present in that Axis.
          axis: chart.getDefaultAxisX(),
        });
        zoomBandChart.setPadding(20);
        zoomBandChart.band.setStrokeStyle(
          new SolidLine({
            thickness: 2,
            fillStyle: new SolidFill({ color: ColorRGBA(0, 255, 0) }),
          })
        );
        zoomBandChart.setBackgroundStrokeStyle(
          new SolidLine({
            color: ColorRGBA(255, 0, 0),
          })
        );
        zoomBandChart.band.setHighlighted(true);
        zoomBandChart.band.setValueStart(0);
        zoomBandChart.band.setValueEnd(signalsData[signalId].data.length * 10);
      }
      splineSeries1.add(signalsData[signalId].data.map((point, i) => ({ x: i * 100, y: point })));
      const min = splineSeries1.getYMin() - 30;
      const max = splineSeries1.getYMax() + 50;
      const diff = max - min;
      axisY.setInterval(min, max, true, true);

      if (events[signalId] && events[signalId].length) {
        const rectangles = chart.addRectangleSeries();
        const pols = chart.addPolygonSeries();

        let y = 0;

        const figureHeight = 15;
        const figureThickness = 5;
        const figureGap = figureThickness * 0.5;
        const fitAxes = () => {
          // Custom fitting for some additional margins
          //axisY.setInterval(y, figureHeight * 0.5);
        };
        const t = i;
        let customYRange = figureHeight + figureGap * 1.6;
        const addCategory = (y) => {
          const addSpan = (i, min, max, index) => {
            // Add rect
            const rectDimensions = {
              x: min,
              y: y - figureHeight,
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
              UIElementBuilders.TextBox.addStyler((textBox) =>
                textBox
                  .setTextFont((fontSettings) => fontSettings.setSize(15))
                  .setText(events[signalId][i].type)
                  .setTextFillStyle(new SolidFill().setColor(ColorRGBA(255, 255, 255)))
              )
            );

            fitAxes();
            return pols.add([
              { x: min, y: y - figureHeight },
              { x: max, y: y - figureHeight },
              { x: max, y: y + figureHeight },
              { x: min, y: y + figureHeight },
              { x: min - 300, y: y },
            ]);
          };

          // Add custom tick for category

          //y -= figureHeight * 1.5;

          fitAxes();
          // Return interface for category.
          return {
            addSpan,
          };
        };
        const categories = events[signalId].map((t) => addCategory(t.y));
        const colorPalette = ColorPalettes.flatUI(categories.length);
        const fillStyles = categories.map((_, i) => new SolidFill({ color: ColorRGBA(0, 0, 0, 150) }));
        const strokeStyle = new SolidLine({
          fillStyle: new SolidFill({ color: ColorRGBA(0, 0, 0, 0) }),
          thickness: 1,
        });

        let index = 0;
        //const start = props.data.data_pulse[0] ? (props.data.data_pulse[0].x.getTime() - dateOriginTime) / 1000 : 0;
        events[signalId].forEach((event, i) => {
          const start = (new Date(event.start).getTime() - dateOriginTime) / 1;
          const end = (new Date(event.end).getTime() - dateOriginTime) / 1;
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
    xAxisList[0].setInterval(0, 300000);
    //setSignalsData(null);
  }, [signalsData, interval]);

  useEffect(() => {
    loadStudyData();
    loadStudySignals();
  }, []);

  useEffect(() => {
    if (studyData && studySignals.length) {
      if (interval.start) return;
      fetch(`https://legacy-sleepscreen-v3.azurewebsites.net/sleepstudy/api/sleepstudy?sleepstudyid=${studyId}`)
        .then((response) => response.json())
        .then((result) => {
          const newInterval = { start: result.StartTime, end: result.EndTime };
          setInterval(newInterval);
          loadSignalsData(newInterval);
          loadEvents(newInterval);
        });
    }
  }, [studyData, studySignals, loadSignalsData, loadEvents, interval.start]);

  useEffect(() => {
    if (signalsData) drawCharts();
  }, [signalsData, drawCharts]);

  return (
    <>
      {loading && <img style={{ margin: "100px auto", display: "block" }} id="loading-image" src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Loading_2.gif?20170503175831" alt="Loading..." />}
      <div style={{ minHeight: "600px", marginTop: "10px" }} id="chartContainer"></div>
    </>
  );
}

export default Charts;
