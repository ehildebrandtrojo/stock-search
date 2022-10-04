<script>
  import { Line } from "svelte-chartjs";
  import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LineController,
    LinearScale,
    TimeSeriesScale,
    Decimation,
    Filler,
  } from "chart.js";
  import 'chartjs-adapter-date-fns';

  export let chart_data;
  let data_params, options_params;

  ChartJS.register(
    LineElement,
    PointElement,
    LineController,
    LinearScale,
    TimeSeriesScale,
    Decimation,
    Filler
  );

  let borderColor = (alpha) =>
      chart_data.at(-1).y > chart_data.at(0).y
      ? `rgba(16, 185, 129, ${alpha})`
      : `rgba(225, 29, 72, ${alpha})`;

  $: data_params = {
    datasets: [
      {
        data: chart_data,
        backgroundColor: borderColor(0.1),
        fill: true,
        borderColor: borderColor(1),
        pointRadius: 0,
      },
    ],
  };

  options_params = {
    animation: false,
    parsing: false,
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    maintainAspectRatio: false,
    responsive: true,
    indexAxis: "x",
    scales: {
      x: {
        type: "timeseries",
        display: false,
      },
      y: {
        display: false,
      },
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: "lttb",
        samples: 30,
        threshold: 0.5,
      },
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };
</script>

<Line data={data_params} options={options_params} />
