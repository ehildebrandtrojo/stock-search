<script>
  import { goto } from '$app/navigation';
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

  const defaultColors = [
    "#3366CC",
    "#DC3912",
    "#FF9900",
    "#109618",
    "#990099",
    "#3B3EAC",
    "#0099C6",
  ];

  let backtest_logic = '';
  let backtest_title = '';

  let algorithms = {
    'Yesterday' : `return prices.at(-1) > prices.at(-2);`,
    'Moving Average' : `// Each data point corresponds to a 30 min interval
// Needs at least ~7.5 hrs of data

// Create function to calculate average
const average = array => array.reduce((a, b) => a + b, 0) / array.length;

// If short-term average is above long-term average invest
const [short, long] = [5, 15] // 2.5 hrs (short) and 7.5 hrs (long)
if (prices.length < long) return 0;
return average(prices.slice(-short)) > average(prices.slice(-long));`,
  }

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
    function elementwise_mult(arr1, arr2) {
      if (arr1.length !== arr2.length) {
        throw new Error(message || "Array sizes not equal");
      }
      let finalArr = [];
      for (var i = 0; i < arr1.length; i++) {
        finalArr[i] = arr1[i] * arr2[i] / 1000;
      }
      return finalArr
    }

    function xypairs(arr1, arr2) {
      if (arr1.length !== arr2.length) {
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
        data: xypairs(ticker.times, prices ? ticker.prices : elementwise_mult(ticker.prices, ticker.vols)),
        borderColor: symbol.includes('-') ? colors[symbol.slice(0, symbol.indexOf('-'))] : colors[symbol],
        borderDash: symbol.includes('-') ? [10, 5] : [],
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

  function backtest(backtest_logic) {
    // Remove previous backtests
    for (const [symbol, _] of Object.entries(chart_data)) {
      if (symbol.includes('-'))
        delete chart_data[symbol]
    }

    const rule = new Function ('prices', backtest_logic);
    
    for (const [symbol, ticker] of Object.entries(chart_data)) {
      const earnings = [ticker.prices.at(0)]
      let invest = 0
      for (let i = 1; i < ticker.prices.length; i++) {
        invest = rule(ticker.prices.slice(0, i))
        earnings.push(earnings.at(i-1) + invest * (ticker.prices.at(i) - ticker.prices.at(i-1)))
      }
      chart_data[symbol + '-' + backtest_title] = {
        'times' : ticker.times, 
        'prices' : earnings, 
        'vols' : Array(ticker.prices.length).fill(NaN)
      }
    }
  };

  function activate_algo(title, logic) {
    backtest_title = title
    backtest_logic = logic
  }

  function add_algo(title, logic) {
    if (title !== '') 
      algorithms[title] = logic
  }
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
        data={generate_data(chart_data, curr_fn, 0, false)}
        options={generateOptions("Volume ($)", "$", "M", color_mode, "linear")}
      />
    </div>
    <div id="item5" class="ds-carousel-item flex-col w-full">
      <div class="flex">
        <div class="grow">
        </div>
        <div class="ds-dropdown ds-dropdown-end">
          <label tabindex="0" class="ds-btn m-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg> 
            Algorithm
          </label>
          <ul tabindex="0" class="ds-dropdown-content ds-menu p-2 shadow bg-base-200 rounded-box w-52">
            {#each Object.entries(algorithms) as algorithm}
              <li><button class="ds-button" on:click={() => activate_algo(...algorithm)}>{algorithm[0]}</button></li>
            {/each}
            <li>
              <button class="ds-button" on:click={() => add_algo(backtest_title, backtest_logic)}>               
                Save Algorithm
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div class="ds-mockup-code grow flex flex-col">
        <input type="text" placeholder="Title" class="ds-input font-mono mx-4 my-2" bind:value={backtest_title} />
        <textarea class="ds-textarea font-mono grow mx-4 my-2" bind:value={backtest_logic}
          placeholder="// Write your algo using `prices` returning [0, 1] or select one from the Algorithm tab"></textarea>
      </div>
      <div class="flex">
        <div class="grow"></div>
        <button class="ds-btn my-2" on:click={() => {backtest(backtest_logic); goto("/#item1")}}>Execute</button>
      </div>
    </div>
  </div>
  <div class="flex justify-end w-full h-[5%] py-2 gap-2">
    <button class="ds-btn ds-btn-xs" on:click={() => goto("/#item1")}>% Gain</button>
    <button class="ds-btn ds-btn-xs" on:click={() => goto("/#item2")}>Price ∆</button>
    <button class="ds-btn ds-btn-xs" on:click={() => goto("/#item3")}>Prices</button>
    <button class="ds-btn ds-btn-xs" on:click={() => goto("/#item4")}>Volume ($)</button>
    <button class="ds-btn ds-btn-xs" on:click={() => goto("/#item5")}>Backtest</button>
  </div>
</div>
