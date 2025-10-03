'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { ChartData } from '@/types/emergency';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartProps {
  data: ChartData;
  title: string;
}

const colors = {
  primary: 'rgba(102, 126, 234, 0.8)',
  primaryBorder: 'rgba(102, 126, 234, 1)',
  secondary: 'rgba(255, 107, 107, 0.8)',
  secondaryBorder: 'rgba(255, 107, 107, 1)',
  success: 'rgba(78, 205, 196, 0.8)',
  successBorder: 'rgba(78, 205, 196, 1)',
  warning: 'rgba(69, 183, 209, 0.8)',
  warningBorder: 'rgba(69, 183, 209, 1)',
  info: 'rgba(150, 206, 180, 0.8)',
  infoBorder: 'rgba(150, 206, 180, 1)',
};

export function BarChart({ data, title }: ChartProps) {
  const chartData: ChartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || colors.primary,
      borderColor: dataset.borderColor || colors.primaryBorder,
      borderWidth: dataset.borderWidth || 1,
    })),
  };

  return (
    <div className="relative h-80">
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16,
                weight: 'bold',
              },
            },
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
            },
          },
        }}
      />
    </div>
  );
}

export function DoughnutChart({ data, title }: ChartProps) {
  const chartData: ChartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || [
        colors.secondary,
        colors.success,
        colors.warning,
        colors.info,
        colors.primary,
      ],
      borderColor: dataset.borderColor || [
        colors.secondaryBorder,
        colors.successBorder,
        colors.warningBorder,
        colors.infoBorder,
        colors.primaryBorder,
      ],
      borderWidth: dataset.borderWidth || 2,
    })),
  };

  return (
    <div className="relative h-80">
      <Doughnut
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16,
                weight: 'bold',
              },
            },
          },
        }}
      />
    </div>
  );
}

export function PieChart({ data, title }: ChartProps) {
  const chartData: ChartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || [
        colors.primary,
        colors.secondary,
        colors.success,
        colors.warning,
        colors.info,
      ],
      borderColor: dataset.borderColor || [
        colors.primaryBorder,
        colors.secondaryBorder,
        colors.successBorder,
        colors.warningBorder,
        colors.infoBorder,
      ],
      borderWidth: dataset.borderWidth || 2,
    })),
  };

  return (
    <div className="relative h-80">
      <Pie
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16,
                weight: 'bold',
              },
            },
          },
        }}
      />
    </div>
  );
}
