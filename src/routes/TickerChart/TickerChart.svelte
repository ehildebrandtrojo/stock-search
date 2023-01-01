<script>
  import daisyuiColors from "daisyui/src/colors/themes.js";
  import { Scatter } from "svelte-chartjs";
  import {
    Chart,
    LineElement,
    PointElement,
    ScatterController,
    LinearScale,
    LogarithmicScale,
    TimeSeriesScale,
    Decimation,
    Filler,
    Legend,
    Title,
    Tooltip,
  } from 'chart.js/dist/chart.mjs';
  import 'chartjs-adapter-date-fns';

  export let chart_data;

  Chart.register(
    LineElement,
    PointElement,
    ScatterController,
    LinearScale,
    LogarithmicScale,
    TimeSeriesScale,
    Decimation,
    Filler,
    Legend,
    Title,
    Tooltip
  );

  let backtest_code = '';

  const defaultColors = [
    "#3366CC",
    "#DC3912",
    "#FF9900",
    "#109618",
    "#990099",
    "#3B3EAC",
    "#0099C6",
  ];

  const date_string = date => new Date(date.toString().split('GMT')[0]+' UTC').toISOString().split('.')[0].replace("T", " ")

  // Is user using light/dark mode
  let color_mode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      color_mode = event.matches ? "dark" : "light";
    });

  const round_to_two = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  const curr_fn = (y, _) => y;
  const delta_fn = (y, wrt) => y - wrt;
  const pct_fn = (y, wrt) => (100 * (y - wrt)) / wrt;

  function generate_data(chart_data, fn, pointRadius = 0, prices = true) {
    function xypairs(arr1, arr2) {
      if (!arr1 === arr2) {
        throw new Error(message || "Array sizes not equal");
      }
      const pair = [];
      for (let i = 0; i < arr1.length; ++i) {
        pair.push({ x: arr1.at(i), y: fn(arr2.at(i), arr2.at(0)) });
      }
      return pair;
    }

    let data_params = {
      datasets: [],
    };

    let colors = {}
    for (const [symbol, ticker] of Object.entries(chart_data)) {
      colors[symbol] = defaultColors.at(data_params.datasets.length % defaultColors.length)

      data_params.datasets.push({
        label: symbol,
        data: xypairs(ticker.times, prices ? ticker.prices : ticker.vols),
        borderColor: symbol.slice(-9) == '-backtest' ? colors[symbol.slice(0, -9)] : colors[symbol],
        borderDash: symbol.slice(-9) == '-backtest' ? [10, 5] : [],
        showLine: pointRadius == 0 ? true : false,
        pointRadius,
      });
    }

    return data_params;
  };

  function generateOptions(ylabel, prefix, suffix, color_mode, scale) {
    return {
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
          ticks: {
            display: false,
            precision: 2,
            maxTicksLimit: 50,
            color: daisyuiColors[`[data-theme=${color_mode}]`]["base-content"],
            callback: function (value, index, ticks) {
              return value;
            },
          },
          grid: {
            color: "#4b5563",
          },
          title: {
            display: false,
            color: daisyuiColors[`[data-theme=${color_mode}]`]["base-content"],
            text: "Days",
            font: {
              size: 16,
            },
          },
        },
        y: {
          type: scale,
          ticks: {
            precision: 2,
            maxTicksLimit: 12,
            color: daisyuiColors[`[data-theme=${color_mode}]`]["base-content"],
            callback: function (value, index, ticks) {
              return prefix + value + suffix;
            },
          },
          grid: {
            color: "#4b5563",
          },
          title: {
            display: false,
            color: daisyuiColors[`[data-theme=${color_mode}]`]["base-content"],
            text: ylabel,
            font: {
              size: 16,
            },
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: daisyuiColors[`[data-theme=${color_mode}]`]["base-content"],
          },
        },
        decimation: {
          enabled: true,
          algorithm: "lttb",
          samples: 2500,
        },
        tooltip: {
          mode: 'index',
          intersect : false,
          callbacks: {
            label: function (context) {
              return prefix + round_to_two(context.parsed.y) + suffix + " at " + date_string(new Date(context.parsed.x));
            },
          },
        },
        hover: {
          mode: 'index',
          intersect: false
        },
        title: {
          display: true,
          text: ylabel,
          color: daisyuiColors[`[data-theme=${color_mode}]`]["base-content"],
          font: {
            size: 25,
          },
          padding: {
            top: 2,
            bottom: 2,
          },
        },
      },
    };
  };

  function backtest(backtest_code) {
    // Remove previous backtests
    for (const [symbol, _] of Object.entries(chart_data)) {
      if (symbol.slice(-9) == '-backtest')
        delete chart_data[symbol]
    }

    const rule = new Function ('prices', backtest_code);
    
    for (const [symbol, ticker] of Object.entries(chart_data)) {
      const earnings = [ticker.prices.at(0)]
      let invest = 0
      for (let i = 1; i < ticker.prices.length; i++) {
        invest = rule(ticker.prices.slice(0, i))
        earnings.push(earnings.at(i-1) + invest * (ticker.prices.at(i) - ticker.prices.at(i-1)))
      }
      chart_data[symbol + '-backtest'] = {
        'times' : ticker.times, 
        'prices' : earnings, 
        'vols' : Array(ticker.prices.length).fill(NaN)
      }
    }
  };
</script>

<div class="h-full">
  <div class="ds-carousel w-full h-[95%]">
    <div id="item1" class="ds-carousel-item w-full">
      <Scatter
        data={generate_data(chart_data, pct_fn)}
        options={generateOptions("Percent Gain", "", "%", color_mode, "linear")}
      />
    </div>
    <div id="item2" class="ds-carousel-item w-full">
      <Scatter
        data={generate_data(chart_data, delta_fn)}
        options={generateOptions("Price Change", "$", "", color_mode, "linear")}
      />
    </div>
    <div id="item3" class="ds-carousel-item w-full">
      <Scatter
        data={generate_data(chart_data, curr_fn)}
        options={generateOptions("Prices", "$", "", color_mode, "linear")}
      />
    </div>
    <div id="item4" class="ds-carousel-item w-full">
      <Scatter
        data={generate_data(chart_data, curr_fn, 1.5, false)}
        options={generateOptions("Volume", "", "M", color_mode, "logarithmic")}
      />
    </div>
    <div id="item5" class="ds-carousel-item flex-col w-full">
      <div class="ds-mockup-code grow flex">
          <textarea class="ds-textarea font-mono grow m-8" bind:value={backtest_code}
            placeholder="// Write your algo using `prices` returning [0, 1]

// e.g. for Moving Average
// Create function to calculate average
const average = array => array.reduce((a, b) => a + b, 0) / array.length;

// If short-term average is above long-term average invest
const [short, long] = [5, 15]
if (prices.length < long) return 0;
return average(prices.slice(-short)) > average(prices.slice(-long));"></textarea>
      </div>
      <button class="ds-btn m-4" on:click={() => backtest(backtest_code)}>Execute</button>
    </div>
  </div>
  <div class="flex justify-end w-full h-[5%] py-2 gap-2">
    <a href="#item1" class="ds-btn ds-btn-xs">% Gain</a>
    <a href="#item2" class="ds-btn ds-btn-xs">Price ∆</a>
    <a href="#item3" class="ds-btn ds-btn-xs">Prices</a>
    <a href="#item4" class="ds-btn ds-btn-xs">Volume</a>
    <a href="#item5" class="ds-btn ds-btn-xs">Backtest</a>
  </div>
</div>
