
import React, { useEffect, useRef, useState } from 'react';
import { storageService } from '../services/storageService';
import { ActivityHeatmap } from '../components/ActivityHeatmap';

declare const Chart: any;

export const Analytics: React.FC = () => {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('week');
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const distractionChartRef = useRef<HTMLCanvasElement>(null);
  
  // Advanced Matrices Refs
  const radarChartRef = useRef<HTMLCanvasElement>(null);
  const sleepBarChartRef = useRef<HTMLCanvasElement>(null); // Renamed for clarity, was scatterChartRef
  const stackedBarChartRef = useRef<HTMLCanvasElement>(null);

  const chartsRef = useRef<any[]>([]);

  useEffect(() => {
    // Ensure previous charts are destroyed before re-rendering
    chartsRef.current.forEach(chart => {
      if (chart) chart.destroy();
    });
    chartsRef.current = [];

    // Load Heatmap Data (Default to 1 year for full effect)
    const hData = storageService.getActivityHeatmap(364); 
    setHeatmapData(hData);

    initCharts();

    return () => {
      // Cleanup charts on unmount or re-render
      chartsRef.current.forEach(chart => {
        if (chart) chart.destroy();
      });
      chartsRef.current = [];
    };
  }, [range]); // Re-run when range changes

  const initCharts = () => {
    // Determine days to look back based on range
    let daysToLookBack = 7;
    let isYearly = false;

    if (range === 'month') daysToLookBack = 30;
    if (range === 'year') {
      daysToLookBack = 365;
      isYearly = true;
    }

    // 1. Fetch History Data
    // For Year, we use a special aggregated fetch to avoid 365 data points on x-axis
    let dataPoints: any[] = [];
    
    if (isYearly) {
      dataPoints = storageService.getYearlyHistory();
    } else {
      dataPoints = storageService.getDailyHistory(daysToLookBack);
    }

    // Extract Arrays for Charts
    const labels = dataPoints.map(d => d.label);
    const studyData = dataPoints.map(d => d.studyHours);
    const tasksData = dataPoints.map(d => d.tasksCompleted);
    const sleepData = dataPoints.map(d => d.sleepHours);

    // Distributions (These always look back N days raw)
    const { labels: topicLabels, data: topicData } = storageService.getStudyTopicDistribution(daysToLookBack);
    const { labels: distLabels, data: distData } = storageService.getDistractionDistribution(daysToLookBack);
    
    // --- Prepare Advanced Data ---
    
    // Radar Data (Life Balance) - Average over the period
    const totalPoints = dataPoints.length || 1;
    const avgStudy = dataPoints.reduce((sum, d) => sum + d.studyHours, 0) / totalPoints;
    const avgWorkout = dataPoints.reduce((sum, d) => sum + d.workoutMins, 0) / totalPoints;
    const avgMind = dataPoints.reduce((sum, d) => sum + d.mindfulnessMins, 0) / totalPoints;
    const avgSleep = dataPoints.reduce((sum, d) => sum + d.sleepHours, 0) / totalPoints;

    // Normalize scores (0-100)
    // Benchmarks (Monthly/Yearly aggregates need to be normalized per day average, which they are)
    // Daily benchmarks: Study 6h, Workout 60m, Meditation 20m, Sleep 8h
    const scoreIntellect = Math.min((avgStudy / 6) * 100, 100);
    const scoreBody = Math.min((avgWorkout / 60) * 100, 100);
    const scoreMind = Math.min((avgMind / 20) * 100, 100);
    const scoreRest = Math.min((avgSleep / 8) * 100, 100);

    // Stacked Bar Data (Time Distribution)
    const stackStudy = dataPoints.map(d => d.studyHours);
    const stackWorkout = dataPoints.map(d => Number((d.workoutMins / 60).toFixed(2)));
    const stackDistraction = dataPoints.map(d => Number((d.distractionMins / 60).toFixed(2)));


    // Common Chart Options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#64748b', font: { family: 'Inter', size: 10 } }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(100, 116, 139, 0.1)' },
          ticks: { color: '#64748b', font: { size: 10 } },
          beginAtZero: true
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 10 } }
        }
      }
    };

    // --- Chart Initializations ---

    // 1. Line Chart - Study Hours
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d');
      const gradient = ctx!.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(45, 212, 191, 0.3)');
      gradient.addColorStop(1, 'rgba(45, 212, 191, 0.0)');

      chartsRef.current.push(new Chart(lineChartRef.current, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Study Hours',
            data: studyData,
            borderColor: '#2dd4bf',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#2dd4bf',
            pointBorderColor: '#fff',
            pointRadius: isYearly ? 4 : 3
          }]
        },
        options: commonOptions
      }));
    }

    // 2. Bar Chart - Tasks Completed
    if (barChartRef.current) {
      chartsRef.current.push(new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Tasks Done',
            data: tasksData,
            backgroundColor: '#a855f7',
            borderRadius: 4,
            borderSkipped: false,
            barThickness: isYearly ? undefined : 12 // Auto width for year view
          }]
        },
        options: commonOptions
      }));
    }

    // 3. Doughnut Chart - Study Distribution
    if (doughnutChartRef.current) {
      chartsRef.current.push(new Chart(doughnutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: topicLabels.length ? topicLabels : ['No Data'],
          datasets: [{
            data: topicData.length ? topicData : [1],
            backgroundColor: [
              '#2dd4bf', // Teal
              '#a855f7', // Purple
              '#f97316', // Orange
              '#3b82f6', // Blue
              '#ef4444', // Red
              '#10b981'  // Emerald
            ],
            borderColor: 'transparent',
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#64748b', font: { size: 10 }, boxWidth: 10 }
            }
          }
        }
      }));
    }

    // 4. Doughnut Chart - Distraction Breakdown
    if (distractionChartRef.current) {
      chartsRef.current.push(new Chart(distractionChartRef.current, {
        type: 'doughnut',
        data: {
          labels: distLabels.length ? distLabels : ['Clean Streak'],
          datasets: [{
            data: distData.length ? distData : [1],
            backgroundColor: [
              '#ef4444', // Red
              '#f87171', // Red 400
              '#fca5a5', // Red 300
              '#b91c1c', // Red 700
              '#991b1b', // Red 800
            ],
            borderColor: 'transparent',
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#64748b', font: { size: 10 }, boxWidth: 10 }
            }
          }
        }
      }));
    }

    // 5. Radar Chart - Life Balance
    if (radarChartRef.current) {
        chartsRef.current.push(new Chart(radarChartRef.current, {
            type: 'radar',
            data: {
                labels: ['Intellect', 'Body', 'Mind', 'Rest'],
                datasets: [{
                    label: 'Life Balance Score',
                    data: [scoreIntellect, scoreBody, scoreMind, scoreRest],
                    backgroundColor: 'rgba(45, 212, 191, 0.2)',
                    borderColor: '#2dd4bf',
                    pointBackgroundColor: '#2dd4bf',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#2dd4bf'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(100, 116, 139, 0.1)' },
                        grid: { color: 'rgba(100, 116, 139, 0.1)' },
                        pointLabels: { color: '#64748b', font: { size: 11 } },
                        ticks: { display: false, backdropColor: 'transparent' },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        }));
    }

    // 6. Bar Chart - Sleep Duration
    if (sleepBarChartRef.current) {
        chartsRef.current.push(new Chart(sleepBarChartRef.current, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sleep Hours',
                    data: sleepData,
                    backgroundColor: '#818cf8', // indigo-400
                    borderRadius: 4,
                    borderSkipped: false,
                    barThickness: isYearly ? undefined : 12,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(100, 116, 139, 0.1)' },
                        ticks: { color: '#64748b', font: { size: 10 } },
                        beginAtZero: true,
                        title: { display: true, text: 'Hours', color: '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 10 } }
                    }
                }
            }
        }));
    }

    // 7. Stacked Bar - Time Distribution
    if (stackedBarChartRef.current) {
        chartsRef.current.push(new Chart(stackedBarChartRef.current, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Study',
                        data: stackStudy,
                        backgroundColor: '#2dd4bf',
                    },
                    {
                        label: 'Workout',
                        data: stackWorkout,
                        backgroundColor: '#f97316',
                    },
                    {
                        label: 'Distraction',
                        data: stackDistraction,
                        backgroundColor: '#ef4444',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 10 } }
                    },
                    y: {
                        stacked: true,
                        grid: { color: 'rgba(100, 116, 139, 0.1)' },
                        ticks: { color: '#64748b', font: { size: 10 } },
                        title: { display: true, text: 'Hours', color: '#64748b' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#64748b', font: { size: 10 }, boxWidth: 10 }
                    }
                }
            }
        }));
    }
  };

  return (
    <div className="pb-24 animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-main">Analytics</h2>
        <select 
          value={range}
          onChange={(e) => setRange(e.target.value as 'week' | 'month' | 'year')}
          className="bg-dark-bg border border-white/10 rounded-lg text-xs px-3 py-1.5 text-text-main focus:outline-none focus:border-accent-teal cursor-pointer"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year (Monthly)</option>
        </select>
      </div>

      {/* Row 0: Heatmap (New) */}
      <div className="w-full">
         <ActivityHeatmap data={heatmapData} />
      </div>

      {/* Row 1: Main Trend */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
        <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
          <i className="fa-solid fa-clock text-accent-teal"></i> Study Trend
        </h3>
        <div className="h-64">
          <canvas ref={lineChartRef}></canvas>
        </div>
      </div>

      {/* Row 2: Advanced Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Life Balance Radar */}
         <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
            <i className="fa-solid fa-scale-balanced text-emerald-400"></i> Life Balance Matrix
          </h3>
          <div className="h-64 flex items-center justify-center">
             <canvas ref={radarChartRef}></canvas>
          </div>
        </div>

        {/* Time Distribution Stacked */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-blue-400"></i> Daily Time Distribution
          </h3>
          <div className="h-64">
            <canvas ref={stackedBarChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Row 3: Correlations & Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Sleep vs Study Correlation */}
         <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
            <i className="fa-solid fa-moon text-indigo-400"></i> Daily Sleep Duration
          </h3>
          <div className="h-56">
             <canvas ref={sleepBarChartRef}></canvas>
          </div>
        </div>

        {/* Task Productivity */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-purple-400"></i> Task Completion
          </h3>
          <div className="h-56">
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Row 4: Breakdown Doughnuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-orange-400"></i> Focus Areas
          </h3>
          <div className="h-48 flex items-center justify-center">
            {storageService.getStudyTopicDistribution(range === 'year' ? 365 : range === 'month' ? 30 : 7).data.length === 0 ? (
              <div className="text-text-muted text-xs">No study data recorded yet</div>
            ) : (
              <canvas ref={doughnutChartRef}></canvas>
            )}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
            <i className="fa-solid fa-ban text-red-500"></i> Distractions
          </h3>
          <div className="h-48 flex items-center justify-center">
            {storageService.getDistractionDistribution(range === 'year' ? 365 : range === 'month' ? 30 : 7).data.length === 0 ? (
              <div className="text-text-muted text-xs">No distractions logged! Good job.</div>
            ) : (
              <canvas ref={distractionChartRef}></canvas>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
