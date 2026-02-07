import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import PropTypes from "prop-types";

const PriceChart = ({ symbol, data = [], livePrice }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#1E2329" },
        textColor: "#B7BDC6",
      },
      grid: {
        vertLines: { color: "#2B3139" },
        horzLines: { color: "#2B3139" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#2B3139",
      },
      rightPriceScale: {
        borderColor: "#2B3139",
      },
    });

    // Create area series
    const series = chart.addAreaSeries({
      topColor: "rgba(252, 213, 53, 0.4)",
      bottomColor: "rgba(252, 213, 53, 0.0)",
      lineColor: "#FCD535",
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const formattedData = data.map((item) => ({
        time: Math.floor(new Date(item.timestamp).getTime() / 1000),
        value: item.price || item.close || 0,
      }));
      seriesRef.current.setData(formattedData);
    }
  }, [data]);

  // Update live price
  useEffect(() => {
    if (seriesRef.current && livePrice && livePrice.price) {
      const timestamp = Math.floor((livePrice.timestamp || Date.now()) / 1000);
      seriesRef.current.update({
        time: timestamp,
        value: livePrice.price,
      });
    }
  }, [livePrice]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />
    </div>
  );
};

PriceChart.propTypes = {
  symbol: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object),
  livePrice: PropTypes.shape({
    price: PropTypes.number,
    timestamp: PropTypes.number,
  }),
};

export default PriceChart;
