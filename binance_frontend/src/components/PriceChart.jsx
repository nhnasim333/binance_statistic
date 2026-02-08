import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import PropTypes from "prop-types";

const PriceChart = ({ data = [], livePrice }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    try {
      // Create chart with v4 API
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
          rightOffset: 12,
          barSpacing: 3,
          fixLeftEdge: false,
          fixRightEdge: false,
          lockVisibleTimeRangeOnResize: true,
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
          seriesRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }, []);

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current) {
      console.log("⚠️ Chart series not ready yet");
      return;
    }

    if (data.length > 0) {
      console.log("📊 Formatting chart data:", data.length, "points");
      console.log("📊 Raw data sample:", data.slice(0, 2));
      
      try {
        const formattedData = data
          .map((item) => {
            // Handle both Date objects and string timestamps
            const timestamp = item.timestamp;
            let timeInSeconds;
            
            if (typeof timestamp === 'string') {
              timeInSeconds = Math.floor(new Date(timestamp).getTime() / 1000);
            } else if (timestamp instanceof Date) {
              timeInSeconds = Math.floor(timestamp.getTime() / 1000);
            } else if (typeof timestamp === 'number') {
              // If already in milliseconds
              timeInSeconds = Math.floor(timestamp / 1000);
            } else {
              console.error("❌ Invalid timestamp format:", timestamp);
              return null;
            }

            const price = parseFloat(item.price || item.close || 0);
            
            return {
              time: timeInSeconds,
              value: price,
            };
          })
          .filter(item => item !== null) // Remove invalid entries
          .sort((a, b) => a.time - b.time); // Sort by time ascending

        console.log("📊 Formatted data sample:", formattedData.slice(0, 3));
        console.log("📊 Formatted data time range:", {
          first: new Date(formattedData[0].time * 1000).toISOString(),
          last: new Date(formattedData[formattedData.length - 1].time * 1000).toISOString()
        });
        console.log("📊 Total formatted points:", formattedData.length);
        
        if (formattedData.length > 0) {
          seriesRef.current.setData(formattedData);
          
          // Fit the chart to show all data with a slight delay to ensure rendering
          if (chartRef.current) {
            setTimeout(() => {
              if (chartRef.current) {
                // Set visible range to show all data
                const timeScale = chartRef.current.timeScale();
                timeScale.setVisibleRange({
                  from: formattedData[0].time,
                  to: formattedData[formattedData.length - 1].time,
                });
                console.log("✅ Visible range set to show all data points");
              }
            }, 100);
          }
          
          console.log("✅ Chart data set successfully");
        } else {
          console.warn("⚠️ No valid data points after formatting");
        }
      } catch (error) {
        console.error("❌ Error formatting chart data:", error);
      }
    } else {
      console.log("📊 Clearing chart - no data");
      seriesRef.current.setData([]);
    }
  }, [data]);

  // Update live price
  useEffect(() => {
    if (seriesRef.current && livePrice && livePrice.price) {
      const timestamp = Math.floor((livePrice.timestamp || Date.now()) / 1000);
      const price = parseFloat(livePrice.price);
      
      if (!isNaN(price) && !isNaN(timestamp)) {
        seriesRef.current.update({
          time: timestamp,
          value: price,
        });
      }
    }
  }, [livePrice]);

  return (
    <div className="relative w-full" style={{ minHeight: '300px' }}>
      <div ref={chartContainerRef} className="rounded-lg overflow-hidden w-full h-full" />
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
