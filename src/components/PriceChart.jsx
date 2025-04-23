import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const PriceChart = ({ data, width, height, type = 'candles', theme = 'dark' }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Color themes
  const themes = {
    dark: {
      backgroundColor: '#1E1E1E',
      textColor: '#FFFFFF',
      gridColor: 'rgba(42, 46, 57, 0.5)',
      borderColor: '#333333',
      upColor: '#4CAF50',
      downColor: '#F44336',
      lineColor: '#2196F3',
    },
    light: {
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      gridColor: 'rgba(100, 100, 100, 0.2)',
      borderColor: '#EEEEEE',
      upColor: '#4CAF50',
      downColor: '#F44336',
      lineColor: '#2196F3',
    }
  };
  
  const colors = themes[theme];

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // Clear any existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const container = chartContainerRef.current;
    const finalWidth = width || container.clientWidth;
    const finalHeight = height || 400;

    // Create chart
    const chart = createChart(container, {
      width: finalWidth,
      height: finalHeight,
      layout: {
        backgroundColor: colors.backgroundColor,
        textColor: colors.textColor,
        fontSize: 12,
        fontFamily: 'Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: colors.gridColor, style: LineStyle.Dotted },
        horzLines: { color: colors.gridColor, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: colors.lineColor,
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: colors.lineColor,
        },
        horzLine: {
          color: colors.lineColor,
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: colors.lineColor,
        },
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Add series based on chart type
    if (type === 'candles' || type === 'candlestick') {
      const candleSeries = chart.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderVisible: false,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });
      candleSeries.setData(data);
      seriesRef.current = candleSeries;
    } else {
      const lineSeries = chart.addLineSeries({
        color: colors.lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: colors.textColor,
        crosshairMarkerBackgroundColor: colors.lineColor,
      });
      
      // Convert candle data to line data if needed
      const lineData = data.map(item => {
        if (item.close !== undefined) {
          return {
            time: item.time,
            value: item.close
          };
        }
        return item;
      });
      
      lineSeries.setData(lineData);
      seriesRef.current = lineSeries;
    }

    // Fit content on initial load
    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (chartRef.current) {
        const newWidth = container.clientWidth;
        chartRef.current.applyOptions({ width: newWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [data, width, height, type, theme]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ 
        width: '100%', 
        height: height || '400px' 
      }} 
    />
  );
};

export default PriceChart; 