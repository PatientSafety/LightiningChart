import React from "react";
import { useEffect } from "react";
const lcjs = require("@arction/lcjs");

// Extract required parts from LightningChartJS.
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

const titles = [
  "Certificate exams",
  "Interview",
  "Trainee training program",
  "Department competition training sessions",
  "Internet security training",
  "Scrum meeting",
  "Development meeting",
  "First Aid training",
  "Conquering the silence - How to improve your marketing",
];

let sliderMin = 0;
let sliderMax = 0;
let playbackSpeed = 1000;

// ----- Cache used styles -----
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

function ChartComponent(props) {
  useEffect(() => {
    if (!props.data.data_pulse || !props.data.data_pulse.length) return;
    // Create a Dashboard, with a single column and two rows.
    const dashboard = lightningChart()
      .Dashboard({
        theme: Themes.lightNew,
        numberOfColumns: 1,
        container: "chartContainer",
        numberOfRows: 14,
        height: 1000,
      })
      .setRowHeight(0, 5);
    // Set the row height for the top Cell in Dashboard.
    // As the bottom row is default (1), the top row height will be 3/4 of the
    // available Dashboard height.

    // Decide on an origin for DateTime axis.
    const dateOrigin = props.data.data_pulse[0].x;
    const dateOriginTime = dateOrigin.getTime();
    const dateOrigin2 = props.data.data_movement[0].x;
    const dateOriginTime2 = dateOrigin2.getTime();
    // Create a XY Chart.
    const chart = dashboard
      .createChartXY({
        columnIndex: 0,
        columnSpan: 1,
        rowIndex: 0,
        rowSpan: 3,
        theme: Themes.lightNew,
        onResize: (chart, width, height, engineWidth, engineHeight) => {
          console.log(767);
        },
      })
      .setPadding({
        right: 50,
      })

      .setTitle("Unit production comparison")
      .setFittingRectangleStrokeStyle(fittingRectangleStrokeStyle)
      .setZoomingRectangleFillStyle(zoomingRectangleFillStyle);

    chart.onBackgroundMouseClick((h) => console.log(h));

    // Cache reference to default axes and style them.
    const axisX = chart
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
      // Set view to 1 minute.
      .setInterval(0, 1000000)
      .setAnimationScroll(false);

    // Style the default Y Axis.
    const axisY1 = chart
      .getDefaultAxisY()
      .setStrokeStyle(axisYStrokeStyles[0])
      .setOverlayStyle(axisYStylesHighlight[0])
      .setNibOverlayStyle(axisYStylesHighlight[0])
      .setScrollStrategy(AxisScrollStrategies.expansion)
      // Modify the TickStrategy to remove gridLines from this Y Axis.
      .setInterval(0, 100);

    const chart2 = dashboard
      .createChartXY({
        columnIndex: 0,
        columnSpan: 1,
        rowIndex: 3,
        rowSpan: 4,
        theme: Themes.lightNew,
      })
      .setPadding({
        right: 50,
      })
      .setTitle("Chart2")
      // Style chart zooming rectangle.
      .setFittingRectangleStrokeStyle(fittingRectangleStrokeStyle)
      .setZoomingRectangleFillStyle(zoomingRectangleFillStyle);

    const chart3 = dashboard
      .createChartXY({
        columnIndex: 0,
        columnSpan: 1,
        rowIndex: 7,
        rowSpan: 4,
        theme: Themes.lightNew,
      })
      .setPadding({
        right: 50,
      })
      .setTitle("Chart3")
      // Style chart zooming rectangle.
      .setFittingRectangleStrokeStyle(fittingRectangleStrokeStyle)
      .setZoomingRectangleFillStyle(zoomingRectangleFillStyle);

    const axisY2 = chart2
      .getDefaultAxisY()
      .setStrokeStyle(axisYStrokeStyles[0])
      .setScrollStrategy(AxisScrollStrategies.expansion)
      .setInterval(0, 100)
      .setOverlayStyle(axisYStylesHighlight[0])
      .setNibOverlayStyle(axisYStylesHighlight[0])
      // Modify the TickStrategy to remove gridLines from this Y Axis.
      .setTickStrategy(
        // Use Numeric TickStrategy as base.
        AxisTickStrategies.Numeric,
        // Use mutator to modify the TickStrategy.
        (tickStrategy) =>
          tickStrategy
            // Modify Major Tick Style by using a mutator.
            .setMajorTickStyle((tickStyle) => tickStyle.setGridStrokeStyle(emptyLine))
        // Modify Minor Tick Style by using a mutator.
      );

    const axisY3 = chart3
      .getDefaultAxisY()
      .setStrokeStyle(axisYStrokeStyles[0])
      .setOverlayStyle(axisYStylesHighlight[0])
      .setNibOverlayStyle(axisYStylesHighlight[0])
      // Modify the TickStrategy to remove gridLines from this Y Axis.
      .setTickStrategy(
        // Use Numeric TickStrategy as base.
        AxisTickStrategies.Numeric,
        // Use mutator to modify the TickStrategy.
        (tickStrategy) =>
          tickStrategy
            // Modify Major Tick Style by using a mutator.
            .setMajorTickStyle((tickStyle) => tickStyle.setGridStrokeStyle(emptyLine))
        // Modify Minor Tick Style by using a mutator.
      );

    const axisX2 = chart2
      .getDefaultAxisX()
      .setOverlayStyle(axisXStyleHighlight)
      .setNibOverlayStyle(axisXStyleHighlight)
      // Set the X Axis to use DateTime TickStrategy
      .setTickStrategy(AxisTickStrategies.DateTime, (tickStrategy) => tickStrategy.setDateOrigin(dateOrigin2));

    const axisX3 = chart3
      .getDefaultAxisX()
      .setOverlayStyle(axisXStyleHighlight)
      .setNibOverlayStyle(axisXStyleHighlight)
      // Set the X Axis to use DateTime TickStrategy
      .setTickStrategy(AxisTickStrategies.DateTime);

    // Create series with explicit axes.
    const splineSeries1 = chart.addLineSeries({
      xAxis: axisX,
      yAxis: axisY1,
    });

    const splineSeries2 = chart2
      .addSplineSeries({
        xAxis: axisX2,
        yAxis: axisY2,
      })
      .setName("Movement")
      .setStrokeStyle(seriesStrokeStyles[0])
      .setPointFillStyle(() => seriesStrokeStyles[0].getFillStyle());

    const splineSeries3 = chart3.addLineSeries({
      xAxis: axisX3,
      yAxis: axisY3,
    });

    const zoomBandChart = dashboard.createZoomBandChart({
      columnIndex: 0,
      columnSpan: 1,
      rowIndex: 11,
      rowSpan: 3,
      // Specify the Axis for the Zoom Band Chart to follow.
      // The Zoom Band Chart will imitate all Series present in that Axis.
      axis: chart.getDefaultAxisX(),
    });

    // const zoomBandChart2 = dashboard.createZoomBandChart({
    //   columnIndex: 0,
    //   columnSpan: 1,
    //   rowIndex: 8,
    //   rowSpan: 1,
    //   // Specify the Axis for the Zoom Band Chart to follow.
    //   // The Zoom Band Chart will imitate all Series present in that Axis.
    //   axis: axisX,
    // });

    // zoomBandChart.getDefaultAxisY().setAnimationScroll(undefined);
    // zoomBandChart.band.setValueStart(300);
    // zoomBandChart.band.setValueEnd(500);

    const dataFrequency = 1000 * 60 * 60 * 24;
    splineSeries1.add(props.data.data_pulse.map((point) => ({ x: point.x.getTime() - dateOriginTime, y: point.y })));
    splineSeries2.add(props.data.data_movement.map((point) => ({ x: point.x.getTime() - dateOriginTime2, y: point.y })));
    splineSeries3.add(props.data.data_spo2.map((point) => ({ x: point.x.getTime() - dateOriginTime2, y: point.y })));

    axisY1.setInterval(splineSeries1.getYMin() - 10, splineSeries1.getYMax() + 10, true, true);
    axisY2.setInterval(splineSeries2.getYMin() - 10, splineSeries2.getYMax() + 10, true, true);
    axisY3.setInterval(splineSeries3.getYMin() - 10, splineSeries3.getYMax() + 10, true, true);

    // Enable AutoCursor auto-fill.
    chart.setAutoCursor((cursor) => {
      cursor.setResultTableAutoTextStyle(true).setTickMarkerXAutoTextStyle(true).setTickMarkerYAutoTextStyle(true);
    });

    const rectangles = chart.addRectangleSeries();

    let y = 0;

    const figureHeight = 12;
    const figureThickness = 12;
    const figureGap = figureThickness * 0.5;
    const fitAxes = () => {
      // Custom fitting for some additional margins
      axisY1.setInterval(y, figureHeight * 0.5);
    };

    let customYRange = figureHeight + figureGap * 1.6;
    const addCategory = (category) => {
      const categoryY = y;

      const addSpan = (i, min, max, index) => {
        // Add rect
        const rectDimensions = {
          x: min,
          y: category / 5 - figureHeight,
          width: max - min,
          height: figureHeight,
        };
        console.log(rectDimensions);
        // Add element for span labels
        const spanText = chart
          .addUIElement(UILayoutBuilders.Row, { x: axisX, y: axisY1 })
          .setOrigin(UIOrigins.Center)
          .setDraggingMode(UIDraggingModes.notDraggable)
          .setPosition({
            x: (min + max) / 2,
            y: rectDimensions.y + 5,
          })
          .setBackground((background) => background.setFillStyle(emptyFill).setStrokeStyle(emptyLine));

        spanText.addElement(
          UIElementBuilders.TextBox.addStyler((textBox) =>
            textBox
              .setTextFont((fontSettings) => fontSettings.setSize(13))
              .setText(titles[index])
              .setTextFillStyle(new SolidFill().setColor(ColorRGBA(255, 255, 255)))
          )
        );
        if (index != i) {
          customYRange = customYRange + figureHeight + 1;
        }
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

    // Return interface for span chart.

    // Use the interface for example.

    const categories = [380, 700, 520, 540, 860, 920, 530].map((name) => addCategory(name));
    const colorPalette = ColorPalettes.flatUI(categories.length);
    const fillStyles = categories.map((_, i) => new SolidFill({ color: colorPalette(i) }));
    const strokeStyle = new SolidLine({
      fillStyle: new SolidFill({ color: ColorRGBA(0, 0, 0) }),
      thickness: 1,
    });
    const spans = [
      [
        [10, 13],
        [16, 18],
      ],
      [[20, 27]],
      [[12, 20]],
      [[19, 27]],
      [
        [20, 22],
        [25, 29],
      ],
      [[41, 46]],
      [[39, 48]],
    ];

    let index = 0;
    const start = props.data.data_pulse[0] ? (props.data.data_pulse[0].x.getTime() - dateOriginTime) / 1000 : 0;
    spans.forEach((values, i) => {
      values.forEach((value, j) => {
        categories[i]
          .addSpan(i, start + value[0] * 25000, start + value[1] * 25000, index)
          .setFillStyle(fillStyles[i])
          .setStrokeStyle(strokeStyle);
        index = index + 1;
      });
    });

    // Add Chart to LegendBox
    // legend.add(chart);

    // const parser = (builder, series, Xvalue, Yvalue) => {
    //   return builder
    //     .addRow(series.getName())
    //     .addRow(axisX.formatValue(Xvalue))
    //     .addRow("Units: " + Math.floor(Yvalue));
    // };
    // splineSeries1.setCursorResultTableFormatter(parser);

    axisX.onScaleChange((start, end) => {
      console.log(`start value: ${start}, end value : ${end}`);
      axisX2.setInterval(start, end, false, true);
      axisX3.setInterval(start, end, false, true);
    });
  }, [props.data]);

  return <div style={{ height: "600px" }} id="chartContainer"></div>;
}

export default ChartComponent;
