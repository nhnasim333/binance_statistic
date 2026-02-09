import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import PropTypes from "prop-types";

const PriceChart = ({ data = [], livePrice }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const lastUpdateRef = useRef({ time: 0, value: 0 });
  const [hasData, setHasData] = useState(false);

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
            // Skip items with missing data
            if (!item || typeof item !== 'object') {
              return null;
            }

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

            // Get price value
            const priceValue = item.price || item.close || item.value;
            const price = parseFloat(priceValue);
            
            // Validate both time and price are valid numbers
            if (isNaN(timeInSeconds) || isNaN(price) || price === null || price === undefined || price <= 0) {
              return null;
            }
            
            return {
              time: timeInSeconds,
              value: price,
            };
          })
          .filter(item => item !== null) // Remove invalid entries
          .sort((a, b) => a.time - b.time) // Sort by time ascending
          .reduce((acc, curr) => {
            // Deduplicate: keep only unique timestamps (last value for each timestamp)
            const lastItem = acc[acc.length - 1];
            if (!lastItem || lastItem.time !== curr.time) {
              acc.push(curr);
            } else {
              // Replace duplicate with latest value
              acc[acc.length - 1] = curr;
            }
            return acc;
          }, []);

        console.log("📊 Formatted data sample:", formattedData.slice(0, 3));
        console.log("📊 Formatted data time range:", {
          first: formattedData[0] ? new Date(formattedData[0].time * 1000).toISOString() : 'N/A',
          last: formattedData[formattedData.length - 1] ? new Date(formattedData[formattedData.length - 1].time * 1000).toISOString() : 'N/A'
        });
        console.log("📊 Total formatted points:", formattedData.length);
        
        if (formattedData.length > 0) {
          // Strict validation: ensure all data points are valid
          const isValidData = formattedData.every(point => 
            point && 
            typeof point.time === 'number' && 
            typeof point.value === 'number' && 
            !isNaN(point.time) && 
            !isNaN(point.value) &&
            isFinite(point.time) &&
            isFinite(point.value) &&
            point.value !== null &&
            point.value !== undefined &&
            point.value > 0 &&
            point.time > 0
          );

          if (!isValidData) {
            console.error("❌ Invalid data detected, skipping chart update");
            const invalidPoints = formattedData.filter(point => 
              !point || 
              typeof point.time !== 'number' || 
              typeof point.value !== 'number' || 
              isNaN(point.time) || 
              isNaN(point.value) ||
              !isFinite(point.time) ||
              !isFinite(point.value) ||
              point.value === null ||
              point.value === undefined ||
              point.value <= 0 ||
              point.time <= 0
            );
            console.log("❌ Invalid points count:", invalidPoints.length);
            if (invalidPoints.length > 0) {
              console.log("❌ First invalid point:", invalidPoints[0]);
            }
            setHasData(false);
            return;
          }

          try {
            // Final sanity check before calling setData
            if (!Array.isArray(formattedData) || formattedData.length === 0) {
              console.error("❌ Cannot call setData with invalid array");
              setHasData(false);
              return;
            }

            // Log first and last points for debugging
            console.log("📊 Calling setData with", formattedData.length, "points");
            console.log("📊 First point:", formattedData[0]);
            console.log("📊 Last point:", formattedData[formattedData.length - 1]);

            seriesRef.current.setData(formattedData);
            setHasData(true);
            
            // Store the last data point for reference
            const lastPoint = formattedData[formattedData.length - 1];
            lastUpdateRef.current = { time: lastPoint.time, value: lastPoint.value };
          } catch (error) {
            console.error("❌ Error calling setData:", error);
            console.error("❌ Data that caused error:", JSON.stringify(formattedData.slice(0, 5)));
            setHasData(false);
            return;
          }
          
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
            }, 0);
          }
        }
      } catch (error) {
        console.error("❌ Error formatting chart data:", error);
        setHasData(false);
      }
    } else {
      // Don't clear chart with empty array - it causes crashes
      // Just mark as no data and skip update
      console.log("📊 No data available - skipping chart update");
      setHasData(false);
    }
  }, [data]);

  // Update live price with debouncing and validation
  useEffect(() => {
    // Only update if we have chart data already
    if (!seriesRef.current || !hasData || !livePrice || !livePrice.price) {
      return;
    }

    const timestamp = Math.floor((livePrice.timestamp || Date.now()) / 1000);
    const price = parseFloat(livePrice.price);
    
    // Validate both timestamp and price
    if (isNaN(price) || isNaN(timestamp) || price === null || price === undefined || price <= 0) {
      return;
    }

    // Skip if same as last update (prevent redundant updates)
    if (lastUpdateRef.current.time === timestamp && lastUpdateRef.current.value === price) {
      return;
    }

    // Skip if timestamp is older than last update
    if (timestamp < lastUpdateRef.current.time) {
      return;
    }

    try {
      // Final validation before update
      const updateData = {
        time: timestamp,
        value: price,
      };
      
      // Ensure no null/undefined values
      if (updateData.time === null || updateData.time === undefined || 
          updateData.value === null || updateData.value === undefined) {
        console.warn("⚠️ Skipping update - null values detected");
        return;
      }
      
      seriesRef.current.update(updateData);
      
      // Update last update reference
      lastUpdateRef.current = { time: timestamp, value: price };
    } catch (error) {
      // Silently handle chart update errors in production
      if (import.meta.env.DEV) {
        console.error("❌ Error updating live price:", error);
      }
    }
  }, [livePrice, hasData]);

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
